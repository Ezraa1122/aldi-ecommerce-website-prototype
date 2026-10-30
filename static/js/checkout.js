/* Checkout (AECWR-27 UI, AECWR-28 backend).
   - customers must be logged in (guests are sent to login and brought back)
   - the order summary comes from the shared cart (AldiCart in site.js)
   - every field is validated before the order is sent
   - the order is saved by POST /api/checkout, which prices items from the product database
   - payment is simulated: no money is taken */
document.addEventListener('DOMContentLoaded', () => {

    if (!AldiAuth.requireLogin('checkout')) {
        return;
    }

    const checkoutForm = document.getElementById('checkout-form');
    const orderItems = document.getElementById('order-items');
    const orderTotal = document.getElementById('order-total');
    const checkoutError = document.getElementById('checkout-error');
    const userInfo = document.getElementById('user-info');
    const emailInput = document.getElementById('email');
    const submitButton = checkoutForm.querySelector('button[type="submit"]');
    const money = AldiUI.formatMoney;

    const userEmail = AldiAuth.email();
    userInfo.textContent = `Logged in as ${userEmail}`;
    emailInput.value = userEmail;

    const cart = AldiCart.items();

    if (cart.length === 0) {
        document.getElementById('checkout-layout').hidden = true;
        document.getElementById('checkout-empty').hidden = false;
        return;
    }

    function renderOrderSummary() {
        orderItems.innerHTML = '';

        cart.forEach(product => {
            const item = document.createElement('div');
            item.className = 'order-item';
            item.innerHTML = `
                <span>${AldiUI.escapeHTML(product.name)} × ${product.quantity}</span>
                <strong>${money(product.priceCents * product.quantity)}</strong>
            `;
            orderItems.appendChild(item);
        });

        orderTotal.textContent = money(AldiCart.totalCents());
    }

    /* Validation rules: each returns true or the message to show under the field. */
    const rules = {
        'full-name': value => value.length >= 2 || 'Please enter your full name.',
        'email': value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Please enter a valid email address.',
        'address': value => value.length >= 3 || 'Please enter your street and house number.',
        'city': value => value.length >= 2 || 'Please enter your city.',
        'postcode': value => /^[A-Za-z0-9 -]{4,10}$/.test(value) || 'Please enter a valid postcode, e.g. 10115.'
    };

    function validateField(id) {
        const input = document.getElementById(id);
        const message = document.querySelector(`[data-error-for="${id}"]`);
        const result = rules[id](input.value.trim());
        const valid = result === true;
        input.setAttribute('aria-invalid', valid ? 'false' : 'true');
        message.textContent = valid ? '' : result;
        return valid;
    }

    // Re-check a field when the customer leaves it, so errors disappear once fixed.
    Object.keys(rules).forEach(id => {
        document.getElementById(id).addEventListener('blur', () => {
            if (document.getElementById(id).value.trim()) {
                validateField(id);
            }
        });
    });

    checkoutForm.addEventListener('submit', async event => {
        event.preventDefault();
        checkoutError.textContent = '';

        const invalid = Object.keys(rules).filter(id => !validateField(id));
        if (invalid.length) {
            checkoutError.textContent = 'Please correct the highlighted fields.';
            document.getElementById(invalid[0]).focus();
            return;
        }

        const value = id => document.getElementById(id).value.trim();
        const customer = {
            fullName: value('full-name'),
            email: value('email'),
            address: value('address'),
            city: value('city'),
            postcode: value('postcode')
        };
        const paymentMethod = checkoutForm.querySelector('input[name="payment"]:checked').value;

        submitButton.disabled = true;
        submitButton.textContent = 'Processing simulated payment…';

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer,
                    items: cart.map(product => ({
                        productId: product.id,
                        name: product.name,
                        quantity: product.quantity
                    }))
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Checkout failed. Please try again.');
            }

            // Receipt uses the prices confirmed by the server.
            const receipt = {
                reference: result.reference,
                createdAt: result.createdAt,
                paymentMethod,
                customer,
                items: result.items.map(item => ({
                    name: item.name,
                    unitPriceCents: item.unitPriceCents,
                    quantity: item.quantity
                }))
            };

            sessionStorage.setItem('aldiDemoReceipt', JSON.stringify(receipt));
            AldiCart.clear();
            window.location.href = '/receipt.html';

        } catch (error) {
            checkoutError.textContent = error instanceof TypeError
                ? 'Cannot reach the server. Please make sure the backend is running and try again.'
                : error.message;
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order';
        }
    });

    renderOrderSummary();
});

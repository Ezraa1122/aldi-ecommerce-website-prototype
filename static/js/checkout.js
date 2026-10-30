document.addEventListener('DOMContentLoaded', () => {

    const checkoutForm = document.getElementById('checkout-form');
    const orderItems = document.getElementById('order-items');
    const orderTotal = document.getElementById('order-total');
    const checkoutError = document.getElementById('checkout-error');
    const userInfo = document.getElementById('user-info');
    const emailInput = document.getElementById('email');

    const userEmail = localStorage.getItem('userEmail');

    if (userEmail) {
        userInfo.textContent = `Logged in as ${userEmail}`;
        emailInput.value = userEmail;
    }

    const cart = [
        {
            id: 1,
            name: 'ALDI Milk',
            price: 1.49,
            quantity: 1
        },
        {
            id: 2,
            name: 'Chocolate Cookies',
            price: 2.29,
            quantity: 2
        }
    ];

    function renderOrderSummary() {

        orderItems.innerHTML = '';

        cart.forEach(product => {

            const item = document.createElement('div');
            item.className = 'order-item';

            const itemTotal = product.price * product.quantity;

            item.innerHTML = `
                <span>
                    ${product.name} × ${product.quantity}
                </span>

                <strong>
                    €${itemTotal.toFixed(2)}
                </strong>
            `;

            orderItems.appendChild(item);
        });

        const total = cart.reduce((sum, product) => {
            return sum + product.price * product.quantity;
        }, 0);

        orderTotal.textContent = `€${total.toFixed(2)}`;
    }

    checkoutForm.addEventListener('submit', event => {

        event.preventDefault();

        checkoutError.textContent = '';

        const fullName = document
            .getElementById('full-name')
            .value
            .trim();

        const email = document
            .getElementById('email')
            .value
            .trim();

        const address = document
            .getElementById('address')
            .value
            .trim();

        const city = document
            .getElementById('city')
            .value
            .trim();

        const postcode = document
            .getElementById('postcode')
            .value
            .trim();

        if (
            !fullName ||
            !email ||
            !address ||
            !city ||
            !postcode
        ) {
            checkoutError.textContent =
                'Please fill out all required fields.';

            return;
        }

        const receipt = {
            reference: 'DEMO-' + crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            customer: {fullName, email, address, city, postcode},
            items: cart.map(product => ({
                name: product.name,
                unitPriceCents: Math.round(product.price * 100),
                quantity: product.quantity
            }))
        };
        try {
            sessionStorage.setItem('aldiDemoReceipt', JSON.stringify(receipt));
            window.location.href = '/receipt.html';
        } catch (error) {
            checkoutError.textContent = 'Unable to save the demo receipt. Please allow browser storage and try again.';
        }
    });

    renderOrderSummary();
});

checkoutForm.addEventListener('submit', async event => {
        event.preventDefault();
        checkoutError.textContent = '';

        const fullName = document.getElementById('full-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const postcode = document.getElementById('postcode').value.trim();

        if (!fullName || !email || !address || !city || !postcode) {
            checkoutError.textContent = 'Please fill out all required fields.';
            return;
        }

        const payload = {
            customer: { fullName, email, address, city, postcode },
            items: cart.map(product => ({
                name: product.name,
                unitPriceCents: Math.round(product.price * 100),
                quantity: product.quantity
            }))
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Checkout failed.');
            }

            // Save receipt details for display on receipt.html
            const receipt = {
                reference: result.reference,
                createdAt: result.createdAt,
                customer: payload.customer,
                items: payload.items
            };

            sessionStorage.setItem('aldiDemoReceipt', JSON.stringify(receipt));
            window.location.href = '/receipt.html';

        } catch (error) {
            checkoutError.textContent = error.message || 'Unable to process checkout. Please try again.';
        }
    });
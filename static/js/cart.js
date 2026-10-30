/* Shopping cart (AECWR-20). Reads and updates the shared cart (AldiCart in site.js),
   so products added in the catalog appear here and totals are always calculated in cents. */
document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    const emptyCart = document.getElementById('empty-cart');
    const cartSummary = document.getElementById('cart-summary');
    const checkoutButton = document.getElementById('checkout-button');
    const loginHint = document.getElementById('login-hint');
    const userInfo = document.getElementById('user-info');
    const money = AldiUI.formatMoney;

    const userEmail = AldiAuth.email();

    if (userEmail) {
        userInfo.textContent = `Logged in as ${userEmail}`;
    }

    function renderCart() {
        const cart = AldiCart.items();
        cartItemsContainer.innerHTML = '';

        const isEmpty = cart.length === 0;
        emptyCart.classList.toggle('hidden', !isEmpty);
        cartSummary.hidden = isEmpty;
        checkoutButton.disabled = isEmpty;
        loginHint.hidden = AldiAuth.isLoggedIn();

        cart.forEach(product => {
            const item = document.createElement('div');
            const name = AldiUI.escapeHTML(product.name);
            item.className = 'cart-item';

            item.innerHTML = `
                <div class="cart-thumb" aria-hidden="true">
                    <span>${AldiUI.escapeHTML(product.image)}</span>
                </div>

                <div>
                    <a class="product-name" href="/products/${product.id}">${name}</a>
                    <div class="product-price">
                        ${money(product.priceCents)} each${product.size ? ' · ' + AldiUI.escapeHTML(product.size) : ''}
                    </div>
                    <div class="line-total">${money(product.priceCents * product.quantity)}</div>
                </div>

                <div class="quantity-controls">
                    <button type="button" data-action="decrease" data-id="${product.id}"
                        aria-label="Decrease quantity of ${name}" ${product.quantity <= 1 ? 'disabled' : ''}>-</button>
                    <span aria-label="Quantity">${product.quantity}</span>
                    <button type="button" data-action="increase" data-id="${product.id}"
                        aria-label="Increase quantity of ${name}" ${product.quantity >= AldiCart.MAX_QTY ? 'disabled' : ''}>+</button>
                </div>

                <button type="button" class="remove-button" data-action="remove" data-id="${product.id}"
                    aria-label="Remove ${name} from cart">Remove</button>
            `;

            // Product photo on top of the emoji; if it cannot load, the emoji stays visible.
            if (product.photo) {
                const img = document.createElement('img');
                img.src = product.photo;
                img.alt = '';
                img.addEventListener('error', () => img.remove());
                item.querySelector('.cart-thumb').appendChild(img);
            }

            cartItemsContainer.appendChild(item);
        });

        cartCount.textContent = AldiCart.count();
        cartTotal.textContent = money(AldiCart.totalCents());
    }

    cartItemsContainer.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }

        const id = Number(button.dataset.id);
        const product = AldiCart.items().find(item => item.id === id);
        if (!product) {
            return;
        }

        if (button.dataset.action === 'increase') {
            AldiCart.setQuantity(id, product.quantity + 1);
        }

        if (button.dataset.action === 'decrease') {
            AldiCart.setQuantity(id, product.quantity - 1);
        }

        if (button.dataset.action === 'remove') {
            AldiCart.remove(id);
            AldiUI.showToast(`${product.name} removed from your cart`);
        }

        renderCart();
    });

    checkoutButton.addEventListener('click', () => {
        window.location.href = '/checkout.html';
    });

    renderCart();
});

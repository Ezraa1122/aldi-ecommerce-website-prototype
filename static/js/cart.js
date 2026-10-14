document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const emptyCart = document.getElementById('empty-cart');
    const checkoutButton = document.getElementById('checkout-button');
    const userInfo = document.getElementById('user-info');

    const userEmail = localStorage.getItem('userEmail');

    if (userEmail) {
        userInfo.textContent = `Logged in as ${userEmail}`;
    }

    let cart = [
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

    function renderCart() {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            emptyCart.classList.remove('hidden');
            cartTotal.textContent = '€0.00';
            checkoutButton.disabled = true;
            return;
        }

        emptyCart.classList.add('hidden');
        checkoutButton.disabled = false;

        cart.forEach(product => {
            const item = document.createElement('div');

            item.className = 'cart-item';

            item.innerHTML = `
                <div>
                    <div class="product-name">
                        ${product.name}
                    </div>

                    <div class="product-price">
                        €${product.price.toFixed(2)} each
                    </div>
                </div>

                <div class="quantity-controls">
                    <button
                        data-action="decrease"
                        data-id="${product.id}"
                    >
                        -
                    </button>

                    <span>
                        ${product.quantity}
                    </span>

                    <button
                        data-action="increase"
                        data-id="${product.id}"
                    >
                        +
                    </button>
                </div>

                <button
                    class="remove-button"
                    data-action="remove"
                    data-id="${product.id}"
                >
                    Remove
                </button>
            `;

            cartItemsContainer.appendChild(item);
        });

        updateTotal();
    }

    function updateTotal() {
        const total = cart.reduce((sum, product) => {
            return sum + product.price * product.quantity;
        }, 0);

        cartTotal.textContent = `€${total.toFixed(2)}`;
    }

    cartItemsContainer.addEventListener('click', event => {
        const button = event.target.closest('button');

        if (!button) {
            return;
        }

        const id = Number(button.dataset.id);
        const action = button.dataset.action;

        const product = cart.find(item => item.id === id);

        if (action === 'increase') {
            product.quantity++;
        }

        if (action === 'decrease' && product.quantity > 1) {
            product.quantity--;
        }

        if (action === 'remove') {
            cart = cart.filter(item => item.id !== id);
        }

        renderCart();
    });

    checkoutButton.addEventListener('click', () => {
        alert('Checkout will be implemented in the next stage.');
    });

    renderCart();
});

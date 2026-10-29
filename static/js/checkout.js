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

        alert('Order submitted successfully!');
    });

    renderOrderSummary();
});
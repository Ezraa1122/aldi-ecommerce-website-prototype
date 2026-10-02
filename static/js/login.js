document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const togglePassword = document.getElementById('toggle-password');

    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';

        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? 'Hide' : 'Show';
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        loginError.textContent = '';

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            loginError.textContent = 'Please fill out all fields.';
            return;
        }

        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        try {
            const response = await fetch(
                'http://127.0.0.1:5000/api/login',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Login failed'
                );
            }

            localStorage.setItem('userEmail', email);
            localStorage.setItem('isLoggedIn', 'true');

            alert('Login successful!');

        } catch (error) {
            loginError.textContent = error.message;

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    });
});
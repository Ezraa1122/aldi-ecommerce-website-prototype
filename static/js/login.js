/* Login (AECWR-17 / AECWR-18).
   After a successful login the customer goes back to the page they came from
   (for example checkout), or to the products. */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const togglePassword = document.getElementById('toggle-password');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    const params = new URLSearchParams(window.location.search);
    const next = AldiUI.safeNext(params.get('next'));

    if (params.get('reason') === 'checkout') {
        document.getElementById('login-reason').hidden = false;
    }

    // New customers who register also return to the same page afterwards.
    document.getElementById('register-link').href =
        '/register.html?' + new URLSearchParams({ next }).toString();

    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';

        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.textContent = isPassword ? 'Hide' : 'Show';
        togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        loginError.textContent = '';

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            loginError.textContent = 'Please enter your email address and password.';
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }

            AldiAuth.logIn(email);
            AldiUI.flash('Login successful. Welcome back!');
            window.location.href = next;

        } catch (error) {
            loginError.textContent = error instanceof TypeError
                ? 'Cannot reach the server. Please make sure the backend is running.'
                : error.message;
            passwordInput.value = '';
            passwordInput.focus();
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    });
});

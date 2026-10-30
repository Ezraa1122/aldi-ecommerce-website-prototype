/* Registration (AECWR-13 / AECWR-14).
   Sends the new account to POST /api/register, which uses register_user() from user_database.py
   (passwords are stored as scrypt hashes). After registering, the customer is logged in. */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const confirmInput = document.getElementById('register-confirm');
    const formError = document.getElementById('register-error');
    const submitButton = form.querySelector('button[type="submit"]');

    const next = AldiUI.safeNext(new URLSearchParams(window.location.search).get('next'));
    document.getElementById('login-link').href = '/login.html?' + new URLSearchParams({ next }).toString();

    function setError(input, message) {
        const box = document.querySelector(`[data-error-for="${input.id}"]`);
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        box.textContent = message;
        return !message;
    }

    function validate() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const okEmail = setError(emailInput,
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email address.');
        const okPassword = setError(passwordInput,
            password.length >= 8 && password.length <= 128 ? '' : 'Password must contain 8 to 128 characters.');
        const okConfirm = setError(confirmInput,
            confirmInput.value === password && password ? '' : 'The passwords do not match.');

        if (!okEmail) {
            emailInput.focus();
        } else if (!okPassword) {
            passwordInput.focus();
        } else if (!okConfirm) {
            confirmInput.focus();
        }
        return okEmail && okPassword && okConfirm;
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        formError.textContent = '';

        if (!validate()) {
            return;
        }

        const email = emailInput.value.trim();
        submitButton.disabled = true;
        submitButton.textContent = 'Creating account...';

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: passwordInput.value })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed.');
            }

            AldiAuth.logIn(email);
            AldiUI.flash('Account created. You are now logged in.');
            window.location.href = next;

        } catch (error) {
            formError.textContent = error instanceof TypeError
                ? 'Cannot reach the server. Please make sure the backend is running.'
                : error.message;
            submitButton.disabled = false;
            submitButton.textContent = 'Create account';
        }
    });
});

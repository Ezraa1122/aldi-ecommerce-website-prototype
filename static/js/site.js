/*
 * Shared site script (AECWR-29). Loaded on every page before the page's own script.
 *   - AldiCart: one shopping cart shared by catalog, cart, checkout (prices in integer cents)
 *   - AldiAuth: who is logged in, logout, and "login required" for checkout
 *   - the shared top bar, header (with cart count and login/logout), store promises and footer
 *   - a small toast message for feedback ("Added to cart", "Logged out", ...)
 * The header keeps a <span id="user-info"> that cart.js and checkout.js fill with "Logged in as ...".
 */
(function () {
    'use strict';

    const CART_KEY = 'aldiCart';
    const MAX_QTY = 99;

    /* ---------- Safe storage (the page still works if storage is blocked) ---------- */

    function read(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) { /* ignore */ }
    }

    function remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) { /* ignore */ }
    }

    /* ---------- Auth ---------- */

    const AldiAuth = {
        email() {
            return read('isLoggedIn') === 'true' ? read('userEmail') : null;
        },

        isLoggedIn() {
            return Boolean(this.email());
        },

        logIn(email) {
            write('userEmail', email.toLowerCase());
            write('isLoggedIn', 'true');
        },

        logout() {
            remove('isLoggedIn');
            remove('userEmail');
            flash('You have been logged out.');
            window.location.href = '/login.html';
        },

        /* Guests are sent to login and brought back to this page afterwards. */
        requireLogin(reason) {
            if (this.isLoggedIn()) {
                return true;
            }
            const params = new URLSearchParams({ next: window.location.pathname });
            if (reason) {
                params.set('reason', reason);
            }
            window.location.replace('/login.html?' + params.toString());
            return false;
        }
    };

    /* Only allow redirects to pages inside this site. */
    function safeNext(value) {
        return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
            ? value
            : '/products';
    }

    /* ---------- Cart ---------- */

    function cleanItem(item) {
        if (!item || typeof item.name !== 'string') {
            return null;
        }
        const id = Number(item.id);
        const priceCents = Number(item.priceCents);
        const quantity = Number(item.quantity);
        if (!Number.isSafeInteger(id) || !Number.isSafeInteger(priceCents) || priceCents < 0 ||
            !Number.isSafeInteger(quantity) || quantity < 1) {
            return null;
        }
        return {
            id,
            name: item.name,
            priceCents,
            image: typeof item.image === 'string' ? item.image : '',
            photo: typeof item.photo === 'string' && /^\/images\/products\/\d+\.jpg$/.test(item.photo)
                ? item.photo
                : '',
            size: typeof item.size === 'string' ? item.size : '',
            quantity: Math.min(quantity, MAX_QTY)
        };
    }

    const AldiCart = {
        MAX_QTY,

        items() {
            try {
                const raw = JSON.parse(read(CART_KEY));
                return Array.isArray(raw) ? raw.map(cleanItem).filter(Boolean) : [];
            } catch (error) {
                return [];
            }
        },

        save(items) {
            write(CART_KEY, JSON.stringify(items));
            renderCartBadge();
        },

        add(product, quantity) {
            const items = this.items();
            const amount = Math.max(1, Math.floor(quantity || 1));
            const existing = items.find(item => item.id === Number(product.id));
            if (existing) {
                existing.quantity = Math.min(existing.quantity + amount, MAX_QTY);
            } else {
                const item = cleanItem({ ...product, quantity: Math.min(amount, MAX_QTY) });
                if (item) {
                    items.push(item);
                }
            }
            this.save(items);
        },

        setQuantity(id, quantity) {
            const items = this.items();
            const item = items.find(entry => entry.id === Number(id));
            if (item) {
                item.quantity = Math.min(Math.max(1, Math.floor(quantity)), MAX_QTY);
                this.save(items);
            }
        },

        remove(id) {
            this.save(this.items().filter(item => item.id !== Number(id)));
        },

        clear() {
            this.save([]);
        },

        count() {
            return this.items().reduce((sum, item) => sum + item.quantity, 0);
        },

        totalCents() {
            return this.items().reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
        }
    };

    function formatMoney(cents) {
        return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    }

    function escapeHTML(text) {
        const span = document.createElement('span');
        span.textContent = String(text);
        return span.innerHTML;
    }

    /* ---------- Toast + one-time messages across a redirect ---------- */

    let toastTimer;

    function showToast(message, type) {
        let toast = document.getElementById('site-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'site-toast';
            toast.className = 'toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.toggle('toast--success', type === 'success');
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
    }

    function flash(message) {
        try {
            sessionStorage.setItem('aldiFlash', message);
        } catch (error) { /* ignore */ }
    }

    function showFlash() {
        try {
            const message = sessionStorage.getItem('aldiFlash');
            if (message) {
                sessionStorage.removeItem('aldiFlash');
                showToast(message, 'success');
            }
        } catch (error) { /* ignore */ }
    }

    /* ---------- Header and footer ---------- */

    const ICONS = {
        products: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
        cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 3h2.6l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 7H6"/></svg>',
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
        logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
    };

    function navLink(href, label, icon, extra) {
        const path = window.location.pathname;
        const active = path === href || (href === '/products' && path.startsWith('/products'));
        return `<a href="${href}"${active ? ' aria-current="page"' : ''}>${ICONS[icon]}<span>${label}</span>${extra || ''}</a>`;
    }

    function renderHeader() {
        const slot = document.getElementById('site-header');
        if (!slot) {
            return;
        }
        const email = AldiAuth.email();
        const account = email
            ? `<button type="button" class="site-nav__button" id="logout-button">${ICONS.logout}<span>Logout</span></button>`
            : navLink('/login.html', 'Login', 'user');

        slot.outerHTML = `
            <div class="site-topbar">
                <div class="site-topbar__inner">
                    <span>Fresh groceries at everyday low prices</span>
                    <span class="site-topbar__demo">Demo store · no real payments</span>
                </div>
            </div>
            <header class="site-header">
                <div class="site-header__inner">
                    <a class="site-logo" href="/products" aria-label="ALDI E-Commerce, all products">
                        <span class="site-logo__mark" aria-hidden="true">A</span>
                        <span class="site-logo__text">
                            <span class="site-logo__name">ALDI E-Commerce</span>
                            <span class="site-logo__tag">Online grocery store</span>
                        </span>
                    </a>
                    <nav class="site-nav" aria-label="Main">
                        ${navLink('/products', 'Products', 'products')}
                        ${navLink('/cart.html', 'Cart', 'cart', '<span class="cart-badge" id="cart-badge" hidden></span>')}
                        ${account}
                        <span class="site-user" id="user-info"></span>
                    </nav>
                </div>
            </header>
            <div class="site-usp">
                <div class="site-usp__inner">
                    <span>${ICONS.check}Fresh products every day</span>
                    <span>${ICONS.check}Everyday low prices</span>
                    <span>${ICONS.check}Simple checkout in minutes</span>
                </div>
            </div>`;

        if (email) {
            document.getElementById('user-info').textContent = email;
            document.getElementById('logout-button').addEventListener('click', () => AldiAuth.logout());
        }
        renderCartBadge();
    }

    function renderCartBadge() {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            const count = AldiCart.count();
            const text = count > MAX_QTY ? '99+' : String(count);
            const changed = badge.textContent !== '' && badge.textContent !== text;
            badge.textContent = text;
            badge.hidden = count === 0;
            badge.setAttribute('aria-label', `${count} items in cart`);
            if (changed) {
                // small "bump" so customers notice the cart changed
                badge.classList.remove('is-bumping');
                void badge.offsetWidth;
                badge.classList.add('is-bumping');
            }
        }
    }

    function renderFooter() {
        const slot = document.getElementById('site-footer');
        if (!slot) {
            return;
        }
        const account = AldiAuth.isLoggedIn()
            ? '<a href="/checkout.html">Checkout</a>'
            : '<a href="/login.html">Login</a><a href="/register.html">Create an account</a>';
        slot.outerHTML = `
            <footer class="site-footer">
                <div class="site-footer__inner">
                    <div class="site-footer__brand">
                        <span class="site-logo__mark" aria-hidden="true">A</span>
                        <p>Everyday essentials at low prices, delivered simply.</p>
                    </div>
                    <nav class="site-footer__links" aria-label="Shop">
                        <h2>Shop</h2>
                        <a href="/products">All products</a>
                        <a href="/cart.html">Shopping cart</a>
                    </nav>
                    <nav class="site-footer__links" aria-label="Account">
                        <h2>Account</h2>
                        ${account}
                    </nav>
                </div>
                <p class="site-footer__legal">
                    University prototype · Sample products and prices · Not an official ALDI website
                </p>
            </footer>`;
    }

    function addFavicon() {
        if (document.querySelector('link[rel="icon"]')) {
            return;
        }
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
            '<rect width="32" height="32" rx="7" fill="#001e50"/>' +
            '<rect y="26" width="32" height="6" fill="#f39200"/>' +
            '<text x="16" y="22" font-family="Arial" font-weight="800" font-size="18" fill="#fff" text-anchor="middle">A</text></svg>';
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
        document.head.appendChild(link);
    }

    /* Keep the cart count right when the cart changes in another tab. */
    window.addEventListener('storage', event => {
        if (event.key === CART_KEY) {
            renderCartBadge();
        }
    });

    window.AldiAuth = AldiAuth;
    window.AldiCart = AldiCart;
    window.AldiUI = { formatMoney, escapeHTML, showToast, flash, safeNext };

    function init() {
        addFavicon();
        renderHeader();
        renderFooter();
        showFlash();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

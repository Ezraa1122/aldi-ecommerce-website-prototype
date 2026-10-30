/* Catalog + product detail: add to cart, search and category filter. */
document.addEventListener('DOMContentLoaded', () => {

    function productFrom(element) {
        return {
            id: Number(element.dataset.id),
            name: element.dataset.name,
            priceCents: Number(element.dataset.priceCents),
            image: element.dataset.image,
            photo: element.dataset.photo,
            size: element.dataset.size
        };
    }

    function addToCart(product, quantity) {
        AldiCart.add(product, quantity);
        AldiUI.showToast(`${quantity} × ${product.name} added to your cart`, 'success');
    }

    /* ---------- Add to cart from the product grid ---------- */

    document.querySelectorAll('button[data-add-to-cart]').forEach(button => {
        button.addEventListener('click', () => {
            addToCart(productFrom(button), 1);
            button.textContent = 'Added ✓';
            button.classList.add('is-added');
            setTimeout(() => {
                button.textContent = 'Add to cart';
                button.classList.remove('is-added');
            }, 1400);
        });
    });

    /* ---------- Add to cart from the product page, with a quantity ---------- */

    const form = document.querySelector('form[data-add-to-cart]');
    if (form) {
        const input = form.querySelector('input[name="quantity"]');
        const error = document.getElementById('qty-error');

        form.addEventListener('submit', event => {
            event.preventDefault();
            const quantity = Number(input.value);
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > AldiCart.MAX_QTY) {
                input.setAttribute('aria-invalid', 'true');
                error.textContent = 'Please choose a quantity between 1 and 99.';
                input.focus();
                return;
            }
            input.removeAttribute('aria-invalid');
            error.textContent = '';
            addToCart(productFrom(form), quantity);
        });
    }

    /* ---------- Search and category filter ---------- */

    const search = document.getElementById('product-search');
    const chips = document.querySelectorAll('.chips .chip');
    const cards = document.querySelectorAll('.grid .card');
    const count = document.getElementById('product-count');
    const noResults = document.getElementById('no-results');

    if (!search || !cards.length) {
        return;
    }

    let category = '';

    function applyFilters() {
        const term = search.value.trim().toLowerCase();
        let visible = 0;

        cards.forEach(card => {
            const matchesText = !term || card.dataset.name.includes(term) ||
                card.dataset.category.toLowerCase().includes(term);
            const matchesCategory = !category || card.dataset.category === category;
            const show = matchesText && matchesCategory;
            card.hidden = !show;
            if (show) {
                visible++;
            }
        });

        count.textContent = `${visible} ${visible === 1 ? 'item' : 'items'}`;
        noResults.hidden = visible > 0;
    }

    function selectCategory(value) {
        category = value;
        chips.forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.category === value)));
        applyFilters();
    }

    search.addEventListener('input', applyFilters);
    chips.forEach(chip => chip.addEventListener('click', () => selectCategory(chip.dataset.category)));

    document.getElementById('clear-filters').addEventListener('click', () => {
        search.value = '';
        selectCategory('');
        search.focus();
    });
});

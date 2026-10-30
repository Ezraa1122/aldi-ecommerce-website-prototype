from pathlib import Path

from flask import Blueprint, render_template_string, abort
from product_database import (
    initialize_database,
    get_all_products,
    get_product,
)

catalog_bp = Blueprint("catalog", __name__)
initialize_database()

# Product photos are stored in static/images/products/<product id>.jpg.
# If a photo is missing or cannot load, the page falls back to the product's emoji.
PHOTO_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "products"


def photo_url(product_id, width=None):
    """Return the photo address for a product, or "" when there is no photo file."""
    if (PHOTO_DIR / f"{product_id}.jpg").is_file():
        return f"/images/products/{product_id}.jpg"
    return ""

PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ product.name if product else 'Products' }} | ALDI E-Commerce</title>
    <link rel="stylesheet" href="/css/theme.css">
    <link rel="stylesheet" href="/css/catalog.css">
</head>
<body>
    <div id="site-header"></div>

    <main>
        {% if product %}
            <a class="back" href="{{ url_for('catalog.catalog') }}">← Back to products</a>
            <article class="detail">
                <div class="art">
                    <span class="art-emoji" aria-hidden="true">{{ product.image }}</span>
                    {% if photo_url(product.id) %}
                    <img src="{{ photo_url(product.id, 900) }}" alt="{{ product.name }}" onerror="this.remove()">
                    {% endif %}
                </div>
                <div class="detail-info">
                    <div class="eyebrow">{{ product.category }}</div>
                    <h1>{{ product.name }}</h1>
                    <p>{{ product.description }}</p>
                    <div class="price">€{{ product.price }}</div>
                    <p class="package">
                        <strong>Package size:</strong> {{ product.size }}
                    </p>
                    <form class="add-form" data-add-to-cart novalidate
                          data-id="{{ product.id }}"
                          data-name="{{ product.name }}"
                          data-price-cents="{{ product.price_cents }}"
                          data-image="{{ product.image }}"
                          data-photo="{{ photo_url(product.id, 200) }}"
                          data-size="{{ product.size }}">
                        <label for="qty">Quantity</label>
                        <div class="add-row">
                            <input id="qty" name="quantity" type="number"
                                   min="1" max="99" value="1" inputmode="numeric">
                            <button type="submit" class="add-btn add-btn--large">Add to cart</button>
                        </div>
                        <p class="field-error" id="qty-error" role="alert"></p>
                    </form>
                    <ul class="perks" aria-label="Shopping information">
                        <li>Quality checked every day</li>
                        <li>Delivered to your door</li>
                        <li>Simple and secure checkout</li>
                    </ul>
                    <p class="category">Sample product and price for demonstration.</p>
                </div>
            </article>
        {% else %}
            <section class="hero">
                <div class="hero-text">
                    <div class="eyebrow">Your everyday essentials</div>
                    <h1>Fresh finds. Simple shopping.</h1>
                    <p class="intro">
                        Browse {{ products|length }} everyday products,
                        search or filter by category and add them to your cart.
                    </p>
                    <a class="hero-cta" href="#products">Shop all products</a>
                </div>
                <div class="hero-art" aria-hidden="true">
                    <span class="hero-photo hero-photo--1"><img src="{{ photo_url(6, 300) }}" alt="" onerror="this.remove()"></span>
                    <span class="hero-photo hero-photo--2"><img src="{{ photo_url(3, 300) }}" alt="" onerror="this.remove()"></span>
                    <span class="hero-photo hero-photo--3"><img src="{{ photo_url(2, 300) }}" alt="" onerror="this.remove()"></span>
                </div>
            </section>

            <div class="section-head">
                <h2>All products</h2>
                <span id="product-count">{{ products|length }} items</span>
            </div>

            <div class="catalog-tools">
                <label class="search" for="product-search">
                    <span class="visually-hidden">Search products</span>
                    <input type="search" id="product-search" placeholder="Search products, e.g. milk" autocomplete="off">
                </label>
                <div class="chips" role="group" aria-label="Filter by category">
                    <button type="button" class="chip" data-category="" aria-pressed="true">All</button>
                    {% for category in products|map(attribute='category')|unique|sort %}
                    <button type="button" class="chip" data-category="{{ category }}" aria-pressed="false">{{ category }}</button>
                    {% endfor %}
                </div>
            </div>

            <div class="no-results" id="no-results" hidden>
                <p>No products match your search.</p>
                <button type="button" class="chip" id="clear-filters">Show all products</button>
            </div>

            <section class="grid" id="products" aria-label="Products">
                {% for item in products %}
                    <article class="card" data-name="{{ item.name|lower }}" data-category="{{ item.category }}">
                        <a class="card-link"
                           href="{{ url_for('catalog.product_detail', product_id=item.id) }}">
                            <div class="art">
                                <span class="art-emoji" aria-hidden="true">{{ item.image }}</span>
                                {% if photo_url(item.id) %}
                                <img src="{{ photo_url(item.id) }}" alt="{{ item.name }}" loading="lazy" onerror="this.remove()">
                                {% endif %}
                            </div>
                            <div class="info">
                                <div class="category">{{ item.category }}</div>
                                <h2>{{ item.name }}</h2>
                                <div class="size">{{ item.size }}</div>
                            </div>
                        </a>
                        <div class="bottom">
                            <span class="price">€{{ item.price }}</span>
                            <button type="button" class="add-btn"
                                    data-add-to-cart
                                    data-id="{{ item.id }}"
                                    data-name="{{ item.name }}"
                                    data-price-cents="{{ item.price_cents }}"
                                    data-image="{{ item.image }}"
                                    data-photo="{{ photo_url(item.id, 200) }}"
                                    data-size="{{ item.size }}"
                                    aria-label="Add {{ item.name }} to cart">Add to cart</button>
                        </div>
                    </article>
                {% endfor %}
            </section>

            <section class="promos" aria-label="Why shop with us">
                <div class="promo promo--fresh">
                    <span class="promo-icon" aria-hidden="true">🥬</span>
                    <div>
                        <h2>Fresh every day</h2>
                        <p>Fruit, vegetables and bakery products are restocked daily.</p>
                    </div>
                </div>
                <div class="promo promo--price">
                    <span class="promo-icon" aria-hidden="true">🏷️</span>
                    <div>
                        <h2>Low prices, every week</h2>
                        <p>The same simple low price on your everyday essentials.</p>
                    </div>
                </div>
            </section>
        {% endif %}
    </main>

    <div id="site-footer"></div>

    <script src="/js/site.js"></script>
    <script src="/js/catalog.js"></script>
</body>
</html>
"""


@catalog_bp.get("/products")
def catalog():
    products = get_all_products()
    return render_template_string(
        PAGE, products=products, product=None, photo_url=photo_url
    )


@catalog_bp.get("/products/<int:product_id>")
def product_detail(product_id):
    product = get_product(product_id)

    if product is None:
        abort(404)

    return render_template_string(PAGE, product=product, photo_url=photo_url)
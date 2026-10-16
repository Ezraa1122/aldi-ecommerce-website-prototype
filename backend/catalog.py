from flask import Blueprint, render_template_string, abort
from product_database import (
    initialize_database,
    get_all_products,
    get_product,
)

catalog_bp = Blueprint("catalog", __name__)
initialize_database()

PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ product.name if product else 'Product Catalog' }} | ALDI Prototype</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            color: #152b45;
            background: #f5f7fa;
            line-height: 1.6;
        }
        header {
            background: #082f63;
            color: white;
            padding: 18px 6%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }
        .brand {
            color: white;
            font-size: 26px;
            font-weight: bold;
            text-decoration: none;
            letter-spacing: 2px;
        }
        header span { font-size: 13px; }
        main {
            max-width: 1180px;
            margin: auto;
            padding: 40px 24px 60px;
        }
        .eyebrow {
            color: #376650;
            font-size: 12px;
            letter-spacing: 2px;
            font-weight: bold;
            text-transform: uppercase;
        }
        h1 {
            font-size: clamp(30px, 5vw, 46px);
            line-height: 1.15;
            margin: 12px 0;
        }
        .intro { color: #566475; margin-bottom: 32px; }
        .grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 24px;
        }
        .card {
            display: block;
            background: white;
            border: 1px solid #dce3eb;
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
            color: inherit;
            transition: transform .2s, box-shadow .2s;
        }
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px #082f6315;
        }
        a:focus-visible {
            outline: 3px solid #e88916;
            outline-offset: 4px;
        }
        .art {
            background: #edf3eb;
            display: grid;
            place-items: center;
            min-height: 190px;
            font-size: 90px;
        }
        .info { padding: 22px; }
        .category { color: #617080; font-size: 13px; }
        h2 { font-size: 21px; margin: 5px 0; }
        .size { color: #617080; }
        .bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-top: 18px;
        }
        .price { font-size: 28px; font-weight: bold; }
        .view { color: #07569b; font-weight: bold; font-size: 14px; }
        .back {
            display: inline-block;
            color: #07569b;
            margin-bottom: 28px;
        }
        .detail {
            display: grid;
            grid-template-columns: 1fr 1fr;
            background: white;
            border: 1px solid #dce3eb;
            border-radius: 20px;
            overflow: hidden;
        }
        .detail .art { min-height: 420px; font-size: 150px; }
        .detail-info { padding: 40px; }
        .detail .price { font-size: 40px; margin: 22px 0; }
        .package {
            background: #f1f4f8;
            padding: 14px 18px;
            border-radius: 10px;
        }
        footer {
            padding: 24px;
            text-align: center;
            border-top: 1px solid #dce3eb;
            color: #617080;
            font-size: 13px;
        }
        @media (max-width: 850px) {
            .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .detail { grid-template-columns: 1fr; }
            .detail .art { min-height: 260px; }
        }
        @media (max-width: 520px) {
            .grid { grid-template-columns: 1fr; }
            main { padding: 28px 16px 40px; }
            header { padding: 16px; }
            .detail-info { padding: 24px; }
            .bottom { flex-wrap: wrap; }
        }
    </style>
</head>
<body>
    <header>
        <a class="brand" href="{{ url_for('catalog.catalog') }}">ALDI</a>
        <span>Student project · Sprint 2</span>
    </header>

    <main>
        {% if product %}
            <a class="back" href="{{ url_for('catalog.catalog') }}">← Back to products</a>
            <article class="detail">
                <div class="art" aria-hidden="true">{{ product.image }}</div>
                <div class="detail-info">
                    <div class="eyebrow">{{ product.category }}</div>
                    <h1>{{ product.name }}</h1>
                    <p>{{ product.description }}</p>
                    <div class="price">€{{ product.price }}</div>
                    <p class="package">
                        <strong>Package size:</strong> {{ product.size }}
                    </p>
                    <p class="category">Sample product and price for demonstration.</p>
                </div>
            </article>
        {% else %}
            <div class="eyebrow">Your everyday essentials</div>
            <h1>Fresh finds. Simple shopping.</h1>
            <p class="intro">
                Browse {{ products|length }} sample products.
                Select a product to explore its details.
            </p>

            <section class="grid" aria-label="Products">
                {% for item in products %}
                    <a class="card"
                       href="{{ url_for('catalog.product_detail', product_id=item.id) }}">
                        <div class="art" aria-hidden="true">{{ item.image }}</div>
                        <div class="info">
                            <div class="category">{{ item.category }}</div>
                            <h2>{{ item.name }}</h2>
                            <div class="size">{{ item.size }}</div>
                            <div class="bottom">
                                <span class="price">€{{ item.price }}</span>
                                <span class="view">View details →</span>
                            </div>
                        </div>
                    </a>
                {% endfor %}
            </section>
        {% endif %}
    </main>

    <footer>
        University prototype · Sample prices · Not an official ALDI website
    </footer>
</body>
</html>
"""


@catalog_bp.get("/products")
def catalog():
    products = get_all_products()
    return render_template_string(
        PAGE, products=products, product=None
    )


@catalog_bp.get("/products/<int:product_id>")
def product_detail(product_id):
    product = get_product(product_id)

    if product is None:
        abort(404)

    return render_template_string(PAGE, product=product)
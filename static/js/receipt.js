document.addEventListener('DOMContentLoaded', () => {
    const money = cents => new Intl.NumberFormat('en-IE', {
        style: 'currency', currency: 'EUR'
    }).format(cents / 100);
    let order;
    try {
        order = JSON.parse(sessionStorage.getItem('aldiDemoReceipt'));
        if (!order || typeof order.reference !== 'string' ||
            !Number.isFinite(Date.parse(order.createdAt)) ||
            !order.customer || !['fullName', 'email', 'address', 'city', 'postcode']
                .every(key => typeof order.customer[key] === 'string' && order.customer[key].trim()) ||
            !Array.isArray(order.items) || !order.items.length ||
            !order.items.every(item => item && typeof item.name === 'string' &&
                Number.isSafeInteger(item.unitPriceCents) && item.unitPriceCents >= 0 &&
                Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
                Number.isSafeInteger(item.unitPriceCents * item.quantity))) return;
    } catch (error) { return; }

    const total = order.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
    if (!Number.isSafeInteger(total)) return;
    const setText = (id, value) => { document.getElementById(id).textContent = value; };
    setText('reference', order.reference);
    setText('created', new Date(order.createdAt).toLocaleString());
    setText('customer-name', order.customer.fullName);
    setText('customer-email', order.customer.email);
    setText('customer-address', order.customer.address);
    setText('customer-city', `${order.customer.postcode} ${order.customer.city}`);
    order.items.forEach(item => {
        const row = document.createElement('tr');
        [item.name, money(item.unitPriceCents), item.quantity,
            money(item.unitPriceCents * item.quantity)].forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        document.getElementById('receipt-items').appendChild(row);
    });
    setText('receipt-total', money(total));
    document.getElementById('empty-state').hidden = true;
    document.getElementById('receipt').hidden = false;
    document.getElementById('print-receipt').addEventListener('click', () => window.print());
});

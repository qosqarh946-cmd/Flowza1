document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const ORDERS_KEY = 'flowza_orders';
    const PRODUCTS_KEY = 'flowza_products';
    
    const orderForm = document.getElementById('customer-form') || document.querySelector('form');

    if (!orderForm) return;

    let msgEl = document.getElementById('form-message');
    if (!msgEl) {
        msgEl = document.createElement('p');
        msgEl.id = 'form-message';
        msgEl.style.marginTop = '10px';
        msgEl.style.fontSize = '13px';
        msgEl.style.fontWeight = '600';
        msgEl.style.textAlign = 'center';
        orderForm.appendChild(msgEl);
    }

    function showFormMessage(message, isSuccess) {
        msgEl.style.color = isSuccess ? '#22c55e' : '#ef4444';
        msgEl.textContent = message;
    }

    orderForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const customerName = document.getElementById('customer-name').value.trim();
        const customerPhone = document.getElementById('customer-phone').value.trim();
        const customerAddress = document.getElementById('customer-address').value.trim();
        const productName = document.getElementById('product-name').value.trim();
        const priceInput = Number(document.getElementById('product-price').value) || 0;
        const quantity = Number(document.getElementById('product-quantity').value) || 1;
        const paymentMethod = document.getElementById('payment-method').value;

        if (!customerName || !productName || quantity <= 0) {
            showFormMessage('Please fill in all required fields correctly.', false);
            return;
        }

        const totalPrice = Number((priceInput * quantity).toFixed(2));

        let orders = [];
        try {
            orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || localStorage.getItem('flowza_customer_orders')) || [];
        } catch (err) {
            orders = [];
        }

        const newOrder = {
            id: 'ORD-' + Date.now(),
            customerName: customerName,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            productName: productName,
            quantity: quantity,
            price: priceInput,
            totalPrice: totalPrice,
            paymentMethod: paymentMethod,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        orders.push(newOrder);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        localStorage.setItem('flowza_customer_orders', JSON.stringify(orders));

        showFormMessage('Order placed successfully!', true);
        orderForm.reset();
    });
});
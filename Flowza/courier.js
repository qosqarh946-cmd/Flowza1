document.addEventListener('DOMContentLoaded', () => {
    const ORDERS_KEY = 'flowza_orders';
    const PRODUCTS_KEY = 'flowza_products';
    const CURRENT_USER_KEY = 'flowza_current_user';
    
    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
    const userRole = (currentUser.role || '').toLowerCase();
    const isAdmin = userRole === 'admin';

    const tableBody = document.getElementById('customer-orders-body');
    const searchInput = document.getElementById('courier-search');
    
    const totalOrdersEl = document.querySelector('[data-stat="total-orders"]');
    const pendingDeliveriesEl = document.querySelector('[data-stat="pending-deliveries"]');
    const deliveredOrdersEl = document.querySelector('[data-stat="delivered-orders"]');

    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || localStorage.getItem('flowza_customer_orders')) || [];
    } catch (e) {
        orders = [];
    }

    // Anbardan stoku azaldan təkmilləşdirilmiş funksiya
    function deductWarehouseStock(productName, quantity) {
        if (!productName) return;
        try {
            // Hər iki ehtimal olunan açarı yoxlayırıq
            let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || localStorage.getItem('flowza_warehouse_items')) || [];
            let updated = false;
            const target = String(productName).trim().toLowerCase();
            const qty = Number(quantity) || 1;

            console.log('Stok azaldılır. Axtarılan:', target, 'Miqdar:', qty, 'Məhsullar:', products);

            products = products.map(prod => {
                const pName = String(prod.name || '').trim().toLowerCase();
                const pSku = String(prod.sku || '').trim().toLowerCase();

                // Çevik uyğunlaşdırma: adlar tam və ya qismən eyni olduqda stok azalır
                if (pName === target || pSku === target || pName.includes(target) || target.includes(pName)) {
                    const currentStock = Number(prod.stock) || 0;
                    prod.stock = Math.max(0, currentStock - qty);
                    updated = true;
                    console.log('Stok yeniləndi:', prod.name, 'Yeni stok:', prod.stock);
                }
                return prod;
            });

            if (updated) {
                localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
                localStorage.setItem('flowza_warehouse_items', JSON.stringify(products));
            } else {
                console.warn('Anbarda bu ada uyğun məhsul tapılmadı:', target);
            }
        } catch (err) {
            console.error('Stok azaltma xətası:', err);
        }
    }

    function renderCourierOrders(filterText = '') {
        if (!tableBody) return;

        const filtered = orders.filter(order => {
            const prodName = order.productName || order.product || '';
            const custName = order.customerName || order.customer || order.name || '';
            const text = `${order.id || ''} ${custName} ${order.phone || ''} ${order.address || ''} ${prodName}`.toLowerCase();
            return text.includes(filterText.toLowerCase());
        });

        const total = orders.length;
        const delivered = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
        const pending = orders.filter(o => {
            const st = (o.status || '').toLowerCase();
            return st !== 'delivered' && st !== 'cancelled' && st !== 'canceled';
        }).length;

        if (totalOrdersEl) totalOrdersEl.textContent = total;
        if (deliveredOrdersEl) deliveredOrdersEl.textContent = delivered;
        if (pendingDeliveriesEl) pendingDeliveriesEl.textContent = pending;

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr class="empty-row"><td colspan="9">No orders found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = '';
        filtered.forEach(order => {
            const tr = document.createElement('tr');
            const statusVal = (order.status || 'Pending').toLowerCase();
            const statusClass = statusVal === 'delivered' ? 'status-delivered' : 
                                statusVal === 'cancelled' || statusVal === 'canceled' ? 'status-cancelled' : 'status-pending';
            
            const custName = order.customerName || order.customer || order.name || 'N/A';
            const prodName = order.productName || order.product || 'N/A';
            const quantity = Number(order.quantity || order.qty || 1);

            let actionContent = '';
            if (isAdmin) {
                actionContent = `<span style="color: #94a3b8; font-size: 13px; font-weight: 500;">View only</span>`;
            } else {
                actionContent = `
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-action btn-cancel" data-id="${order.id}" style="background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">Cancel</button>
                        <button class="btn-action btn-delivered" data-id="${order.id}" style="background: #22c55e; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">Delivered</button>
                    </div>
                `;
            }

            tr.innerHTML = `
                <td><strong>${order.id || 'N/A'}</strong></td>
                <td>${custName}</td>
                <td>${order.phone || 'N/A'}</td>
                <td>${order.address || 'N/A'}</td>
                <td>${prodName}</td>
                <td>${quantity}</td>
                <td>${order.paymentMethod || order.payment || 'Cash'}</td>
                <td><span class="${statusClass}" style="font-weight: 500;">${order.status || 'Pending'}</span></td>
                <td>${actionContent}</td>
            `;
            tableBody.appendChild(tr);
        });

        if (!isAdmin) {
            // Ləğv etmə (Cancel) düyməsi -> Stok dəyişmir
            document.querySelectorAll('.btn-cancel').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    orders = orders.map(o => {
                        if (o.id === id) {
                            o.status = 'Cancelled';
                        }
                        return o;
                    });
                    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
                    localStorage.setItem('flowza_customer_orders', JSON.stringify(orders));
                    renderCourierOrders(searchInput ? searchInput.value : '');
                });
            });

            // Çatdırıldı (Delivered) düyməsi -> Stok sargydakı miqdar qədər azalır
            document.querySelectorAll('.btn-delivered').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    orders = orders.map(o => {
                        if (o.id === id) {
                            if ((o.status || '').toLowerCase() !== 'delivered') {
                                const pName = o.productName || o.product;
                                const pQty = Number(o.quantity || o.qty || 1);
                                deductWarehouseStock(pName, pQty);
                            }
                            o.status = 'Delivered';
                            o.deliveredAt = new Date().toISOString();
                        }
                        return o;
                    });
                    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
                    localStorage.setItem('flowza_customer_orders', JSON.stringify(orders));
                    renderCourierOrders(searchInput ? searchInput.value : '');
                });
            });
        }
    }

    renderCourierOrders();

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderCourierOrders(e.target.value);
        });
    }
});
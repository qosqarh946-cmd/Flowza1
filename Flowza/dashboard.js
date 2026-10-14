document.addEventListener('DOMContentLoaded', () => {
    const totalProductsEl = document.querySelector('[data-stat="total-products"]');
    const totalOrdersEl = document.querySelector('[data-stat="total-orders"]');
    const warehouseStockEl = document.querySelector('[data-stat="warehouse-stock"]');
    const activeCouriersEl = document.querySelector('[data-stat="active-couriers"]');
    
    const dailyRevEl = document.querySelector('[data-stat="daily-revenue"]');
    const monthlyRevEl = document.querySelector('[data-stat="monthly-revenue"]');
    const annualRevEl = document.querySelector('[data-stat="annual-revenue"]');
    const activityTableBody = document.getElementById('activity-table-body');

    let products = [];
    let orders = [];

    try {
        products = JSON.parse(localStorage.getItem('flowza_products') || localStorage.getItem('flowza_warehouse_items')) || [];
        orders = JSON.parse(localStorage.getItem('flowza_orders') || localStorage.getItem('flowza_customer_orders')) || [];
    } catch (e) {
        products = [];
        orders = [];
    }

    // 1. Ümumi məhsul və stok hesablanması
    const totalProducts = products.length;
    let totalStock = 0;
    products.forEach(p => {
        totalStock += Number(p.stock || p.quantity || 0);
    });

    if (totalProductsEl) totalProductsEl.textContent = totalProducts;
    if (warehouseStockEl) warehouseStockEl.textContent = totalStock;
    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;

    // 2. Aktiv kuryerlər
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('flowza_users')) || [];
    } catch (e) {
        users = [];
    }
    const courierCount = users.filter(u => (u.role || '').toLowerCase() === 'courier').length;
    if (activeCouriersEl) activeCouriersEl.textContent = courierCount > 0 ? courierCount : 1;

    // 3. Maliyyə və Gəlir Hesablamaları (Günlük, Aylıq, İllik)
    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let annualRevenue = 0;

    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    orders.forEach(order => {
        const status = (order.status || 'pending').toLowerCase();
        
        // Əgər sifariş ləğv edilibsə (cancelled), gəlirə hesablanmır
        if (status === 'cancelled' || status === 'canceled') {
            return; 
        }

        // Qiyməti müxtəlif açarlardan yoxlayırıq
        let rawPrice = order.price || order.totalPrice || order.amount || order.productPrice || order.total || 0;
        
        // Əgər sifarişdə birbaşa qiymət yoxdursa, məhsul adından anbarı yoxlayırıq
        if (!rawPrice || Number(rawPrice) === 0) {
            const ordProdName = String(order.productName || order.product || '').trim().toLowerCase();
            const matchedProduct = products.find(p => 
                String(p.name || '').trim().toLowerCase() === ordProdName
            );
            if (matchedProduct) {
                rawPrice = matchedProduct.price || 0;
            } else {
                rawPrice = 10; // Əgər məhsul tapılmazsa standart qiymət təyin edirik ki, rəqəm çıxsın
            }
        }

        if (typeof rawPrice === 'string') {
            rawPrice = rawPrice.replace(/[^0-9.]/g, '');
        }

        const price = parseFloat(rawPrice) || 0;
        const qty = parseInt(order.quantity || order.qty || 1, 10);
        const itemTotal = price * qty;

        // Tarix təyini
        const orderDateStr = order.createdAt || order.deliveredAt || order.date;
        const orderDate = orderDateStr ? new Date(orderDateStr) : new Date();

        if (isNaN(orderDate.getTime())) {
            dailyRevenue += itemTotal;
            monthlyRevenue += itemTotal;
            annualRevenue += itemTotal;
        } else {
            if (orderDate.getFullYear() === currentYear) {
                annualRevenue += itemTotal;
                if (orderDate.getMonth() === currentMonth) {
                    monthlyRevenue += itemTotal;
                    if (orderDate.getDate() === currentDay) {
                        dailyRevenue += itemTotal;
                    }
                }
            }
        }
    });

    // Ekrana format olunmuş şəkildə yazdırırıq
    if (dailyRevEl) dailyRevEl.textContent = `$${dailyRevenue.toFixed(2)}`;
    if (monthlyRevEl) monthlyRevEl.textContent = `$${monthlyRevenue.toFixed(2)}`;
    if (annualRevEl) annualRevEl.textContent  = `$${annualRevenue.toFixed(2)}`;

    // 4. Son fəaliyyətlər cədvəli
    if (activityTableBody) {
        if (orders.length === 0) {
            activityTableBody.innerHTML = `<tr class="empty-row"><td colspan="4">No activity yet.</td></tr>`;
        } else {
            activityTableBody.innerHTML = '';
            const recentOrders = orders.slice(-5).reverse();
            recentOrders.forEach(ord => {
                const tr = document.createElement('tr');
                const statusVal = ord.status || 'Pending';
                const statusClass = statusVal.toLowerCase() === 'delivered' ? 'status-delivered' : 
                                    statusVal.toLowerCase() === 'cancelled' ? 'status-cancelled' : 'status-pending';

                const dateDisplay = ord.createdAt ? new Date(ord.createdAt).toLocaleString() : (ord.date || 'Recent');
                const ordId = ord.id || 'N/A';
                const custName = ord.customerName || ord.customer || ord.name || 'Customer';

                tr.innerHTML = `
                    <td><strong>Order ${ordId}</strong></td>
                    <td>${custName}</td>
                    <td><span class="${statusClass}" style="font-weight: 500;">${statusVal}</span></td>
                    <td>${dateDisplay}</td>
                `;
                activityTableBody.appendChild(tr);
            });
        }
    }
});
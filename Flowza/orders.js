document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const ORDERS_KEY = "flowza_orders";

    const tableBody = document.getElementById("orders-table-body");
    const searchInput = document.getElementById("orders-search");

    if (!tableBody) return;

    function getOrders() {
        try {
            const data = JSON.parse(localStorage.getItem(ORDERS_KEY) || localStorage.getItem('flowza_customer_orders'));
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };
            return entities[char];
        });
    }

    function getOrderTotal(order) {
        const savedTotal = order.totalPrice ?? order.total;

        if (
            savedTotal !== undefined &&
            savedTotal !== null &&
            savedTotal !== "" &&
            Number.isFinite(Number(savedTotal)) &&
            Number(savedTotal) >= 0
        ) {
            return Number(savedTotal);
        }

        const price = order.price ?? order.productPrice ?? order.unitPrice ?? 0;
        const quantity = Number(order.quantity ?? order.qty ?? 1);

        if (
            Number.isFinite(Number(price)) &&
            Number(price) >= 0 &&
            Number.isFinite(quantity) &&
            quantity > 0
        ) {
            return Number((Number(price) * quantity).toFixed(2));
        }

        return 0;
    }

    function formatMoney(amount) {
        if (amount === null || amount === undefined) {
            return "$0.00";
        }
        return "$" + Number(amount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatDate(dateString) {
        if (!dateString) return "—";
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function getStatusClass(status) {
        const normalized = String(status || "").toLowerCase();

        if (normalized === "delivered") return "delivered";
        if (normalized === "cancelled" || normalized === "canceled") {
            return "cancelled";
        }

        return "pending";
    }

    function updateStats(orders) {
        const totalOrders = document.querySelector('[data-stat="total-orders"]');
        const pendingOrders = document.querySelector('[data-stat="pending-orders"]');
        const completedOrders = document.querySelector('[data-stat="completed"]');
        const totalSales = document.querySelector('[data-stat="total-sales"]');

        if (totalOrders) {
            totalOrders.textContent = orders.length;
        }

        if (pendingOrders) {
            pendingOrders.textContent = orders.filter(function (order) {
                const st = String(order.status || "").toLowerCase();
                return st !== "delivered" && st !== "cancelled" && st !== "canceled";
            }).length;
        }

        if (completedOrders) {
            completedOrders.textContent = orders.filter(function (order) {
                return String(order.status || "").toLowerCase() === "delivered";
            }).length;
        }

        if (totalSales) {
            const sales = orders.reduce(function (sum, order) {
                if (String(order.status || "").toLowerCase() === "delivered") {
                    return sum + getOrderTotal(order);
                }
                return sum;
            }, 0);

            totalSales.textContent = formatMoney(sales);
        }
    }

    function renderOrders() {
        const orders = getOrders();
        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        updateStats(orders);

        const filteredOrders = orders.filter(function (order) {
            const cName = order.customerName || order.customer || order.name || "";
            const cPhone = order.customerPhone || order.phone || "";
            const pName = order.productName || order.product || "";
            
            const searchable = [
                order.id,
                cName,
                cPhone,
                pName,
                order.status
            ].join(" ").toLowerCase();

            return searchable.includes(searchTerm);
        });

        if (filteredOrders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:30px;">
                        No orders found.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filteredOrders.map(function (order) {
            const total = getOrderTotal(order);
            const quantity = Number(order.quantity || order.qty) || 1;
            const status = order.status || "Pending";
            const orderId = escapeHTML(order.id || "—");
            const cName = escapeHTML(order.customerName || order.customer || order.name || "—");
            const pName = escapeHTML(order.productName || order.product || "—");

            return `
                <tr>
                    <td>${orderId}</td>
                    <td>${cName}</td>
                    <td>
                        ${pName}
                        × ${quantity}
                    </td>
                    <td class="order-total-cell">
                        ${formatMoney(total)}
                    </td>
                    <td>
                        <span class="status-${getStatusClass(status)}">
                            ${escapeHTML(status)}
                        </span>
                    </td>
                    <td>
                        <button
                            type="button"
                            class="view-order-btn"
                            data-order-id="${orderId}"
                        >
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function createOrderModal() {
        if (document.getElementById("order-details-modal")) return;

        const modal = document.createElement("div");
        modal.id = "order-details-modal";
        modal.className = "order-modal";

        modal.innerHTML = `
            <div class="order-modal-content" role="dialog"
                 aria-modal="true" aria-labelledby="order-modal-title">
                <div class="order-modal-header">
                    <div>
                        <h2 id="order-modal-title">Order Details</h2>
                        <p id="modal-order-id"></p>
                    </div>
                    <button type="button" class="order-modal-close"
                            aria-label="Close">&times;</button>
                </div>

                <div class="order-details-grid">
                    <div class="order-detail-item">
                        <span>Customer</span>
                        <strong id="modal-customer"></strong>
                    </div>
                    <div class="order-detail-item">
                        <span>Phone</span>
                        <strong id="modal-phone"></strong>
                    </div>
                    <div class="order-detail-item">
                        <span>Address</span>
                        <strong id="modal-address"></strong>
                    </div>
                    <div class="order-detail-item">
                        <span>Product</span>
                        <strong id="modal-product"></strong>
                    </div>
                    <div class="order-detail-item">
                        <span>Quantity</span>
                        <strong id="modal-quantity"></strong>
                    </div>
                    <div class="order-detail-item">
                        <span>Unit Price</span>
                        <strong id="modal-price"></strong>
                    </div>
                    <div class="order-detail-item">
                        <span>Total (USD)</span>
                        <strong id="modal-total"></strong>
                    </div>
                    <div class="order-detail-item">
                        <span>Payment</span>
                        <strong id="modal-payment"></strong>
                    </div>
                    <div class="order-detail-item">
                        <span>Status</span>
                        <strong id="modal-status"></strong>
                    </div>
                    <div class="order-detail-item">
                        <span>Created</span>
                        <strong id="modal-date"></strong>
                    </div>
                </div>

                <div class="order-modal-footer">
                    <button type="button" class="order-modal-done">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        function closeModal() {
            modal.classList.remove("show");
        }

        modal.querySelector(".order-modal-close").addEventListener("click", closeModal);
        modal.querySelector(".order-modal-done").addEventListener("click", closeModal);

        modal.addEventListener("click", function (event) {
            if (event.target === modal) closeModal();
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeModal();
        });
    }

    function setModalText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value ?? "—";
        }
    }

    function openOrderModal(order) {
        const price = order.price ?? order.productPrice ?? order.unitPrice;
        const total = getOrderTotal(order);

        setModalText("modal-order-id", order.id || "—");
        setModalText("modal-customer", order.customerName || order.customer || order.name || "—");
        setModalText("modal-phone", order.customerPhone || order.phone || "—");
        setModalText("modal-address", order.customerAddress || order.address || "—");
        setModalText("modal-product", order.productName || order.product || "—");
        setModalText("modal-quantity", order.quantity ?? order.qty ?? "—");
        setModalText(
            "modal-price",
            price !== undefined && price !== null && price !== ""
                ? formatMoney(Number(price))
                : "Price unavailable"
        );
        setModalText("modal-total", formatMoney(total));
        setModalText("modal-payment", order.paymentMethod || order.payment || "—");
        setModalText("modal-status", order.status || "Pending");
        setModalText("modal-date", formatDate(order.createdAt));

        document.getElementById("order-details-modal").classList.add("show");
    }

    tableBody.addEventListener("click", function (event) {
        const button = event.target.closest(".view-order-btn");
        if (!button) return;

        const orderId = button.dataset.orderId;
        const order = getOrders().find(function (item) {
            return String(item.id) === String(orderId);
        });

        if (order) openOrderModal(order);
    });

    if (searchInput) {
        searchInput.addEventListener("input", renderOrders);
    }

    createOrderModal();
    renderOrders();
});
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const STORAGE_KEY = 'flowza_products';
    const LOW_STOCK_LIMIT = 10;

    const tableBody = document.getElementById('warehouse-table-body');
    const unitStat = document.querySelector('[data-stat="inventory-units"]');
    const lowStockStat = document.querySelector('[data-stat="low-stock-items"]');

    const editDialog = document.getElementById('edit-dialog');
    const editForm = document.getElementById('edit-form');
    const editCancel = document.getElementById('edit-cancel');
    const editCloseX = document.getElementById('edit-close-x');

    const editIndex = document.getElementById('edit-index');
    const editName = document.getElementById('edit-name');
    const editPrice = document.getElementById('edit-price');
    const editStock = document.getElementById('edit-stock');
    const editDescription = document.getElementById('edit-description');

    const editFileInput = document.getElementById('edit-image-file');
    const editPreviewImg = document.getElementById('edit-image-preview');
    const editPlaceholder = document.getElementById('edit-upload-placeholder');

    const searchInput =
        document.getElementById('warehouse-search') ||
        document.querySelector('.search-box input');

    if (!tableBody) return;

    let products = loadProducts();
    let currentImage = '';

    function loadProducts() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error('Could not load products:', error);
            return [];
        }
    }

    function saveProducts() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
            return true;
        } catch (error) {
            showToast('Could not save changes.', 'error');
            return false;
        }
    }

    function showToast(message, type) {
        let toast = document.getElementById('flowza-toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'flowza-toast';

            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '14px 22px',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'center',
                maxWidth: '90%',
                width: 'max-content',
                boxSizing: 'border-box',
                zIndex: '99999',
                boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                overflowWrap: 'anywhere'
            });

            document.body.appendChild(toast);
        }

        toast.style.background = type === 'error' ? '#dc2626' : '#16a34a';
        toast.textContent = message;
        toast.style.display = 'block';

        clearTimeout(toast.hideTimer);

        toast.hideTimer = setTimeout(function () {
            toast.style.display = 'none';
        }, 3000);
    }

    function createCell(value) {
        const cell = document.createElement('td');
        cell.textContent = value;
        return cell;
    }

    function updateStats() {
        const totalUnits = products.reduce(function (total, product) {
            return total + (Number(product.stock) || 0);
        }, 0);

        const lowStockCount = products.filter(function (product) {
            return Number(product.stock) <= LOW_STOCK_LIMIT;
        }).length;

        if (unitStat) unitStat.textContent = totalUnits;
        if (lowStockStat) lowStockStat.textContent = lowStockCount;
    }

    function renderWarehouse() {
        products = loadProducts();

        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : '';

        const filteredProducts = products
            .map(function (product, index) {
                return { product: product, index: index };
            })
            .filter(function (item) {
                const product = item.product;

                return (
                    String(product.name || '').toLowerCase().includes(searchTerm) ||
                    String(product.sku || product.number || '')
                        .toLowerCase().includes(searchTerm)
                );
            });

        tableBody.replaceChildren();

        if (filteredProducts.length === 0) {
            const row = document.createElement('tr');
            row.className = 'empty-row';

            const cell = createCell(
                products.length > 0
                    ? 'No items match your search.'
                    : 'The warehouse is empty. Products you add will appear here.'
            );

            cell.colSpan = 7;
            row.appendChild(cell);
            tableBody.appendChild(row);

            updateStats();
            return;
        }

        filteredProducts.slice().reverse().forEach(function (item) {
            const product = item.product;
            const index = item.index;
            const stock = Number(product.stock) || 0;

            const row = document.createElement('tr');
            const itemCell = document.createElement('td');
            const itemContainer = document.createElement('div');

            Object.assign(itemContainer.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            });

            if (product.image) {
                const image = document.createElement('img');
                image.src = product.image;
                image.alt = product.name || 'Product image';

                Object.assign(image.style, {
                    width: '40px',
                    height: '40px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    flexShrink: '0'
                });

                itemContainer.appendChild(image);
            }

            const name = document.createElement('span');
            name.textContent = product.name || 'Unnamed product';
            itemContainer.appendChild(name);
            itemCell.appendChild(itemContainer);

            const sku = product.sku ||
                ('FLZ-' + String(product.number || index + 1).padStart(4, '0'));

            const price = (Number(product.price) || 0).toFixed(2);

            let statusText = 'In stock';
            let statusClass = 'status-active';

            if (stock <= 0) {
                statusText = 'Out of stock';
                statusClass = 'status-inactive';
            } else if (stock <= LOW_STOCK_LIMIT) {
                statusText = 'Low stock';
            }

            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');

            statusBadge.className = statusClass;
            statusBadge.textContent = statusText;
            statusCell.appendChild(statusBadge);

            const actionsCell = document.createElement('td');

            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'action-btn edit-btn';
            editButton.dataset.action = 'edit';
            editButton.dataset.index = index;
            editButton.title = 'Edit product';
            editButton.setAttribute('aria-label', 'Edit product');
            editButton.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'action-btn delete-btn';
            deleteButton.dataset.action = 'delete';
            deleteButton.dataset.index = index;
            deleteButton.title = 'Delete product';
            deleteButton.setAttribute('aria-label', 'Delete product');
            deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

            actionsCell.append(editButton, deleteButton);

            row.append(
                itemCell,
                createCell(sku),
                createCell(price),
                createCell(product.location || 'Main warehouse'),
                createCell(String(stock)),
                statusCell,
                actionsCell
            );

            tableBody.appendChild(row);
        });

        updateStats();
    }

    function openEdit(index) {
        const product = products[index];

        if (!product || !editDialog || !editForm) {
            showToast('Edit dialog could not be opened.', 'error');
            return;
        }

        editIndex.value = index;
        editName.value = product.name || '';
        editPrice.value = product.price ?? 0;
        editStock.value = product.stock ?? 0;
        editDescription.value = product.description || '';

        currentImage = product.image || '';

        if (editPreviewImg) {
            editPreviewImg.src = currentImage;
            editPreviewImg.style.display = currentImage ? 'block' : 'none';
        }

        if (editPlaceholder) {
            editPlaceholder.style.display = currentImage ? 'none' : 'flex';
        }

        if (editFileInput) editFileInput.value = '';

        if (!editDialog.open) {
            editDialog.showModal();
        }
    }

    // Silmə əməliyyatı: heç bir 'confirm' pəncərəsi çıxmadan birbaşa avtomatik silinir
    tableBody.addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action]');

        if (!button || !tableBody.contains(button)) return;

        const index = Number(button.dataset.index);
        const product = products[index];

        if (!product) return;

        if (button.dataset.action === 'edit') {
            openEdit(index);
            return;
        }

        if (button.dataset.action === 'delete') {
            const deletedProduct = products.splice(index, 1)[0];

            if (saveProducts()) {
                renderWarehouse();
                showToast('Product deleted successfully!', 'success');
            } else {
                products.splice(index, 0, deletedProduct);
                renderWarehouse();
            }
        }
    });

    if (editFileInput) {
        editFileInput.addEventListener('change', function () {
            const file = editFileInput.files && editFileInput.files[0];

            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file.', 'error');
                editFileInput.value = '';
                return;
            }

            const reader = new FileReader();

            reader.onload = function () {
                const image = new Image();

                image.onload = function () {
                    const maxSize = 600;
                    const scale = Math.min(
                        1,
                        maxSize / Math.max(image.width, image.height)
                    );

                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(image.width * scale));
                    canvas.height = Math.max(1, Math.round(image.height * scale));

                    const context = canvas.getContext('2d');

                    if (!context) {
                        showToast('Could not process the selected image.', 'error');
                        return;
                    }

                    context.drawImage(
                        image,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    currentImage = canvas.toDataURL('image/jpeg', 0.75);

                    if (editPreviewImg) {
                        editPreviewImg.src = currentImage;
                        editPreviewImg.style.display = 'block';
                    }

                    if (editPlaceholder) {
                        editPlaceholder.style.display = 'none';
                    }
                };

                image.src = reader.result;
            };

            reader.readAsDataURL(file);
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const index = Number(editIndex.value);
            const product = products[index];

            if (!product) return;

            const name = editName.value.trim();
            const price = Number(editPrice.value);
            const stock = Number(editStock.value);

            if (!name) {
                showToast('Please enter a product name.', 'error');
                return;
            }

            product.name = name;
            product.price = price;
            product.stock = stock;
            product.description = editDescription.value.trim();
            product.image = currentImage;

            if (saveProducts()) {
                if (editDialog && editDialog.open) {
                    editDialog.close();
                }

                renderWarehouse();
                showToast('Product updated successfully!', 'success');
            }
        });
    }

    if (editCancel) editCancel.addEventListener('click', () => editDialog.close());
    if (editCloseX) editCloseX.addEventListener('click', () => editDialog.close());

    if (searchInput) {
        searchInput.addEventListener('input', renderWarehouse);
    }

    // QLOBAL STOK AZALTMA FUNKSİYASI
    window.reduceWarehouseStock = function (productName, quantity) {
        products = loadProducts();
        let isUpdated = false;
        const targetName = String(productName || '').trim().toLowerCase();
        const qty = Number(quantity) || 1;

        products = products.map(function (prod) {
            const prodName = String(prod.name || '').trim().toLowerCase();
            const prodSku = String(prod.sku || '').trim().toLowerCase();

            if (prodName === targetName || prodSku === targetName) {
                const currentStock = Number(prod.stock) || 0;
                prod.stock = Math.max(0, currentStock - qty);
                isUpdated = true;
            }
            return prod;
        });

        if (isUpdated) {
            saveProducts();
            renderWarehouse();
            return true;
        }
        return false;
    };

    window.addEventListener('storage', function (event) {
        if (event.key === STORAGE_KEY) {
            renderWarehouse();
        }
    });

    renderWarehouse();
});
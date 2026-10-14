document.addEventListener('DOMContentLoaded', () => {
    const triggerBox = document.getElementById('upload-trigger');
    const fileInput = document.getElementById('product-image-file');
    const previewImg = document.getElementById('image-preview');
    const placeholder = document.getElementById('upload-placeholder');
    const productForm = document.getElementById('product-form');
    const msgEl = document.getElementById('form-message');

    let uploadedImageBase64 = '';

    if (triggerBox && fileInput) {
        triggerBox.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    uploadedImageBase64 = event.target.result;
                    previewImg.src = uploadedImageBase64;
                    previewImg.style.display = 'block';
                    if (placeholder) {
                        placeholder.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('product-name').value.trim();
            const price = Number(document.getElementById('product-price').value.trim()) || 0;
            const stock = Number(document.getElementById('product-stock').value.trim()) || 0;
            const description = document.getElementById('product-description').value.trim();

            if (!name || price < 0 || stock < 0) {
                if (msgEl) {
                    msgEl.style.color = '#ef4444';
                    msgEl.textContent = 'Please fill in all required fields correctly.';
                }
                return;
            }

            const newProduct = {
                id: 'PRD-' + Date.now(),
                name: name,
                price: price,
                stock: stock, // Dəqiq daxil edilən miqdar yazılır
                description: description,
                image: uploadedImageBase64 || '',
                sku: 'SKU-' + Math.floor(100000 + Math.random() * 900000),
                location: 'Main Warehouse',
                status: 'Available',
                createdAt: new Date().toISOString()
            };

            // Yalnız yeganə açardan istifadə edirik ki, stok şişməsi və dublikat yaranmasın
            let products = [];
            try {
                products = JSON.parse(localStorage.getItem('flowza_products')) || [];
            } catch (err) {
                products = [];
            }

            products.push(newProduct);
            localStorage.setItem('flowza_products', JSON.stringify(products));
            // Köhnə artıq açarı təmizləyirik
            localStorage.removeItem('flowza_warehouse_items');

            if (msgEl) {
                msgEl.style.color = '#22c55e'; 
                msgEl.textContent = 'Successfully added to warehouse!';
            }

            productForm.reset();
            previewImg.style.display = 'none';
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
            uploadedImageBase64 = '';

            setTimeout(() => {
                window.location.href = './warehouse.html';
            }, 1200);
        });
    }
});
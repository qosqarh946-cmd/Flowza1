document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const roleSelect = document.getElementById('reg-role');
    const firstNameInput = document.getElementById('reg-firstname');
    const lastNameInput = document.getElementById('reg-lastname');
    const passwordInput = document.getElementById('reg-password');
    
    // Rol sahələri
    const fieldsAdmin = document.getElementById('fields-admin');
    const fieldsWarehouse = document.getElementById('fields-warehouse');
    const fieldsCourier = document.getElementById('fields-courier');
    
    const storeInput = document.getElementById('reg-store');
    const adminPhone = document.getElementById('reg-admin-phone');
    const whAddress = document.getElementById('reg-wh-address');
    const whPhone = document.getElementById('reg-wh-phone');
    const courierPhone = document.getElementById('reg-phone');
    const courierAddress = document.getElementById('reg-address');

    // Mesaj göstərmək üçün element
    let msgEl = document.getElementById('form-message');
    if (!msgEl && registerForm) {
        msgEl = document.createElement('div');
        msgEl.id = 'form-message';
        msgEl.style.marginTop = '12px';
        msgEl.style.fontSize = '13px';
        msgEl.style.textAlign = 'center';
        registerForm.appendChild(msgEl);
    }

    const USERS_KEY = 'flowza_users';
    const CURRENT_USER_KEY = 'flowza_current_user';

    // Rol dəyişdikdə müvafiq input sahələrini göstər/gizlə
    if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (fieldsAdmin) fieldsAdmin.style.display = val === 'admin' ? 'block' : 'none';
            if (fieldsWarehouse) fieldsWarehouse.style.display = val === 'warehouse' ? 'block' : 'none';
            if (fieldsCourier) fieldsCourier.style.display = val === 'courier' ? 'block' : 'none';
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const role = roleSelect ? roleSelect.value : 'admin';
            const firstName = firstNameInput ? firstNameInput.value.trim() : '';
            const lastName = lastNameInput ? lastNameInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value.trim() : '';

            if (!firstName || !lastName || !password) {
                if (msgEl) {
                    msgEl.style.color = '#ef4444';
                    msgEl.textContent = 'Please fill in all required fields.';
                }
                return;
            }

            // Yalnız hərf yoxlaması (rəqəm və simvollar qəbul olunmur)
            const nameRegex = /^[A-Za-zƏəİiÖöÜüĞğŞşÇç\s]+$/;
            if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
                if (msgEl) {
                    msgEl.style.color = '#ef4444';
                    msgEl.textContent = 'First and last name must contain only letters (no numbers or symbols).';
                }
                return;
            }

            let users = [];
            try {
                users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
            } catch (err) {
                users = [];
            }

            let storeName = 'Main Store';
            let phone = '';
            let address = '';

            if (role === 'admin') {
                storeName = storeInput && storeInput.value.trim() ? storeInput.value.trim() : 'Admin Store';
                phone = adminPhone ? adminPhone.value.trim() : '';
            } else if (role === 'warehouse') {
                storeName = 'Warehouse Department';
                address = whAddress ? whAddress.value.trim() : '';
                phone = whPhone ? whPhone.value.trim() : '';
            } else if (role === 'courier') {
                storeName = 'Courier Delivery';
                phone = courierPhone ? courierPhone.value.trim() : '';
                address = courierAddress ? courierAddress.value.trim() : '';
            }

            const newUser = {
                id: 'user_' + Date.now(),
                firstName: firstName,
                lastName: lastName,
                password: password,
                role: role,
                storeName: storeName,
                phone: phone,
                address: address,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

            if (msgEl) {
                msgEl.style.color = '#22c55e';
                msgEl.textContent = 'Registration successful! Redirecting to panel...';
            }

            // Seçilən rola uyğun olaraq dərhal müvafiq panelə yönləndiririk:
            setTimeout(() => {
                if (role === 'warehouse') {
                    window.location.href = './warehouse.html';
                } else if (role === 'courier') {
                    window.location.href = './courier.html';
                } else {
                    window.location.href = './dashboard.html';
                }
            }, 800);
        });
    }
});
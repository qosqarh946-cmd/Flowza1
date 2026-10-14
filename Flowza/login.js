document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');

    // Əgər mesaj göstərmək üçün element yoxdursa, avtomatik düymənin altında yaradırıq
    let msgEl = document.getElementById('form-message');
    if (!msgEl && loginForm) {
        msgEl = document.createElement('div');
        msgEl.id = 'form-message';
        msgEl.style.marginTop = '12px';
        msgEl.style.fontSize = '13px';
        msgEl.style.textAlign = 'center';
        loginForm.appendChild(msgEl);
    }

    const USERS_KEY = 'flowza_users';
    const CURRENT_USER_KEY = 'flowza_current_user';

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const loginVal = loginInput ? loginInput.value.trim().toLowerCase() : '';
            const passwordVal = passwordInput ? passwordInput.value.trim() : '';
if (!loginVal || !passwordVal) {
                if (msgEl) {
                    msgEl.style.color = '#ef4444';
                    msgEl.textContent = 'Please enter both login and password.';
                }
                return;
            }

            let users = [];
            try {
                users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
            } catch (err) {
                users = [];
            }

            // İstifadəçini daxil edilən login (First Name və ya ad) və şifrə ilə axtarırıq
            const foundUser = users.find(u => {
                const fName = (u.firstName || '').toLowerCase();
                const lName = (u.lastName || '').toLowerCase();
                const fullName = `${fName} ${lName}`.trim();

                return (fName === loginVal || fullName === loginVal || loginVal === fName) && u.password === passwordVal;
            });

         if (!foundUser) {
                if (msgEl) {
                    msgEl.style.color = '#ef4444';
                    msgEl.textContent = 'Invalid login or password! Please check your details.';
                }
                return;
            }

            // Sessiyanı yadda saxla ki, təkrar login tələb olunmasın
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));

            if (msgEl) {
               msgEl.style.color = '#22c55e';
msgEl.textContent = 'Login successful! Redirecting...';
            }

            // Qısa gecikmə ilə rola uyğun panelə (Admin üçün dashboard.html) atırıq
            setTimeout(() => {
                const role = foundUser.role;
                if (role === 'courier') {
                    window.location.href = './courier.html';
                } else if (role === 'warehouse') {
                    window.location.href = './warehouse.html';
                } else {
                    window.location.href = './dashboard.html';
                }
            }, 800);
        });
    }
});
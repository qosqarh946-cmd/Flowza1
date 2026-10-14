document.addEventListener('DOMContentLoaded', () => {
    const USERS_KEY = 'flowza_users';
    const CURRENT_USER_KEY = 'flowza_current_user';

    // 1. Cari istifadəçini yoxla
    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));

    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = './login.html';
        return;
    }

    // 2. Profil məlumatlarını istənilən paneldə göstərmək üçün funksiya
    function renderUserProfile() {
        const firstName = currentUser.firstName || currentUser.name || 'Admin';
        const lastName = currentUser.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const storeName = currentUser.storeName || currentUser.role.toUpperCase();

        const userDetailsCard = document.querySelector('.workspace-user-card .user-details');
        if (userDetailsCard) {
            const nameH4 = userDetailsCard.querySelector('h4');
            const roleP = userDetailsCard.querySelector('p');
            
            if (nameH4) nameH4.textContent = fullName;
            if (roleP) roleP.textContent = storeName;
        }

        const userAvatar = document.querySelector('.workspace-user-card .user-avatar');
        if (userAvatar) {
            userAvatar.textContent = firstName.charAt(0).toUpperCase();
        }
    }

    renderUserProfile();

    // 3. İstifadəçiləri oxu
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
        users = [];
    }

    if (!users.some(u => u.id === currentUser.id)) {
        users.push(currentUser);
    }

    // 4. Statistika kartları
    const totalUsersEl = document.querySelector('[data-stat="total-users"]');
    const adminCountEl = document.querySelector('[data-stat="administrators"]');

    if (totalUsersEl) totalUsersEl.textContent = users.length;
    if (adminCountEl) {
        const adminCount = users.filter(u => u.role === 'admin' || (u.role || '').toLowerCase() === 'admin').length;
        adminCountEl.textContent = adminCount;
    }

    // 5. Cədvəli doldur
    const tableBody = document.getElementById('users-table-body');
    const msgEl = document.getElementById('admin-message');

    function renderTable() {
        if (!tableBody) return;

        if (users.length === 0) {
            tableBody.innerHTML = `<tr class="empty-row"><td colspan="5">No users yet.</td></tr>`;
        } else {
            tableBody.innerHTML = '';
            users.forEach(user => {
                const uFirst = user.firstName || user.name || 'User';
                const uLast = user.lastName || '';
                const uName = `${uFirst} ${uLast}`.trim();
                
                const uContact = user.phone ? `Phone: ${user.phone}` : (user.address || 'N/A');
                const uRole = user.role ? user.role.toUpperCase() : 'USER';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${uName}</strong></td>
                    <td>${uContact}</td>
                    <td><span class="badge ${user.role}">${uRole}</span></td>
                    <td><span class="status-active">Active</span></td>
                    <td>
                        <button class="btn-action delete-user" data-id="${user.id}" title="Delete User" style="background: transparent; border: none; color: #ef4444; cursor: pointer;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Zibil qutusuna klikləyən kimi təsdiq pəncərəsi olmadan dərhal silmə
            document.querySelectorAll('.delete-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idToDelete = e.currentTarget.getAttribute('data-id');
                    
                    if (idToDelete === currentUser.id) {
                        if (msgEl) {
                            msgEl.style.color = '#ef4444';
                            msgEl.textContent = "You cannot delete your own active account!";
                        }
                        return;
                    }

                    // İstifadəçini siyahıdan çıxarırıq
                    users = users.filter(u => u.id !== idToDelete);
                    localStorage.setItem(USERS_KEY, JSON.stringify(users));

                    // Uğurlu silinmə mesajı ingilis dilində
                    if (msgEl) {
                        msgEl.style.color = '#22c55e';
                        msgEl.textContent = "User deleted successfully!";
                    }

                    // Cədvəli və statistikaları yeniləyirik
                    if (totalUsersEl) totalUsersEl.textContent = users.length;
                    if (adminCountEl) {
                        adminCountEl.textContent = users.filter(u => u.role === 'admin' || (u.role || '').toLowerCase() === 'admin').length;
                    }

                    renderTable();
                });
            });
        }
    }

    renderTable();

    // 6. Sign out
    const signOutBtn = document.querySelector('.account-section a.nav-link');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem(CURRENT_USER_KEY);
            window.location.href = './login.html';
        });
    }
});
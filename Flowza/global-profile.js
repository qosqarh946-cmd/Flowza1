document.addEventListener('DOMContentLoaded', () => {
    const CURRENT_USER_KEY = 'flowza_current_user';
    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));

    if (!currentUser) {
        const page = window.location.pathname.split('/').pop().toLowerCase();
        if (page !== 'login.html' && page !== 'register.html' && page !== '') {
            window.location.href = './login.html';
        }
        return;
    }

    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const userRole = (currentUser.role || 'admin').toLowerCase();

    // 1. Səhifə qadağaları
    if (userRole === 'warehouse') {
        if (!currentPage.includes('warehouse') && !currentPage.includes('products')) {
            window.location.href = './warehouse.html';
            return;
        }
    } else if (userRole === 'courier') {
        if (!currentPage.includes('courier')) {
            window.location.href = './courier.html';
            return;
        }
    }
    // Admin üçün heç bir səhifə qadağası yoxdur, hər şeyi görə bilər!

    // 2. Profil məlumatları
    const firstName = currentUser.firstName || currentUser.name || 'User';
    const lastName = currentUser.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    let rawStore = currentUser.storeName || currentUser.role || 'Workspace';
    rawStore = rawStore.replace(/store/gi, '').trim();
    const storeName = rawStore ? `${rawStore} Store` : 'Main Store';

    const userDetailsCards = document.querySelectorAll('.workspace-user-card .user-details');
    userDetailsCards.forEach(card => {
        const nameH4 = card.querySelector('h4');
        const roleP = card.querySelector('p');
        
        if (nameH4) nameH4.textContent = fullName;
        if (roleP) roleP.textContent = storeName;
    });

    const userAvatars = document.querySelectorAll('.workspace-user-card .user-avatar');
    userAvatars.forEach(avatar => {
        avatar.textContent = firstName.charAt(0).toUpperCase();
    });

    // 3. Menyu linklərinin rollara görə filtirlənməsi
    const navLinks = document.querySelectorAll('.sidebar-menu .nav-links .nav-link, .nav-section:not(.account-section) .nav-link');
    navLinks.forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        
        if (userRole === 'warehouse') {
            if (!href.includes('warehouse') && !href.includes('products')) {
                link.style.display = 'none';
            }
        } else if (userRole === 'courier') {
            if (!href.includes('courier')) {
                link.style.display = 'none';
            }
        } else if (userRole === 'admin') {
            // Admin üçün bütün menyular açıqdır
            link.style.display = 'flex';
        }
    });

    // 4. Sign out düyməsi
    const accountSection = document.querySelector('.account-section');
    let signOutBtn = document.getElementById('signOutBtn') || document.querySelector('.account-section a[href*="sign"], .account-section .nav-link');

    if (accountSection && !signOutBtn) {
        signOutBtn = document.createElement('a');
        signOutBtn.href = '#';
        signOutBtn.id = 'signOutBtn';
        signOutBtn.className = 'nav-link';
        signOutBtn.style.color = '#ef4444';
        signOutBtn.style.marginBottom = '8px';
        signOutBtn.innerHTML = `<i class="fa-solid fa-arrow-right-from-bracket"></i> Sign out`;
        accountSection.insertBefore(signOutBtn, accountSection.firstChild);
    }

    if (signOutBtn) {
        signOutBtn.style.display = 'flex';
        signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem(CURRENT_USER_KEY);
            window.location.href = './login.html';
        });
    }
});
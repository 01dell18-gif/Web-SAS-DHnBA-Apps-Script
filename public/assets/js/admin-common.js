/**
 * Admin Panel Common Library
 * SMK NEGERI 1 KLUNGKUNG
 */

// 1. Validasi Autentikasi Pengguna
(function checkAuth() {
    if (localStorage.getItem('sas_admin_auth') !== '1') {
        window.location.href = '/admin/login.html';
    }
})();

// 2. Global State DB
let db = {
    classes: [],
    students: [],
    teachers: [],
    templates: [],
    settings: {},
    archives: [],
    users: []
};

// 3. Load DB data
async function loadAdminDatabase() {
    try {
        const res = await fetch('/data/db.json?t=' + Date.now());
        if (res.ok) {
            db = await res.json();
        } else {
            // Fallback localStorage jika dijalankan di GitHub Pages
            const cached = localStorage.getItem('sas_offline_db');
            if (cached) db = JSON.parse(cached);
        }
    } catch (e) {
        console.warn('Gagal memuat db dari server, mencoba fallback lokal:', e);
        const cached = localStorage.getItem('sas_offline_db');
        if (cached) db = JSON.parse(cached);
    }
    return db;
}

// 4. Save DB helper
async function saveAdminDatabase(payload) {
    try {
        const res = await fetch('/api/save-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            // Sinkronkan ke cache offline
            localStorage.setItem('sas_offline_db', JSON.stringify(db));
            return { success: true, message: json.message };
        }
        return { success: false, message: json.message || 'Gagal menyimpan ke server' };
    } catch (e) {
        // Fallback simpan lokal jika offline / GitHub Pages
        localStorage.setItem('sas_offline_db', JSON.stringify(db));
        return { success: true, message: 'Tersimpan ke penyimpanan lokal (Mode Offline).' };
    }
}

// 5. Toast Notification
function showToast(message, type = 'info') {
    let toast = document.getElementById('adminToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'adminToast';
        toast.className = 'toast-notify';
        document.body.appendChild(toast);
    }

    toast.className = 'toast-notify toast-' + type;
    toast.innerHTML = `<i class="bi bi-info-circle-fill"></i> ${message}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// 6. Logout
function logout() {
    localStorage.removeItem('sas_admin_auth');
    localStorage.removeItem('sas_admin_user');
    localStorage.removeItem('sas_admin_name');
    localStorage.removeItem('sas_admin_role');
    window.location.href = '/admin/login.html';
}

// 7. Inisialisasi Header Identitas
document.addEventListener('DOMContentLoaded', () => {
    const adminUserEl = document.getElementById('adminUsername');
    if (adminUserEl) {
        const name = localStorage.getItem('sas_admin_name') || localStorage.getItem('sas_admin_user') || 'Administrator';
        adminUserEl.textContent = name;
    }

    // Set active link sidebar sesuai pathname
    const currentPath = window.location.pathname;
    document.querySelectorAll('.admin-nav-item').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath.endsWith(href) || (href.endsWith('index.html') && (currentPath.endsWith('/admin/') || currentPath.endsWith('/admin'))))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

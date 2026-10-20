/**
 * Admin Panel Common Library
 * SMK NEGERI FYJ CHANNEL
 */

// 1. Validasi Autentikasi Pengguna & Pembatasan Hak Akses (Role-Based Access Control)
(function checkAuth() {
    if (localStorage.getItem('sas_admin_auth') !== '1') {
        window.location.href = '/admin/login.html';
        return;
    }

    const role = (localStorage.getItem('sas_admin_role') || 'admin').toLowerCase();
    const currentPath = window.location.pathname.toLowerCase();

    // Guard khusus Operator: cegah akses langsung via URL ke Manajemen User & Backup Database
    if (role === 'operator') {
        if (currentPath.includes('users.html') || currentPath.includes('database.html')) {
            if (typeof showAlertModal === 'function') {
                showAlertModal({
                    title: 'Akses Dibatasi',
                    message: 'Menu Manajemen User dan Backup Basis Data hanya dapat diakses oleh Administrator!',
                    type: 'danger'
                }).then(() => {
                    window.location.href = '/admin/index.html';
                });
            } else {
                alert('Akses Dibatasi: Menu Manajemen User dan Backup Basis Data hanya dapat diakses oleh Administrator!');
                window.location.href = '/admin/index.html';
            }
            return;
        }

        // Terapkan style langsung agar menu terlarang tidak berkedip (zero-flicker)
        const style = document.createElement('style');
        style.id = 'operatorAccessStyle';
        style.textContent = `
            .admin-sidebar a[href*="users.html"],
            .admin-sidebar a[href*="database.html"],
            li:has(a[href*="users.html"]),
            li:has(a[href*="database.html"]),
            a[href*="users.html"],
            a[href*="database.html"] {
                display: none !important;
            }
        `;
        if (document.head) {
            document.head.appendChild(style);
        } else {
            document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
        }
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
            if (db && db.settings) applySchoolIdentityToAdmin(db.settings);
        } else {
            // Fallback localStorage jika dijalankan di GitHub Pages
            const cached = localStorage.getItem('sas_offline_db');
            if (cached) {
                db = JSON.parse(cached);
                if (db && db.settings) applySchoolIdentityToAdmin(db.settings);
            }
        }
    } catch (e) {
        console.warn('Gagal memuat db dari server, mencoba fallback lokal:', e);
        const cached = localStorage.getItem('sas_offline_db');
        if (cached) {
            db = JSON.parse(cached);
            if (db && db.settings) applySchoolIdentityToAdmin(db.settings);
        }
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
            if (db && db.settings) applySchoolIdentityToAdmin(db.settings);
            return { success: true, message: json.message };
        }
        return { success: false, message: json.message || 'Gagal menyimpan ke server' };
    } catch (e) {
        // Fallback simpan lokal jika offline / GitHub Pages
        localStorage.setItem('sas_offline_db', JSON.stringify(db));
        if (db && db.settings) applySchoolIdentityToAdmin(db.settings);
        return { success: true, message: 'Tersimpan ke penyimpanan lokal (Mode Offline).' };
    }
}

// 5. Toast Notification
function showToast(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
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

// 6. Logout dengan Konfirmasi Modal Popup Modern
async function logout() {
    const schoolName = (db && db.settings && db.settings.school_name) || 'SMK';
    let confirmed = false;
    if (typeof showConfirmModal === 'function') {
        confirmed = await showConfirmModal({
            title: 'Konfirmasi Keluar',
            message: `Apakah Anda yakin ingin keluar dari Panel Administrator ${schoolName}?`,
            type: 'warning',
            confirmText: 'Ya, Keluar',
            confirmIcon: 'bi-box-arrow-right'
        });
    } else {
        confirmed = confirm(`Apakah Anda yakin ingin keluar dari Panel Administrator ${schoolName}?`);
    }

    if (confirmed) {
        localStorage.removeItem('sas_admin_auth');
        localStorage.removeItem('sas_admin_user');
        localStorage.removeItem('sas_admin_name');
        localStorage.removeItem('sas_admin_role');
        window.location.href = '/admin/login.html';
    }
}

// 7. Penerapan Hak Akses & Inisialisasi Header Identitas
function applyRoleAccessControl() {
    const role = (localStorage.getItem('sas_admin_role') || 'admin').toLowerCase();
    if (role === 'operator') {
        // Sembunyikan navigasi sidebar untuk Manajemen User & Backup Database
        document.querySelectorAll('.admin-sidebar a, .admin-nav a, .admin-nav-item').forEach(link => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            if (href.includes('users.html') || href.includes('database.html')) {
                const li = link.closest('li');
                if (li) li.style.display = 'none';
                else link.style.display = 'none';
            }
        });

        // Sembunyikan tombol & kartu di dashboard
        document.querySelectorAll('a[href*="users.html"], a[href*="database.html"]').forEach(el => {
            el.style.display = 'none';
        });
    }
}

// Sinkronisasi Identitas Sekolah di Seluruh Panel Administrator
function applySchoolIdentityToAdmin(settings) {
    if (!settings) return;
    const schoolName = settings.school_name || 'SMK NEGERI 1 FYJ CHANNEL';
    const schoolTagline = settings.school_tagline || 'Generator Administrasi Ujian';
    const schoolLogo = settings.school_logo || '/assets/img/logo.png';

    // 1. Update Title Browser
    if (document.title) {
        if (document.title.includes(' - ')) {
            document.title = document.title.split(' - ')[0] + ' - ' + schoolName;
        } else if (document.title.includes('SMK NEGERI')) {
            document.title = document.title.replace(/SMK NEGERI [^|\-]+/gi, schoolName);
        }
    }

    // 2. Update Brand Navbar Admin & Topbar School Name
    document.querySelectorAll('.brand-title, .topbar-school-name, #topbarSchoolName').forEach(el => {
        el.textContent = schoolName;
    });

    document.querySelectorAll('.brand-subtitle').forEach(el => {
        el.textContent = schoolTagline;
    });

    // 3. Update Logo Navbar Admin
    if (schoolLogo) {
        document.querySelectorAll('.navbar-logo, #topNavbarLogo, .topbar-school-logo').forEach(img => {
            img.src = schoolLogo + (schoolLogo.startsWith('data:') ? '' : '?t=' + Date.now());
        });
    }

    // 4. Update Footer Sidebar
    document.querySelectorAll('.admin-sidebar > div:last-child').forEach(el => {
        el.innerHTML = `Sistem SAS v2.5<br>${schoolName}`;
    });

    // 5. Update teks info login jika ada
    const loginSchoolEl = document.getElementById('loginSchoolName');
    if (loginSchoolEl) {
        loginSchoolEl.textContent = schoolName;
    }

    window.SCHOOL_NAME = schoolName;
}

// 8. Toggle Bilah Sisi (Sidebar Collapsed / Expanded)
function toggleAdminSidebar() {
    const layout = document.querySelector('.admin-layout');
    if (layout) {
        layout.classList.toggle('sidebar-collapsed');
        const isCollapsed = layout.classList.contains('sidebar-collapsed');
        localStorage.setItem('sas_sidebar_collapsed', isCollapsed ? '1' : '0');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Restore sidebar collapsed preference
    if (localStorage.getItem('sas_sidebar_collapsed') === '1') {
        document.querySelector('.admin-layout')?.classList.add('sidebar-collapsed');
    }

    try {
        const cached = localStorage.getItem('sas_offline_db');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.settings) applySchoolIdentityToAdmin(parsed.settings);
        }
    } catch(e) {}

    applyRoleAccessControl();

    const role = (localStorage.getItem('sas_admin_role') || 'admin').toLowerCase();
    const roleText = (role === 'admin' || role === 'superadmin') ? 'Super Admin' : 'Operator';

    const adminUserEl = document.getElementById('adminUsername');
    if (adminUserEl) {
        const name = localStorage.getItem('sas_admin_name') || localStorage.getItem('sas_admin_user') || 'Administrator';
        adminUserEl.textContent = `${name} (${roleText})`;
    }

    const topbarRoleEl = document.getElementById('topbarRoleBadge');
    if (topbarRoleEl) {
        topbarRoleEl.textContent = roleText;
    }

    // Set active link sidebar sesuai pathname & update breadcrumb
    const currentPath = window.location.pathname.toLowerCase();
    let pageLabel = 'Dashboard';
    if (currentPath.includes('siswa.html')) pageLabel = 'Data Siswa & Master Kelas';
    else if (currentPath.includes('guru.html')) pageLabel = 'Data Guru & Pengawas';
    else if (currentPath.includes('template.html')) pageLabel = 'Template Ujian';
    else if (currentPath.includes('arsip.html')) pageLabel = 'Arsip Dokumen Ujian';
    else if (currentPath.includes('pengaturan.html')) pageLabel = 'Pengaturan Sekolah & Kop';
    else if (currentPath.includes('users.html')) pageLabel = 'Manajemen User';
    else if (currentPath.includes('database.html')) pageLabel = 'Backup & Database SQL';

    const breadcrumbEl = document.getElementById('currentPageBreadcrumb');
    if (breadcrumbEl) {
        breadcrumbEl.textContent = pageLabel;
    }

    document.querySelectorAll('.admin-nav-item').forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (href && (currentPath.endsWith(href) || (href.endsWith('index.html') && (currentPath.endsWith('/admin/') || currentPath.endsWith('/admin'))))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

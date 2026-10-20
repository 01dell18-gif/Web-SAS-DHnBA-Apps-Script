/**
 * App JavaScript Helper
 * Generator Absensi dan Berita Acara Ujian - SMK Negeri 1 Klungkung
 */

// Global Mobile Nav Toggle (Dipanggil langsung dari onclick atau event listener)
window.toggleMobileNav = function(e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('show');
    }
    return false;
};

// Global Admin Menu Toggle
window.toggleAdminMenu = function(e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const adminSidebar = document.querySelector('.admin-sidebar');
    if (adminSidebar) {
        adminSidebar.classList.toggle('show');
    }
    return false;
};

document.addEventListener('DOMContentLoaded', function() {
    // 1. Auto-dismiss alert messages after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });

    // 2. Tutup menu publik saat mengklik di luar area menu
    document.addEventListener('click', function(e) {
        const navLinks = document.getElementById('navLinks');
        const btnToggleNav = document.getElementById('btnToggleNav');
        if (navLinks && navLinks.classList.contains('show')) {
            if (!navLinks.contains(e.target) && (!btnToggleNav || !btnToggleNav.contains(e.target))) {
                navLinks.classList.remove('show');
            }
        }

        const adminSidebar = document.querySelector('.admin-sidebar');
        const btnToggleAdmin = document.getElementById('btnToggleAdminMenu');
        if (adminSidebar && adminSidebar.classList.contains('show')) {
            if (!adminSidebar.contains(e.target) && (!btnToggleAdmin || !btnToggleAdmin.contains(e.target))) {
                adminSidebar.classList.remove('show');
            }
        }
    });

    // Fallback jika tombol tidak memiliki inline onclick
    const btnToggleNav = document.getElementById('btnToggleNav');
    if (btnToggleNav && !btnToggleNav.getAttribute('onclick')) {
        btnToggleNav.addEventListener('click', function(e) {
            window.toggleMobileNav(e);
        });
    }

    const btnToggleAdmin = document.getElementById('btnToggleAdminMenu');
    if (btnToggleAdmin && !btnToggleAdmin.getAttribute('onclick')) {
        btnToggleAdmin.addEventListener('click', function(e) {
            window.toggleAdminMenu(e);
        });
    }

    // 3. Sinkronkan nama sekolah, tagline & logo dari basis data secara dinamis
    syncSchoolIdentity();
});

// Global Sinkronisasi Identitas Sekolah & Logo ke Seluruh Elemen Publik
async function syncSchoolIdentity() {
    let settings = null;
    let dbData = null;

    try {
        const res = await fetch('/data/db.json?t=' + Date.now());
        if (res.ok) {
            dbData = await res.json();
            if (dbData && dbData.settings) {
                settings = dbData.settings;
            }
        }
    } catch (e) {
        try {
            const cached = localStorage.getItem('sas_offline_db');
            if (cached) {
                dbData = JSON.parse(cached);
                if (dbData && dbData.settings) settings = dbData.settings;
            }
        } catch(err) {}
    }

    if (!settings) return;

    const schoolName = settings.school_name || 'SMK NEGERI 1 KLUNGKUNG';
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

    // 2. Update Brand Navbar
    document.querySelectorAll('.brand-title').forEach(el => {
        el.textContent = schoolName;
    });

    document.querySelectorAll('.brand-subtitle').forEach(el => {
        el.textContent = schoolTagline;
    });

    // 3. Update Hero Title (Beranda Publik)
    const homeTitle = document.querySelector('.home-title');
    if (homeTitle) {
        homeTitle.textContent = schoolName;
    }

    // 4. Update Footer Copyright & Teks Nama Sekolah
    document.querySelectorAll('.school-name-text, footer strong').forEach(el => {
        el.textContent = schoolName;
    });

    // 5. Update Logo
    if (schoolLogo) {
        document.querySelectorAll('.navbar-logo, .home-hero-logo').forEach(img => {
            img.src = schoolLogo + (schoolLogo.startsWith('data:') ? '' : '?t=' + Date.now());
        });
    }

    // 6. Update Hero Stat Badges (Kelas & Siswa) jika ada di halaman
    if (dbData) {
        const classCount = Array.isArray(dbData.classes) ? dbData.classes.length : 0;
        const studentCount = Array.isArray(dbData.students) ? dbData.students.length : 0;
        
        document.querySelectorAll('.stat-badge').forEach(badge => {
            if (badge.innerHTML.includes('Master Kelas')) {
                badge.innerHTML = `<i class="bi bi-database-check"></i> ${classCount} Master Kelas`;
            } else if (badge.innerHTML.includes('Siswa Aktif')) {
                badge.innerHTML = `<i class="bi bi-people-fill"></i> ${studentCount} Siswa Aktif`;
            }
        });
    }

    window.SCHOOL_NAME = schoolName;
    window.SCHOOL_TAGLINE = schoolTagline;
    window.SCHOOL_LOGO = schoolLogo;
}

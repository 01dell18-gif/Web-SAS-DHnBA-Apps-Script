/**
 * GitHub Pages & Offline Compatibility Layer
 * Sistem Generator SAS SMK Negeri 1 Klungkung
 * 
 * Memungkinkan seluruh fitur aplikasi (formulir, live preview, filter arsip,
 * cetak/unduh PDF, dan panel admin) berjalan 100% fungsional di GitHub Pages
 * yang merupakan hosting statis murni tanpa server Node.js.
 */

(function () {
    const isGitHub = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';
    
    // Inisialisasi offline DB cache
    let cachedDb = null;

    async function getFallbackDb() {
        if (cachedDb) return cachedDb;
        const local = localStorage.getItem('sas_offline_db');
        if (local) {
            try {
                cachedDb = JSON.parse(local);
                return cachedDb;
            } catch(e) {}
        }
        try {
            // Coba ambil dari data/db.json relatif
            const basePath = getBasePath();
            const res = await originalFetch(basePath + 'data/db.json');
            cachedDb = await res.json();
            localStorage.setItem('sas_offline_db', JSON.stringify(cachedDb));
            return cachedDb;
        } catch(e) {
            console.warn('Gagal memuat db.json:', e);
            return { classes: [], students: [], teachers: [], templates: [], settings: {}, archives: [], users: [] };
        }
    }

    function getBasePath() {
        if (!isGitHub) return '/';
        const segments = window.location.pathname.split('/').filter(Boolean);
        if (segments.length > 0 && !segments[0].includes('.html')) {
            return '/' + segments[0] + '/';
        }
        return '/';
    }

    // Intercept fetch untuk endpoint /api/* pada GitHub Pages / mode statis
    const originalFetch = window.fetch;

    window.fetch = async function (resource, options = {}) {
        let url = typeof resource === 'string' ? resource : (resource ? resource.url : '');

        // Jika bukan request API, jalankan fetch normal (dengan penyesuaian base path jika di github.io)
        if (!url.includes('/api/')) {
            if (isGitHub && url.startsWith('/') && !url.startsWith(getBasePath())) {
                url = getBasePath() + url.replace(/^\/+/, '');
            }
            return originalFetch(url, options);
        }

        // Jika online di localhost/server kustom, coba panggil server asli dulu
        if (!isGitHub) {
            try {
                const res = await originalFetch(resource, options);
                if (res.ok || res.status < 500) return res;
            } catch (err) {
                console.warn('Server lokal offline, beralih ke engine klien:', url);
            }
        }

        // Mode Statis / GitHub Pages Mock API Engine
        const parsedUrl = new URL(url, window.location.origin);
        const pathname = parsedUrl.pathname.replace(getBasePath(), '/').replace(/^\/+/, '/');
        const query = Object.fromEntries(parsedUrl.searchParams.entries());
        const method = (options.method || 'GET').toUpperCase();

        const db = await getFallbackDb();

        // 1. GET /api/classes
        if (pathname.includes('/api/classes')) {
            return new Response(JSON.stringify(db.classes || []), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. GET /api/teachers
        if (pathname.includes('/api/teachers')) {
            return new Response(JSON.stringify(db.teachers || []), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. GET /api/get-students.php?class_id=X
        if (pathname.includes('/api/get-students')) {
            const classId = query.class_id;
            const students = (db.students || []).filter(s => String(s.class_id) === String(classId));
            const cls = (db.classes || []).find(c => String(c.id) === String(classId));
            return new Response(JSON.stringify({
                success: true,
                class: cls,
                students: students,
                count: students.length
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 4. GET /api/templates
        if (pathname.includes('/api/templates')) {
            return new Response(JSON.stringify(db.templates || []), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 5. GET /api/settings
        if (pathname.includes('/api/settings')) {
            return new Response(JSON.stringify(db.settings || {}), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 6. GET /api/subjects
        if (pathname.includes('/api/subjects')) {
            const subjects = (db.settings && db.settings.subjects) || [];
            return new Response(JSON.stringify(subjects), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 7. GET /api/academic-years
        if (pathname.includes('/api/academic-years')) {
            const years = (db.settings && db.settings.academic_years) || [];
            return new Response(JSON.stringify(years), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 8. GET /api/archives
        if (pathname.includes('/api/archives')) {
            const localArch = localStorage.getItem('sas_archives');
            const archives = localArch ? JSON.parse(localArch) : (db.archives || []);
            return new Response(JSON.stringify(archives), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 9. POST /api/save-archive
        if (pathname.includes('/api/save-archive') && method === 'POST') {
            const payload = JSON.parse(options.body || '{}');
            const localArch = localStorage.getItem('sas_archives');
            const archives = localArch ? JSON.parse(localArch) : (db.archives || []);
            const newDoc = {
                id: Date.now(),
                type: payload.type || 'daftar_hadir',
                title: payload.title || 'Dokumen Ujian',
                filename: payload.filename || 'Dokumen.pdf',
                nama_ujian: payload.nama_ujian || '',
                tahun_ajaran: payload.tahun_ajaran || '',
                semester: payload.semester || '',
                tanggal_ujian: payload.tanggal_ujian || '',
                mata_pelajaran: payload.mata_pelajaran || '',
                nama_kelas: payload.nama_kelas || '',
                class_id: payload.class_id || '',
                ruang: payload.ruang || '',
                peserta_seharusnya: parseInt(payload.peserta_seharusnya, 10) || 0,
                peserta_hadir: parseInt(payload.peserta_hadir, 10) || 0,
                peserta_tidak_hadir: parseInt(payload.peserta_tidak_hadir, 10) || 0,
                nama_pengawas_1: payload.nama_pengawas_1 || '',
                nip_pengawas_1: payload.nip_pengawas_1 || '',
                nama_pengawas_2: payload.nama_pengawas_2 || '',
                nip_pengawas_2: payload.nip_pengawas_2 || '',
                html_content: payload.html_content || '',
                created_at: new Date().toISOString()
            };
            archives.unshift(newDoc);
            localStorage.setItem('sas_archives', JSON.stringify(archives));
            return new Response(JSON.stringify({ success: true, id: newDoc.id, message: 'Arsip tersimpan (Lokal GitHub Pages)' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 10. POST /api/delete-archive
        if (pathname.includes('/api/delete-archive') && method === 'POST') {
            const payload = JSON.parse(options.body || '{}');
            const localArch = localStorage.getItem('sas_archives');
            let archives = localArch ? JSON.parse(localArch) : (db.archives || []);
            archives = archives.filter(a => Number(a.id) !== Number(payload.id));
            localStorage.setItem('sas_archives', JSON.stringify(archives));
            return new Response(JSON.stringify({ success: true, message: 'Arsip berhasil dihapus.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 11. GET /api/find-attendance-rekap
        if (pathname.includes('/api/find-attendance-rekap')) {
            const localArch = localStorage.getItem('sas_archives');
            const archives = localArch ? JSON.parse(localArch) : (db.archives || []);
            const dhList = archives.filter(a => a.type === 'daftar_hadir');
            const tgl = query.tanggal;
            const mapel = query.mapel ? query.mapel.toLowerCase() : '';
            const classId = query.class_id;

            const match = dhList.find(a => 
                a.tanggal_ujian === tgl && 
                a.mata_pelajaran && a.mata_pelajaran.toLowerCase().includes(mapel) &&
                (!classId || String(a.class_id) === String(classId))
            );

            if (match) {
                return new Response(JSON.stringify({ success: true, found: true, rekap: match }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            return new Response(JSON.stringify({ success: true, found: false }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 12. GET /api/users
        if (pathname.includes('/api/users')) {
            const localUsers = localStorage.getItem('sas_users');
            const users = localUsers ? JSON.parse(localUsers) : (db.users || [
                { id: 1, username: 'admin', password: 'password', nama: 'Administrator SMK N 1 Klungkung', role: 'admin' }
            ]);
            return new Response(JSON.stringify(users), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 13. POST /api/save-user
        if (pathname.includes('/api/save-user') && method === 'POST') {
            const payload = JSON.parse(options.body || '{}');
            const localUsers = localStorage.getItem('sas_users');
            let users = localUsers ? JSON.parse(localUsers) : (db.users || []);
            if (payload.id) {
                const u = users.find(x => Number(x.id) === Number(payload.id));
                if (u) {
                    u.username = payload.username;
                    u.nama = payload.nama;
                    u.role = payload.role;
                    if (payload.password) u.password = payload.password;
                }
            } else {
                users.push({
                    id: Date.now(),
                    username: payload.username,
                    nama: payload.nama,
                    role: payload.role,
                    password: payload.password,
                    created_at: new Date().toISOString()
                });
            }
            localStorage.setItem('sas_users', JSON.stringify(users));
            return new Response(JSON.stringify({ success: true, message: 'Pengguna disimpan (Lokal GitHub Pages)' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 14. POST /api/delete-user
        if (pathname.includes('/api/delete-user') && method === 'POST') {
            const payload = JSON.parse(options.body || '{}');
            const localUsers = localStorage.getItem('sas_users');
            let users = localUsers ? JSON.parse(localUsers) : (db.users || []);
            users = users.filter(u => Number(u.id) !== Number(payload.id));
            localStorage.setItem('sas_users', JSON.stringify(users));
            return new Response(JSON.stringify({ success: true, message: 'Pengguna dihapus.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 14b. POST /api/upload-logo
        if (pathname.includes('/api/upload-logo') && method === 'POST') {
            const payload = JSON.parse(options.body || '{}');
            if (!db.settings) db.settings = {};
            db.settings.school_logo = payload.image;
            localStorage.setItem('sas_offline_db', JSON.stringify(db));
            return new Response(JSON.stringify({ success: true, message: 'Logo sekolah disimpan (Mode Statis)', url: payload.image }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 14c. POST /api/reset-logo
        if (pathname.includes('/api/reset-logo') && method === 'POST') {
            if (!db.settings) db.settings = {};
            db.settings.school_logo = '/assets/img/logo.png';
            localStorage.setItem('sas_offline_db', JSON.stringify(db));
            return new Response(JSON.stringify({ success: true, message: 'Logo sekolah direset ke default', url: '/assets/img/logo.png' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 15. POST /api/save-db
        if (pathname.includes('/api/save-db') && method === 'POST') {
            const payload = JSON.parse(options.body || '{}');
            if (payload.delete_all_students === true) {
                db.students = [];
                if (payload.reset_classes === true) db.classes = [];
            }
            if (payload.delete_all_teachers === true) db.teachers = [];
            Object.assign(db, payload);
            localStorage.setItem('sas_offline_db', JSON.stringify(db));
            return new Response(JSON.stringify({ success: true, message: 'Basis data disimpan ke penyimpanan lokal.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fallback generic
        return new Response(JSON.stringify({ success: true, message: 'OK' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    };
})();

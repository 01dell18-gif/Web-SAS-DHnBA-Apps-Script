/**
 * GitHub Pages & Offline Compatibility Layer
 * Sistem Generator SAS SMK NEGERI FYJ CHANNEL
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
                siswa_tidak_hadir: payload.siswa_tidak_hadir || '',
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

        // 10. POST /api/delete-archive (Hapus Arsip Dokumen & Berkas Terkait)
        if (pathname.includes('/api/delete-archive') && method === 'POST') {
            const payload = JSON.parse(options.body || '{}');
            const localArch = localStorage.getItem('sas_archives');
            let archives = localArch ? JSON.parse(localArch) : (db.archives || []);
            const id = payload.id;
            const target = archives.find(a => String(a.id) === String(id));
            const deletedIds = [];

            if (target) {
                const targetClassId = target.class_id ? String(target.class_id) : '';
                const targetClassName = (target.nama_kelas || '').trim().toLowerCase();
                const targetMapel = (target.mata_pelajaran || '').trim().toLowerCase();
                const targetDate = (target.tanggal_ujian || '').trim();

                archives = archives.filter(a => {
                    const isSameId = String(a.id) === String(id);
                    if (isSameId) {
                        deletedIds.push(a.id);
                        return false;
                    }

                    const aClassId = a.class_id ? String(a.class_id) : '';
                    const aClassName = (a.nama_kelas || '').trim().toLowerCase();
                    const aMapel = (a.mata_pelajaran || '').trim().toLowerCase();
                    const aDate = (a.tanggal_ujian || '').trim();

                    const isSameDate = Boolean(targetDate && aDate && targetDate === aDate);
                    const isSameMapel = Boolean(targetMapel && aMapel && (targetMapel === aMapel || aMapel.includes(targetMapel) || targetMapel.includes(aMapel)));
                    const isSameClass = Boolean((targetClassId && aClassId && targetClassId === aClassId) ||
                                        (targetClassName && aClassName && (targetClassName === aClassName || aClassName.includes(targetClassName) || targetClassName.includes(aClassName))));

                    if (isSameDate && isSameMapel && isSameClass) {
                        deletedIds.push(a.id);
                        return false;
                    }

                    return true;
                });
            } else {
                archives = archives.filter(a => {
                    if (String(a.id) === String(id)) {
                        deletedIds.push(a.id);
                        return false;
                    }
                    return true;
                });
            }

            localStorage.setItem('sas_archives', JSON.stringify(archives));
            return new Response(JSON.stringify({ 
                success: true, 
                message: deletedIds.length > 1
                    ? `Dokumen dan ${deletedIds.length - 1} berkas terkait (Daftar Hadir & Berita Acara) berhasil dihapus.`
                    : 'Arsip berhasil dihapus.',
                deleted_ids: deletedIds,
                deleted_count: deletedIds.length
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 11. GET /api/find-attendance-rekap & /api/get-attendance-rekap
        if (pathname.includes('/api/find-attendance-rekap') || pathname.includes('/api/get-attendance-rekap')) {
            const localArch = localStorage.getItem('sas_archives');
            const archives = localArch ? JSON.parse(localArch) : (db.archives || []);
            const dhList = archives.filter(a => a.type === 'daftar_hadir');
            const tgl = query.tanggal_ujian || query.tanggal;
            const mapel = (query.mata_pelajaran || query.mapel || '').toLowerCase();
            const classId = query.class_id;
            const className = (query.kelas || '').toLowerCase();

            const match = dhList.find(a => {
                const mClass = (!classId && !className) ||
                               (classId && String(a.class_id) === String(classId)) || 
                               (className && a.nama_kelas && a.nama_kelas.toLowerCase().includes(className));
                const mDate = !tgl || a.tanggal_ujian === tgl;
                const mMapel = !mapel || (a.mata_pelajaran && a.mata_pelajaran.toLowerCase().includes(mapel));
                return mClass && (mDate || mMapel);
            });

            if (match) {
                let absentDetail = match.siswa_tidak_hadir || '';
                if (!absentDetail && match.html_content) {
                    const names = [];
                    const rowRegex = /<td[^>]*style="padding-left:\s*8px;"[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*id="pvStatus_[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;
                    let rMatch;
                    while ((rMatch = rowRegex.exec(match.html_content)) !== null) {
                        const name = rMatch[1].replace(/<[^>]+>/g, '').trim();
                        const status = rMatch[2].replace(/<[^>]+>/g, '').trim();
                        if (status && status !== 'Hadir') {
                            let code = 'a';
                            const sLower = status.toLowerCase();
                            if (sLower === 'sakit' || sLower === 's') code = 's';
                            else if (sLower === 'izin' || sLower === 'i') code = 'i';
                            else if (sLower === 'dispensasi' || sLower === 'd') code = 'd';
                            else code = 'a';
                            names.push(`${name} (${code})`);
                        }
                    }
                    if (names.length) absentDetail = names.join(', ');
                }
                const rekapObj = { ...match, siswa_tidak_hadir: absentDetail };
                return new Response(JSON.stringify({ success: true, found: true, rekap: rekapObj }), {
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
                { id: 1, username: 'admin', password: 'password', nama: 'Administrator SMK NEGERI FYJ CHANNEL', role: 'admin' }
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

        // 14d. POST /api/delete-class-students
        if (pathname.includes('/api/delete-class-students') && method === 'POST') {
            const payload = JSON.parse(options.body || '{}');
            const classId = payload.class_id;
            const isDeleteClass = payload.delete_class === true;

            if (classId) {
                db.students = (db.students || []).filter(s => String(s.class_id) !== String(classId));
                if (isDeleteClass) {
                    db.classes = (db.classes || []).filter(c => String(c.id) !== String(classId));
                }
                localStorage.setItem('sas_offline_db', JSON.stringify(db));
            }
            return new Response(JSON.stringify({ success: true, message: 'Data siswa kelas berhasil dihapus.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 14e. POST /api/set-active-template
        if (pathname.includes('/api/set-active-template') && method === 'POST') {
            const payload = JSON.parse(options.body || '{}');
            const targetId = Number(payload.id);
            if (!Array.isArray(db.templates)) db.templates = [];
            let activatedName = '';
            db.templates.forEach(t => {
                if (Number(t.id) === targetId) {
                    t.aktif = 1;
                    activatedName = t.nama_ujian;
                } else {
                    t.aktif = 0;
                }
            });
            if (!db.settings) db.settings = {};
            db.settings.active_template_id = targetId;
            localStorage.setItem('sas_offline_db', JSON.stringify(db));
            return new Response(JSON.stringify({
                success: true,
                message: `Template "${activatedName}" berhasil diaktifkan untuk menu Daftar Hadir & Berita Acara!`,
                active_id: targetId,
                templates: db.templates
            }), {
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

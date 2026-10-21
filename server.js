/**
 * Server Aplikasi Generator Absensi & Berita Acara Ujian
 * SMK NEGERI FYJ CHANNEL
 * 
 * Standalone Node.js HTTP Server (Zero Dependencies Required)
 * Mendukung URL PHP original (/absensi.php, /berita-acara.php, /api/get-students.php)
 * Serta REST API untuk Admin Panel: Export/Import Excel, Bulk Delete, Template & Kop Upload.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');

const PORT = process.env.PORT || 3003;
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const KOP_IMG_PATH = path.join(__dirname, 'public', 'assets', 'img', 'kop-header.png');
const KOP_DEFAULT_PATH = path.join(__dirname, 'public', 'assets', 'img', 'kop-header-default.png');
const LOGO_IMG_PATH = path.join(__dirname, 'public', 'assets', 'img', 'logo.png');
const LOGO_DEFAULT_PATH = path.join(__dirname, 'public', 'assets', 'img', 'logo-default.png');

// Helper baca database JSON
function getDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const content = fs.readFileSync(DB_FILE, 'utf-8');
            const data = JSON.parse(content);
            if (!Array.isArray(data.users) || data.users.length === 0) {
                data.users = [
                    {
                        id: 1,
                        username: "admin",
                        password: "admin123",
                        nama: "Administrator SMK NEGERI FYJ CHANNEL",
                        role: "admin",
                        created_at: "2025-01-01T00:00:00.000Z"
                    }
                ];
            }
            return data;
        }
    } catch (e) {
        console.error('Error reading db:', e);
    }
    return {
        classes: [],
        students: [],
        templates: [],
        settings: {},
        users: [
            {
                id: 1,
                username: "admin",
                password: "admin123",
                nama: "Administrator SMK NEGERI FYJ CHANNEL",
                role: "admin",
                created_at: "2025-01-01T00:00:00.000Z"
            }
        ]
    };
}

// Helper simpan database JSON & Sinkronisasi SQL Dump
function saveDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        syncSqlFile(data);
        return true;
    } catch (e) {
        console.error('Error writing db:', e);
        return false;
    }
}

// Sinkronisasi otomatis ke file database.sql agar selalu terupdate
function syncSqlFile(data) {
    try {
        const sqlPath = path.join(__dirname, 'database.sql');
        const lines = [];

        function esc(val) {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 1 : 0;
            return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n') + "'";
        }

        lines.push('-- ========================================================');
        lines.push('-- DATABASE SCHEMA & MASTER DATA: SISTEM ADMINISTRASI UJIAN');
        lines.push('-- SMK NEGERI FYJ CHANNEL');
        lines.push('-- Auto-synchronized: ' + new Date().toISOString());
        lines.push('-- ========================================================\n');
        lines.push('SET FOREIGN_KEY_CHECKS = 0;');
        lines.push('DROP TABLE IF EXISTS `students`;');
        lines.push('DROP TABLE IF EXISTS `teachers`;');
        lines.push('DROP TABLE IF EXISTS `classes`;');
        lines.push('DROP TABLE IF EXISTS `exam_templates`;');
        lines.push('DROP TABLE IF EXISTS `settings`;');
        lines.push('DROP TABLE IF EXISTS `users`;');
        lines.push('DROP TABLE IF EXISTS `exam_archives`;\n');

        // Classes Table
        lines.push('CREATE TABLE `classes` (');
        lines.push('  `id` INT AUTO_INCREMENT PRIMARY KEY,');
        lines.push('  `nama_kelas` VARCHAR(100) NOT NULL,');
        lines.push('  `tingkat` VARCHAR(20) DEFAULT \'XII\',');
        lines.push('  `program_keahlian` VARCHAR(255) DEFAULT \'\',');
        lines.push('  `is_active` TINYINT(1) DEFAULT 1,');
        lines.push('  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n');

        // Students Table
        lines.push('CREATE TABLE `students` (');
        lines.push('  `id` INT AUTO_INCREMENT PRIMARY KEY,');
        lines.push('  `class_id` INT NOT NULL,');
        lines.push('  `nis` VARCHAR(50) DEFAULT NULL,');
        lines.push('  `nisn` VARCHAR(50) DEFAULT NULL,');
        lines.push('  `nama` VARCHAR(255) NOT NULL,');
        lines.push('  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,');
        lines.push('  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE');
        lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n');

        // Teachers Table
        lines.push('CREATE TABLE `teachers` (');
        lines.push('  `id` INT AUTO_INCREMENT PRIMARY KEY,');
        lines.push('  `nama` VARCHAR(255) NOT NULL,');
        lines.push('  `nip` VARCHAR(50) DEFAULT NULL,');
        lines.push('  `mata_pelajaran` VARCHAR(255) DEFAULT \'\',');
        lines.push('  `jabatan` VARCHAR(100) DEFAULT \'Guru / Pengawas\',');
        lines.push('  `is_active` TINYINT(1) DEFAULT 1,');
        lines.push('  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n');

        // Exam Templates Table
        lines.push('CREATE TABLE `exam_templates` (');
        lines.push('  `id` INT AUTO_INCREMENT PRIMARY KEY,');
        lines.push('  `nama_ujian` VARCHAR(255) NOT NULL,');
        lines.push('  `tahun_ajaran` VARCHAR(50) NOT NULL,');
        lines.push('  `semester` ENUM(\'Ganjil\', \'Genap\') DEFAULT \'Ganjil\',');
        lines.push('  `judul_berita_acara` TEXT,');
        lines.push('  `redaksi_isi` LONGTEXT,');
        lines.push('  `aktif` TINYINT(1) DEFAULT 1,');
        lines.push('  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,');
        lines.push('  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n');

        // Settings Table
        lines.push('CREATE TABLE `settings` (');
        lines.push('  `key` VARCHAR(100) PRIMARY KEY,');
        lines.push('  `value` LONGTEXT NOT NULL');
        lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n');

        // Users Table
        lines.push('CREATE TABLE `users` (');
        lines.push('  `id` INT AUTO_INCREMENT PRIMARY KEY,');
        lines.push('  `username` VARCHAR(100) NOT NULL UNIQUE,');
        lines.push('  `password` VARCHAR(255) NOT NULL,');
        lines.push('  `nama` VARCHAR(255) NOT NULL,');
        lines.push('  `role` VARCHAR(50) DEFAULT \'admin\',');
        lines.push('  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n');

        // Exam Archives Table
        lines.push('CREATE TABLE `exam_archives` (');
        lines.push('  `id` BIGINT NOT NULL PRIMARY KEY,');
        lines.push('  `type` ENUM(\'daftar_hadir\', \'berita_acara\') NOT NULL,');
        lines.push('  `title` VARCHAR(255) NOT NULL,');
        lines.push('  `filename` VARCHAR(255) NOT NULL,');
        lines.push('  `nama_ujian` VARCHAR(150) NULL,');
        lines.push('  `tahun_ajaran` VARCHAR(20) NULL,');
        lines.push('  `semester` VARCHAR(20) NULL,');
        lines.push('  `tanggal_ujian` DATE NULL,');
        lines.push('  `mata_pelajaran` VARCHAR(150) NULL,');
        lines.push('  `nama_kelas` VARCHAR(100) NULL,');
        lines.push('  `class_id` INT NULL,');
        lines.push('  `ruang` VARCHAR(50) NULL,');
        lines.push('  `peserta_seharusnya` INT DEFAULT 0,');
        lines.push('  `peserta_hadir` INT DEFAULT 0,');
        lines.push('  `peserta_tidak_hadir` INT DEFAULT 0,');
        lines.push('  `siswa_tidak_hadir` VARCHAR(255) NULL,');
        lines.push('  `nama_pengawas_1` VARCHAR(150) NULL,');
        lines.push('  `nip_pengawas_1` VARCHAR(50) NULL,');
        lines.push('  `nama_pengawas_2` VARCHAR(150) NULL,');
        lines.push('  `nip_pengawas_2` VARCHAR(50) NULL,');
        lines.push('  `html_content` LONGTEXT NULL,');
        lines.push('  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n');

        // Insert Classes
        if (Array.isArray(data.classes)) {
            data.classes.forEach(c => {
                lines.push(`INSERT INTO \`classes\` (\`id\`, \`nama_kelas\`, \`tingkat\`, \`program_keahlian\`, \`is_active\`) VALUES (${c.id}, ${esc(c.nama_kelas)}, ${esc(c.tingkat || 'XII')}, ${esc(c.program_keahlian || '')}, ${c.is_active ? 1 : 0});`);
            });
            lines.push('');
        }

        // Insert Students
        if (Array.isArray(data.students)) {
            data.students.forEach(s => {
                lines.push(`INSERT INTO \`students\` (\`id\`, \`class_id\`, \`nis\`, \`nama\`) VALUES (${s.id}, ${s.class_id}, ${esc(s.nis || '')}, ${esc(s.nama)});`);
            });
            lines.push('');
        }

        // Insert Teachers
        if (Array.isArray(data.teachers)) {
            data.teachers.forEach(t => {
                lines.push(`INSERT INTO \`teachers\` (\`id\`, \`nama\`, \`nip\`, \`mata_pelajaran\`, \`jabatan\`, \`is_active\`) VALUES (${t.id}, ${esc(t.nama)}, ${esc(t.nip || '')}, ${esc(t.mapel || t.mata_pelajaran || '')}, ${esc(t.jabatan || 'Guru / Pengawas')}, 1);`);
            });
            lines.push('');
        }

        // Insert Templates
        if (Array.isArray(data.templates)) {
            data.templates.forEach(t => {
                lines.push(`INSERT INTO \`exam_templates\` (\`id\`, \`nama_ujian\`, \`tahun_ajaran\`, \`semester\`, \`judul_berita_acara\`, \`redaksi_isi\`, \`aktif\`) VALUES (${t.id}, ${esc(t.nama_ujian)}, ${esc(t.tahun_ajaran)}, ${esc(t.semester || 'Ganjil')}, ${esc(t.judul_berita_acara)}, ${esc(t.redaksi_isi)}, 1);`);
            });
            lines.push('');
        }

        // Insert Settings
        if (data.settings && typeof data.settings === 'object') {
            for (const [k, v] of Object.entries(data.settings)) {
                const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
                lines.push(`INSERT INTO \`settings\` (\`key\`, \`value\`) VALUES (${esc(k)}, ${esc(valStr)});`);
            }
            lines.push('');
        }

        // Insert Users
        if (Array.isArray(data.users)) {
            data.users.forEach(u => {
                lines.push(`INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`nama\`, \`role\`) VALUES (${u.id}, ${esc(u.username)}, ${esc(u.password)}, ${esc(u.nama || u.username)}, ${esc(u.role || 'admin')});`);
            });
            lines.push('');
        }

        // Insert Archives (capped at 100 recent archives to prevent huge SQL dumps)
        if (Array.isArray(data.archives)) {
            data.archives.slice(0, 100).forEach(a => {
                lines.push(`INSERT INTO \`exam_archives\` (\`id\`, \`type\`, \`title\`, \`filename\`, \`nama_ujian\`, \`tahun_ajaran\`, \`semester\`, \`tanggal_ujian\`, \`mata_pelajaran\`, \`nama_kelas\`, \`class_id\`, \`ruang\`, \`peserta_seharusnya\`, \`peserta_hadir\`, \`peserta_tidak_hadir\`, \`siswa_tidak_hadir\`, \`nama_pengawas_1\`, \`nip_pengawas_1\`, \`nama_pengawas_2\`, \`nip_pengawas_2\`, \`html_content\`) VALUES (${a.id}, ${esc(a.type)}, ${esc(a.title)}, ${esc(a.filename)}, ${esc(a.nama_ujian)}, ${esc(a.tahun_ajaran)}, ${esc(a.semester)}, ${esc(a.tanggal_ujian)}, ${esc(a.mata_pelajaran)}, ${esc(a.nama_kelas)}, ${a.class_id ? Number(a.class_id) : 'NULL'}, ${esc(a.ruang)}, ${Number(a.peserta_seharusnya) || 0}, ${Number(a.peserta_hadir) || 0}, ${Number(a.peserta_tidak_hadir) || 0}, ${esc(a.siswa_tidak_hadir || '')}, ${esc(a.nama_pengawas_1)}, ${esc(a.nip_pengawas_1)}, ${esc(a.nama_pengawas_2)}, ${esc(a.nip_pengawas_2)}, ${esc(a.html_content)});`);
            });
            lines.push('');
        }

        lines.push('SET FOREIGN_KEY_CHECKS = 1;\n');

        fs.writeFileSync(sqlPath, lines.join('\n'), 'utf-8');
        try {
            const publicSqlPath = path.join(__dirname, 'public', 'database.sql');
            fs.writeFileSync(publicSqlPath, lines.join('\n'), 'utf-8');
        } catch(err) {}
    } catch (e) {
        console.error('Error synchronizing database.sql:', e);
    }
}

// Helper membaca POST body
function readRequestBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString('utf8');
        // Batasi ukuran request hingga 50MB (cukup untuk kop image base64 resolusi tinggi)
        if (body.length > 50 * 1024 * 1024) {
            req.connection.destroy();
        }
    });
    req.on('end', () => {
        callback(body);
    });
}

// MIME types
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.sql': 'text/plain; charset=utf-8',
    '.ico': 'image/x-icon',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // CORS & Common Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 1. URL Rewriting untuk kompatibilitas rute PHP asli
    if (pathname === '/' || pathname === '/index.php' || pathname === '/index.html') {
        pathname = '/index.html';
    } else if (pathname === '/absensi.php' || pathname === '/absensi') {
        pathname = '/absensi.html';
    } else if (pathname === '/berita-acara.php' || pathname === '/berita-acara') {
        pathname = '/berita-acara.html';
    } else if (pathname === '/arsip.php' || pathname === '/arsip') {
        pathname = '/arsip.html';
    } else if (pathname === '/login' || pathname === '/login.php' || pathname === '/login.html' || pathname === '/admin/login.php' || pathname === '/admin/login') {
        pathname = '/admin/login.html';
    } else if (pathname === '/admin/' || pathname === '/admin' || pathname === '/admin/index.php' || pathname === '/admin/dashboard.html') {
        pathname = '/admin/index.html';
    }

    // 2. REST API: GET /api/get-students.php?class_id=X
    if (pathname === '/api/get-students.php' || pathname === '/api/get-students') {
        const classId = parsedUrl.query.class_id;
        if (!classId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Parameter class_id tidak valid.' }));
            return;
        }

        const db = getDatabase();
        const cls = db.classes.find(c => String(c.id) === String(classId));
        if (!cls) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Kelas tidak ditemukan.' }));
            return;
        }

        const students = db.students.filter(s => String(s.class_id) === String(classId));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            class: cls,
            students: students,
            count: students.length
        }));
        return;
    }

    // 3. REST API: GET /api/classes
    if (pathname === '/api/classes') {
        const db = getDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.classes));
        return;
    }

    // 4. REST API: GET /api/templates
    if (pathname === '/api/templates') {
        const db = getDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.templates));
        return;
    }

    // 5. REST API: GET /api/settings
    if (pathname === '/api/settings') {
        const db = getDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.settings));
        return;
    }

    // 5b. REST API: GET /api/teachers (Master Data Guru / Pengawas)
    if (pathname === '/api/teachers') {
        const db = getDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.teachers || []));
        return;
    }

    // 5c. REST API: GET /api/subjects (Daftar Mata Pelajaran)
    if (pathname === '/api/subjects') {
        const db = getDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify((db.settings && db.settings.subjects) || []));
        return;
    }

    // 5d. REST API: GET /api/academic-years (Daftar Tahun Ajaran)
    if (pathname === '/api/academic-years') {
        const db = getDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify((db.settings && db.settings.academic_years) || []));
        return;
    }

    // 5e. REST API: GET /api/archives (Daftar Arsip Dokumen Ujian)
    if (pathname === '/api/archives') {
        const db = getDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.archives || []));
        return;
    }

    // 5f. REST API: POST /api/save-archive (Menyimpan Hasil Cetak/Unduh Dokumen ke Database)
    if (req.method === 'POST' && pathname === '/api/save-archive') {
        readRequestBody(req, (rawBody) => {
            try {
                const payload = JSON.parse(rawBody || '{}');
                const db = getDatabase();
                if (!Array.isArray(db.archives)) db.archives = [];

                const newArchive = {
                    id: Date.now(),
                    type: payload.type || 'daftar_hadir', // 'daftar_hadir' | 'berita_acara'
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

                // Sisipkan di posisi teratas (terbaru)
                db.archives.unshift(newArchive);

                // Batasi arsip maksimal 200 dokumen untuk menjaga ukuran file tetap optimal
                if (db.archives.length > 200) {
                    db.archives = db.archives.slice(0, 200);
                }

                saveDatabase(db);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Dokumen berhasil diarsipkan ke database.',
                    archive: newArchive
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Format data arsip tidak valid: ' + err.message }));
            }
        });
        return;
    }

    // 5g. REST API: POST /api/delete-archive (Hapus Arsip Dokumen & Berkas Terkait)
    if (req.method === 'POST' && pathname === '/api/delete-archive') {
        readRequestBody(req, (rawBody) => {
            try {
                const payload = JSON.parse(rawBody || '{}');
                const db = getDatabase();
                if (!Array.isArray(db.archives)) db.archives = [];

                const id = payload.id;
                const target = db.archives.find(a => String(a.id) === String(id));
                const deletedIds = [];

                if (target) {
                    const targetClassId = target.class_id ? String(target.class_id) : '';
                    const targetClassName = (target.nama_kelas || '').trim().toLowerCase();
                    const targetMapel = (target.mata_pelajaran || '').trim().toLowerCase();
                    const targetDate = (target.tanggal_ujian || '').trim();

                    // Hapus dokumen target dan seluruh dokumen yang berhubungan (Daftar Hadir & Berita Acara pada pelaksanaan ujian yang sama)
                    db.archives = db.archives.filter(a => {
                        const isSameId = String(a.id) === String(id);
                        if (isSameId) {
                            deletedIds.push(a.id);
                            return false;
                        }

                        // Cek apakah dokumen ini berhubungan dengan sesi ujian yang sama (tanggal, mapel, dan kelas)
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
                            return false; // Hapus berkas pasangan/terkait ini juga
                        }

                        return true;
                    });
                } else {
                    db.archives = db.archives.filter(a => {
                        if (String(a.id) === String(id)) {
                            deletedIds.push(a.id);
                            return false;
                        }
                        return true;
                    });
                }

                saveDatabase(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: deletedIds.length > 1
                        ? `Dokumen dan ${deletedIds.length - 1} berkas terkait (Daftar Hadir & Berita Acara) berhasil dihapus.`
                        : 'Arsip dokumen berhasil dihapus.',
                    deleted_ids: deletedIds,
                    deleted_count: deletedIds.length
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: err.message }));
            }
        });
        return;
    }

    // 5g-1. REST API: GET /api/users (Daftar Manajemen User)
    if (pathname === '/api/users') {
        const db = getDatabase();
        const users = Array.isArray(db.users) ? db.users : [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(users));
        return;
    }

    // 5g-2. REST API: POST /api/save-user (Tambah / Update User)
    if (req.method === 'POST' && pathname === '/api/save-user') {
        readRequestBody(req, (rawBody) => {
            try {
                const payload = JSON.parse(rawBody || '{}');
                const db = getDatabase();
                if (!Array.isArray(db.users)) db.users = [];

                const uUsername = String(payload.username || '').trim().toLowerCase();
                const uNama = String(payload.nama || payload.username || '').trim();
                const uRole = String(payload.role || 'admin').trim();
                const uPassword = String(payload.password || '').trim();
                const uId = payload.id ? Number(payload.id) : null;

                if (!uUsername) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Username wajib diisi!' }));
                    return;
                }

                if (uId) {
                    // Update user
                    const existing = db.users.find(u => Number(u.id) === uId);
                    if (!existing) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'User tidak ditemukan.' }));
                        return;
                    }
                    // Cek duplikasi username jika diubah
                    const duplicate = db.users.find(u => u.username.toLowerCase() === uUsername && Number(u.id) !== uId);
                    if (duplicate) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: `Username "${uUsername}" sudah digunakan.` }));
                        return;
                    }
                    existing.username = uUsername;
                    existing.nama = uNama;
                    existing.role = uRole;
                    if (uPassword) existing.password = uPassword;
                } else {
                    // Tambah user baru
                    if (!uPassword) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Password wajib diisi untuk user baru!' }));
                        return;
                    }
                    const duplicate = db.users.find(u => u.username.toLowerCase() === uUsername);
                    if (duplicate) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: `Username "${uUsername}" sudah terdaftar.` }));
                        return;
                    }
                    const nextId = db.users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
                    db.users.push({
                        id: nextId,
                        username: uUsername,
                        password: uPassword,
                        nama: uNama,
                        role: uRole,
                        created_at: new Date().toISOString()
                    });
                }

                saveDatabase(db);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Pengguna berhasil disimpan ke basis data.' }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: err.message }));
            }
        });
        return;
    }

    // 5g-3. REST API: POST /api/delete-user (Hapus User)
    if (req.method === 'POST' && pathname === '/api/delete-user') {
        readRequestBody(req, (rawBody) => {
            try {
                const payload = JSON.parse(rawBody || '{}');
                const id = Number(payload.id);
                const db = getDatabase();
                if (!Array.isArray(db.users)) db.users = [];

                const target = db.users.find(u => Number(u.id) === id);
                if (!target) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'User tidak ditemukan.' }));
                    return;
                }

                if (target.username.toLowerCase() === 'admin' || target.id === 1) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Akun Superadmin utama (admin) tidak boleh dihapus demi keamanan sistem.' }));
                    return;
                }

                db.users = db.users.filter(u => Number(u.id) !== id);
                saveDatabase(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: `Pengguna "${target.username}" berhasil dihapus.` }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: err.message }));
            }
        });
        return;
    }

    // 5h. REST API: GET /api/get-attendance-rekap (Sinkronisasi otomatis rekap hadir ke Berita Acara)
    if (pathname === '/api/get-attendance-rekap') {
        const classId = parsedUrl.query.class_id;
        const className = parsedUrl.query.kelas || '';
        const tgl = parsedUrl.query.tanggal_ujian;
        const mapel = (parsedUrl.query.mata_pelajaran || '').trim().toLowerCase();

        const db = getDatabase();
        const archives = db.archives || [];

        // Filter seluruh arsip daftar hadir
        const dhList = archives.filter(a => a.type === 'daftar_hadir');

        let match = null;

        // 1. Prioritas Utama: Cek kesesuaian Tanggal Ujian dan Mata Pelajaran terlebih dahulu
        if (tgl && mapel) {
            if (classId || className) {
                match = dhList.find(a => {
                    const mClass = (classId && String(a.class_id) === String(classId)) || 
                                   (className && a.nama_kelas && (a.nama_kelas.toLowerCase() === className.toLowerCase() || a.nama_kelas.toLowerCase().includes(className.toLowerCase())));
                    const mDate = a.tanggal_ujian === tgl;
                    const mMapel = a.mata_pelajaran && (a.mata_pelajaran.toLowerCase() === mapel || a.mata_pelajaran.toLowerCase().includes(mapel));
                    return mClass && mDate && mMapel;
                });
            }
            if (!match) {
                // Jika belum spesifik per kelas, ambil arsip yang sesuai Tanggal dan Mapel
                match = dhList.find(a => {
                    const mDate = a.tanggal_ujian === tgl;
                    const mMapel = a.mata_pelajaran && (a.mata_pelajaran.toLowerCase() === mapel || a.mata_pelajaran.toLowerCase().includes(mapel));
                    return mDate && mMapel;
                });
            }
        }

        // 2. Fallback: Cocokkan berdasarkan kelas dan tanggal/mapel yang ada
        if (!match && (classId || className)) {
            match = dhList.find(a => {
                const mClass = (classId && String(a.class_id) === String(classId)) || 
                               (className && a.nama_kelas && a.nama_kelas.toLowerCase().includes(className.toLowerCase()));
                const mDate = !tgl || a.tanggal_ujian === tgl;
                const mMapel = !mapel || (a.mata_pelajaran && (a.mata_pelajaran.toLowerCase() === mapel || a.mata_pelajaran.toLowerCase().includes(mapel)));
                return mClass && (mDate || mMapel);
            });
        }

        if (match) {
            let absentDetail = match.siswa_tidak_hadir || '';
            // Jika arsip belum memiliki properti siswa_tidak_hadir, lakukan ekstraksi otomatis dari html_content
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

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                found: true,
                rekap: {
                    peserta_seharusnya: match.peserta_seharusnya,
                    peserta_hadir: match.peserta_hadir,
                    peserta_tidak_hadir: match.peserta_tidak_hadir,
                    siswa_tidak_hadir: absentDetail,
                    nama_kelas: match.nama_kelas,
                    class_id: match.class_id,
                    tanggal_ujian: match.tanggal_ujian,
                    mata_pelajaran: match.mata_pelajaran,
                    nama_pengawas_1: match.nama_pengawas_1,
                    nip_pengawas_1: match.nip_pengawas_1,
                    nama_pengawas_2: match.nama_pengawas_2,
                    nip_pengawas_2: match.nip_pengawas_2,
                    created_at: match.created_at
                }
            }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, found: false, message: 'Tidak ditemukan arsip daftar hadir yang cocok.' }));
        }
        return;
    }

    // 6. REST API: POST /api/save-db (Menyimpan seluruh atau bagian database)
    if (req.method === 'POST' && pathname === '/api/save-db') {
        readRequestBody(req, (rawBody) => {
            try {
                const payload = JSON.parse(rawBody || '{}');
                const db = getDatabase();

                if (payload.delete_all_students === true) {
                    db.students = [];
                    if (payload.reset_classes === true) {
                        db.classes = [];
                    }
                } else if (Array.isArray(payload.students)) {
                    db.students = payload.students;
                }

                if (payload.delete_all_teachers === true) {
                    db.teachers = [];
                } else if (Array.isArray(payload.teachers)) {
                    db.teachers = payload.teachers;
                }

                if (Array.isArray(payload.classes)) db.classes = payload.classes;
                if (Array.isArray(payload.templates)) db.templates = payload.templates;
                if (Array.isArray(payload.archives)) db.archives = payload.archives;
                if (Array.isArray(payload.users)) db.users = payload.users;

                if (Array.isArray(payload.subjects)) {
                    db.subjects = payload.subjects;
                    if (!db.settings) db.settings = {};
                    db.settings.subjects = payload.subjects;
                }
                if (Array.isArray(payload.academic_years)) {
                    db.academic_years = payload.academic_years;
                    if (!db.settings) db.settings = {};
                    db.settings.academic_years = payload.academic_years;
                }
                if (payload.settings && typeof payload.settings === 'object') {
                    db.settings = { ...db.settings, ...payload.settings };
                    if (Array.isArray(payload.settings.subjects)) db.subjects = payload.settings.subjects;
                    if (Array.isArray(payload.settings.academic_years)) db.academic_years = payload.settings.academic_years;
                }

                const ok = saveDatabase(db);
                if (ok) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Data berhasil disimpan ke database.', timestamp: new Date().toISOString() }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Gagal menulis ke file database.' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Format JSON tidak valid: ' + err.message }));
            }
        });
        return;
    }

    // 7. REST API: POST /api/upload-kop (Upload gambar Kop Surat Resmi)
    if (req.method === 'POST' && pathname === '/api/upload-kop') {
        readRequestBody(req, (rawBody) => {
            try {
                const payload = JSON.parse(rawBody || '{}');
                const imageData = payload.image; // data:image/png;base64,....

                if (!imageData) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Tidak ada data gambar yang dikirim.' }));
                    return;
                }

                // Parse base64
                const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                let buffer;
                if (matches && matches.length === 3) {
                    buffer = Buffer.from(matches[2], 'base64');
                } else {
                    buffer = Buffer.from(imageData, 'base64');
                }

                // Pastikan direktori gambar ada
                const imgDir = path.dirname(KOP_IMG_PATH);
                if (!fs.existsSync(imgDir)) {
                    fs.mkdirSync(imgDir, { recursive: true });
                }

                // Backup kop lama jika belum ada backup default
                if (fs.existsSync(KOP_IMG_PATH) && !fs.existsSync(KOP_DEFAULT_PATH)) {
                    try {
                        fs.copyFileSync(KOP_IMG_PATH, KOP_DEFAULT_PATH);
                    } catch (e) {
                        console.error('Error backing up default kop:', e);
                    }
                }

                // Simpan berkas kop baru
                fs.writeFileSync(KOP_IMG_PATH, buffer);

                // Update settings di db.json
                const db = getDatabase();
                if (!db.settings) db.settings = {};
                db.settings.kop_header = '/assets/img/kop-header.png';
                saveDatabase(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Kop surat resmi berhasil diunggah dan disimpan!',
                    url: '/assets/img/kop-header.png?t=' + Date.now()
                }));
            } catch (err) {
                console.error('Error upload kop:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Gagal mengunggah kop surat: ' + err.message }));
            }
        });
        return;
    }

    // 8. REST API: POST /api/reset-kop (Reset Kop ke Default SMK NEGERI FYJ CHANNEL)
    if (req.method === 'POST' && pathname === '/api/reset-kop') {
        try {
            if (fs.existsSync(KOP_DEFAULT_PATH)) {
                fs.copyFileSync(KOP_DEFAULT_PATH, KOP_IMG_PATH);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Kop surat berhasil direset ke standar default!',
                    url: '/assets/img/kop-header.png?t=' + Date.now()
                }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Berkas default kop tidak ditemukan.' }));
            }
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Gagal mereset kop: ' + err.message }));
        }
        return;
    }

    // 8b. REST API: POST /api/upload-logo (Upload Logo Sekolah Baru)
    if (req.method === 'POST' && pathname === '/api/upload-logo') {
        readRequestBody(req, (rawBody) => {
            try {
                const payload = JSON.parse(rawBody || '{}');
                const imageData = payload.image;
                if (!imageData) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Data gambar tidak valid.' }));
                    return;
                }

                let buffer;
                const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    buffer = Buffer.from(matches[2], 'base64');
                } else {
                    buffer = Buffer.from(imageData, 'base64');
                }

                // Pastikan direktori gambar ada
                const imgDir = path.dirname(LOGO_IMG_PATH);
                if (!fs.existsSync(imgDir)) {
                    fs.mkdirSync(imgDir, { recursive: true });
                }

                if (fs.existsSync(LOGO_IMG_PATH) && !fs.existsSync(LOGO_DEFAULT_PATH)) {
                    try {
                        fs.copyFileSync(LOGO_IMG_PATH, LOGO_DEFAULT_PATH);
                    } catch (e) {
                        console.error('Error backing up default logo:', e);
                    }
                }

                fs.writeFileSync(LOGO_IMG_PATH, buffer);

                const db = getDatabase();
                if (!db.settings) db.settings = {};
                db.settings.school_logo = '/assets/img/logo.png';
                saveDatabase(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Logo sekolah resmi berhasil diunggah dan diperbarui!',
                    url: '/assets/img/logo.png?t=' + Date.now()
                }));
            } catch (err) {
                console.error('Error upload logo:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Gagal mengunggah logo: ' + err.message }));
            }
        });
        return;
    }

    // 8c. REST API: POST /api/reset-logo (Reset Logo ke Default)
    if (req.method === 'POST' && pathname === '/api/reset-logo') {
        try {
            if (fs.existsSync(LOGO_DEFAULT_PATH)) {
                fs.copyFileSync(LOGO_DEFAULT_PATH, LOGO_IMG_PATH);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Logo sekolah berhasil direset ke standar default!',
                    url: '/assets/img/logo.png?t=' + Date.now()
                }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Berkas default logo tidak ditemukan.' }));
            }
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Gagal mereset logo: ' + err.message }));
        }
        return;
    }

    // 9. REST API: POST /api/delete-class-students (Hapus semua siswa dalam 1 kelas atau hapus kelas)
    if (req.method === 'POST' && pathname === '/api/delete-class-students') {
        readRequestBody(req, (rawBody) => {
            try {
                const payload = JSON.parse(rawBody || '{}');
                const classId = payload.class_id;
                const deleteClass = payload.delete_class === true;

                if (!classId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Parameter class_id diperlukan.' }));
                    return;
                }

                const db = getDatabase();
                const beforeCount = db.students.length;
                db.students = db.students.filter(s => String(s.class_id) !== String(classId));
                const deletedStudentsCount = beforeCount - db.students.length;

                if (deleteClass) {
                    db.classes = db.classes.filter(c => String(c.id) !== String(classId));
                }

                saveDatabase(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: `Berhasil menghapus ${deletedStudentsCount} siswa${deleteClass ? ' dan kelas terkait' : ''}.`,
                    deletedCount: deletedStudentsCount,
                    remainingStudents: db.students.length
                }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Gagal memproses penghapusan: ' + err.message }));
            }
        });
        return;
    }

    // 10. Direct SQL Download
    if (pathname === '/database.sql') {
        const sqlPath = path.join(__dirname, 'database.sql');
        if (fs.existsSync(sqlPath)) {
            res.writeHead(200, {
                'Content-Type': 'application/sql',
                'Content-Disposition': 'attachment; filename="database_sas_fyj_channel.sql"'
            });
            fs.createReadStream(sqlPath).pipe(res);
            return;
        }
    }

    // 11. Data DB JSON Download
    if (pathname === '/data/db.json') {
        const dbPath = path.join(__dirname, 'data', 'db.json');
        if (fs.existsSync(dbPath)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            fs.createReadStream(dbPath).pipe(res);
            return;
        }
    }

    // 12. Serving Static Files dari folder public/
    let filePath = path.join(__dirname, 'public', pathname);
    
    // Normalisasi jika request meminta file tanpa prefix public
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, pathname);
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>404 Tidak Ditemukan</title><link rel="stylesheet" href="/assets/css/app.css"></head>
                <body style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;">
                    <div>
                        <h1 style="color:var(--primary);font-size:3rem;margin-bottom:0.5rem;">404</h1>
                        <h2>Halaman Tidak Ditemukan</h2>
                        <p style="color:var(--text-muted);margin:1rem 0;">Berkas yang diminta tidak tersedia di server.</p>
                        <a href="/" class="btn btn-primary">Kembali ke Beranda</a>
                    </div>
                </body>
                </html>
            `);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` Generator Absensi & Berita Acara Ujian SAS`);
    console.log(` SMK NEGERI FYJ CHANNEL`);
    console.log(` Server berjalan aktif!`);
    console.log(` - Akses Lokal (PC ini):     http://localhost:${PORT}`);
    
    // Tampilkan IP lokal untuk akses dari perangkat lain (HP / PC lain di LAN)
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(` - Akses Jaringan/PC Lain:   http://${net.address}:${PORT} (${name})`);
            }
        }
    }
    console.log(` Mode: Standalone Node.js (Zero Dependency)`);
    console.log(`====================================================`);
});


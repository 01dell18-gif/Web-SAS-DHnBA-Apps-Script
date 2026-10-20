# Generator Absensi & Berita Acara Ujian Resmi Format A4
## SMK NEGERI 1 KLUNGKUNG

Aplikasi web modern untuk pembuatan administrasi ujian sekolah otomatis yang menghasilkan **Daftar Hadir Peserta Ujian** dan **Berita Acara Pelaksanaan Ujian (2 Halaman)** standar resmi kertas A4. Dilengkapi dengan **Panel Administrator Multi-Halaman**, **Manajemen Pengguna (User Management)**, **Arsip Berkas Digital dengan 5 Filter Seleksi**, serta dukungan penuh untuk **GitHub Pages** dan **Server Mandiri Node.js Zero-Dependency**.

---

## 🚀 Fitur Unggulan Sistem Terbaru

1. **Panel Administrator Modular (1 Menu = 1 Full HTML Terkoneksi)**:
   - Panel admin kini dipecah menjadi halaman penuh independen untuk stabilitas tinggi tanpa tab-switching error.
   - **Dashboard**: `/admin/index.html`
   - **Master Siswa & Kelas**: `/admin/siswa.html` (Export/Import Excel, Hapus Massal per Kelas / Hapus Semua Siswa)
   - **Master Guru & Pengawas**: `/admin/guru.html` (Export/Import Excel, Autocomplete NIP)
   - **Template Ujian**: `/admin/template.html` (Riwayat template tersimpan, chip variabel dinamis `[semester]`)
   - **Arsip Dokumen Ujian**: `/admin/arsip.html` (5 Filter Detail, Cetak Ulang, Unduh PDF)
   - **Pengaturan Sekolah & Kop**: `/admin/pengaturan.html` (Tahun ajaran aktif dari master, mapel resmi, upload/reset kop surat)
   - **Manajemen User**: `/admin/users.html` (Akun Administrator & Operator, proteksi akun utama)
   - **Database & Backup**: `/admin/database.html` (Unduh langsung `database.sql`, `db.json`, `Data_Siswa.xlsx`, `Data_Guru.xlsx`)

2. **Login Administrator dengan Tombol Mata & Sesi Pintar**:
   - Kolom password dilengkapi tombol mata untuk melihat/sembunyikan karakter.
   - Sesi terproteksi (`localStorage.getItem('sas_admin_auth')`). Saat pengguna login dan kembali ke beranda publik, tombol **Panel Admin** langsung membuka dashboard tanpa meminta login ulang.

3. **Menu Arsip Dokumen dengan 5 Kriteria Filter Detail**:
   - Filter simultan berdasarkan: **Tahun Ajaran**, **Semester (Ganjil/Genap)**, **Tanggal Ujian**, **Kelas**, dan **Mata Pelajaran**.
   - Dilengkapi tombol **Reset Filter** dan pencarian teks cepat.

4. **Format Tanda Tangan Pengawas Resmi (Tanpa Kurung & Tanpa Underline)**:
   - Kolom nama dan titik-titik tanda tangan pengawas ujian pada pratinjau A4 disajikan bersih tanpa tanda kurung `()` dan tanpa garis bawah (`underline`).

5. **Sinkronisasi Otomatis Basis Data (`database.sql`)**:
   - Setiap mutasi data (tambah/edit/hapus siswa, guru, template, user, pengaturan) otomatis meregenerasi file `database.sql` secara realtime.

6. **Kompatibilitas Penuh GitHub Pages**:
   - Aplikasi dapat dijalankan 100% pada **GitHub Pages** tanpa backend server menggunakan modul pintar `public/assets/js/github-pages-compat.js`.

---

## 📁 Struktur Berkas Proyek

```text
web-sas-dh-n-beritaacara/
├── index.html                   # Entry point root (auto-forwarding untuk GitHub Pages)
├── server.js                    # Web server HTTP mandiri Node.js (Zero Dependency)
├── database.sql                 # Skema DDL & DML MySQL/MariaDB (Auto-synchronized)
├── README.md                    # Panduan ringkas penggunaan sistem
├── Teknik pembuata.md           # Dokumentasi arsitektur, teknik, & alur pembuatan
├── package.json                 # Metadata proyek & skrip npm
├── data/
│   └── db.json                  # Basis data JSON utama (Master source of truth)
└── public/
    ├── index.html               # Beranda publik SMK Negeri 1 Klungkung
    ├── absensi.html             # Generator Daftar Hadir Ujian
    ├── berita-acara.html        # Generator Berita Acara Ujian
    ├── arsip.html               # Arsip Dokumen Publik (5 Filter Detail)
    ├── admin/                   # Modul Panel Administrator Terpisah
    │   ├── index.html           # Dashboard Admin
    │   ├── siswa.html           # Master Siswa & Kelas
    │   ├── guru.html            # Master Guru & Pengawas
    │   ├── template.html        # Template Ujian & Redaksi
    │   ├── arsip.html           # Arsip Dokumen Admin
    │   ├── pengaturan.html      # Pengaturan Sekolah, Mapel, Tahun, & Kop
    │   ├── users.html           # Manajemen Akun User & Hak Akses
    │   ├── database.html        # Backup & Ekspor Basis Data
    │   └── login.html           # Login Admin (Password Eye Toggle)
    └── assets/
        ├── css/
        │   ├── app.css          # Desain sistem responsif & komponen UI
        │   └── preview-a4.css   # Styling cetak A4 presisi (Tanpa underline & tanda kurung pengawas)
        ├── js/
        │   ├── absensi.js       # Logika formulir & live preview absensi
        │   ├── berita-acara.js  # Logika formulir & live preview berita acara
        │   ├── admin-common.js  # Auth check, loader, sidebar active state, & toast helper
        │   ├── github-pages-compat.js # Client-side interceptor API untuk GitHub Pages
        │   ├── html2pdf.bundle.min.js # Kompilasi PDF berbasis canvas A4
        │   └── xlsx.full.min.js # SheetJS offline untuk export/import Excel
        └── img/
            ├── logo.png         # Logo resmi SMK Negeri 1 Klungkung
            ├── kop-header.png   # Kop surat aktif
            └── kop-default.png  # Cadangan kop surat bawaan pabrik
```

---

## 🛠️ Cara Menjalankan Aplikasi

### 1. Menjalankan di Komputer Lokal (Node.js)
```bash
# Jalankan server lokal
node server.js
```
Akses di browser: 👉 **`http://localhost:3000`**

### 2. Menjalankan di GitHub Pages
1. Pastikan repository Anda aktif di GitHub (`https://github.com/01dell18-gif/web-sas-dh-n-beritaacara`).
2. Masuk ke **Settings** > **Pages** di repository GitHub Anda.
3. Pada **Source**, pilih `Deploy from a branch`, lalu pilih branch `main` dan folder `/(root)`.
4. Klik **Save**. Web siap diakses di `https://01dell18-gif.github.io/web-sas-dh-n-beritaacara/`.

---

## 🔐 Kredensial Administrator Bawaan
- **Username**: `admin`
- **Password**: `admin123`
- Anda dapat menambah atau mengubah pengguna di menu **Manajemen User** (`/admin/users.html`).

---

## 📖 Dokumentasi Lengkap
Informasi detail mengenai arsitektur, mekanisme basis data relasional, alur generator, dan teknik kompilasi PDF dapat dibaca di file:
👉 **`Teknik pembuata.md`**

# Generator Absensi & Berita Acara Ujian Resmi Format A4

## SMK NEGERI FYJ CHANNEL

Aplikasi web modern untuk pembuatan administrasi ujian sekolah otomatis yang menghasilkan **Daftar Hadir Peserta Ujian** dan **Berita Acara Pelaksanaan Ujian (2 Halaman)** standar resmi kertas A4. Dilengkapi dengan **Panel Administrator Multi-Halaman**, **Manajemen Pengguna (User Management)**, **Arsip Berkas Digital dengan 5 Filter Seleksi**, **Master Kelas & Mapel dengan Export/Import Excel**, serta dukungan penuh untuk **GitHub Pages** dan **Server Mandiri Node.js Zero-Dependency**.

---

## 🚀 Fitur Unggulan Sistem Terbaru

- **1. Panel Administrator Modular (1 Menu = 1 Full HTML Terkoneksi)**:
  - Panel admin dipecah menjadi halaman penuh independen untuk stabilitas tinggi tanpa tab-switching error:
  - **Dashboard**: `/admin/index.html` (Total Kelas Aktif akurat berbasis siswa terdaftar)
  - **Master Siswa & Kelas**: `/admin/siswa.html` (Auto-register kelas baru saat input manual atau impor Excel, Hapus Massal Siswa & Opsi Reset Kelas)
  - **Master Guru & Pengawas**: `/admin/guru.html` (Export/Import Excel, Autocomplete NIP, tombol **Hapus Data Guru**)
  - **Template Ujian**: `/admin/template.html` (Riwayat template tersimpan, chip variabel dinamis `[semester]`)
  - **Arsip Dokumen Ujian**: `/admin/arsip.html` (5 Filter Detail, Cetak Ulang, Unduh PDF)
  - **Pengaturan Sekolah, Kelas & Kop**: `/admin/pengaturan.html` (Upload Logo Sekolah, Upload Kop Surat, Master Kelas dengan Export/Import Excel, Master Mapel dengan Export/Import Excel, Tahun Ajaran)
  - **Manajemen User**: `/admin/users.html` (Akun Administrator & Operator, proteksi akun utama)
  - **Database & Backup**: `/admin/database.html` (Unduh langsung `database.sql`, `db.json`, `Data_Siswa.xlsx`, `Data_Guru.xlsx`)

- **2. Upload & Penggantian Logo Sekolah Resmi**:
  - Menu Pengaturan kini dilengkapi pratinjau & upload berkas **Logo Sekolah Resmi** (`logo.png`) serta tombol **Reset ke Logo Standar**.

- **3. Master Daftar Kelas & Export/Import Excel**:
  - Pengaturan kini memiliki sub-menu **Master Daftar Kelas Resmi**:
  - Tambah kelas manual (Nama Kelas, Tingkat, Program Keahlian).
  - **Export (.xlsx)** dan **Import (.xlsx)** Master Kelas.
  - Kelas baru juga otomatis terdaftar saat menginput data siswa.
  - Dashboard menghitung kelas aktif yang memiliki siswa terdaftar.

- **4. Export & Import Excel untuk Master Mata Pelajaran Resmi**:
  - Mata pelajaran resmi kini dapat diekspor ke `.xlsx` dan diimpor massal dari berkas Excel dengan template siap pakai.

- **5. Tombol Hapus Data Guru di Master Guru**:
  - Tombol hapus massal pada menu Guru & Pengawas kini tepat berfungsi untuk mengosongkan data guru (`delete_all_teachers`).

- **6. Login Administrator dengan Tombol Mata & Sesi Pintar**:
  - Kolom password dilengkapi tombol mata untuk melihat/sembunyikan karakter.
  - Sesi terproteksi (`localStorage.getItem('sas_admin_auth')`). Saat pengguna login dan kembali ke beranda publik, tombol **Panel Admin** langsung membuka dashboard tanpa meminta login ulang.

- **7. Menu Arsip Dokumen dengan 5 Kriteria Filter Detail**:
  - Filter simultan berdasarkan: **Tahun Ajaran**, **Semester (Ganjil/Genap)**, **Tanggal Ujian**, **Kelas**, dan **Mata Pelajaran**.
  - Dilengkapi tombol **Reset Filter** dan pencarian teks cepat.

- **8. Format Tanda Tangan Pengawas Resmi (Tanpa Kurung & Tanpa Underline)**:
  - Kolom nama dan titik-titik tanda tangan pengawas ujian pada pratinjau A4 disajikan bersih tanpa tanda kurung `()` dan tanpa garis bawah (`underline`).

- **9. Sinkronisasi Otomatis Basis Data (`database.sql`)**:
  - Setiap mutasi data otomatis meregenerasi file `database.sql` secara realtime.

- **10. Kompatibilitas Penuh GitHub Pages**:
  - Aplikasi dapat dijalankan 100% pada **GitHub Pages** tanpa backend server menggunakan modul pintar `public/assets/js/github-pages-compat.js`.

- **11. Navigasi Terintegrasi & Filter Siswa Akurat**:
  - Klik tombol "Lihat Siswa" pada kelas manapun di Dashboard otomatis memfilter dan menampilkan seluruh siswa kelas tersebut secara presisi.
  - Seluruh kartu metrik di Dashboard interaktif dan dapat diklik untuk langsung membuka modul pengelolaannya.

- **12. Filter Arsip Dokumen Mendatar ke Samping (Horizontal Filter)**:
  - Filter detail dokumen (Tahun Ajaran, Semester, Tanggal Ujian, Kelas, Mata Pelajaran, dan Reset) tersusun mendatar ke samping dengan scrolling horizontal yang rapi.

- **13. Program / Konsentrasi Keahlian Resmi SMK N 1 Klungkung**:
  - Master kelas menggunakan Program Keahlian resmi (Teknik Komputer dan Jaringan, Desain Komunikasi Visual, Bisnis Digital, Manajemen Perkantoran dan Layanan Bisnis, Akuntansi dan Keuangan Lembaga, Layanan Penunjang Kefarmasian Klinis dan Komunitas, Layanan Perbankan, Teknik Sepeda Motor) dengan deteksi otomatis saat input siswa maupun impor Excel.

- **14. Pembaruan Berantai Relasi Kelas (Cascade Update)**:
  - Edit atau pembaruan nama kelas, tingkat, atau program keahlian pada Master Daftar Kelas otomatis memperbarui seluruh data siswa terdaftar dan arsip yang berkaitan secara serempak.

- **15. Paginasi Fleksibel & Limit Baris Data (20, 40, 50, 100, 200, 400, 500, Semua)**:
  - Diterapkan pada Master Data Siswa & Master Kelas serta Master Data Guru & Pengawas dengan tombol "Sebelumnya", "Setelahnya", penomoran kontinu, dan pemilih limit baris data.

- **16. Manajemen User dengan Password Eye Toggle & Referensi Guru**:
  - Kolom password pada tabel dilengkapi tombol mata untuk lihat/sembunyikan kata sandi. Form tambah/edit user terintegrasi dengan daftar dewan guru (`<datalist>`) namun tetap dapat diketik manual.

- **17. Kolom Program / Konsentrasi Keahlian pada Master Data Siswa & Master Kelas**:
  - Tabel Master Siswa kini menampilkan kolom khusus **Program / Konsentrasi Keahlian** dengan badge visual yang rapi dan informatif.
  - Dropdown filter kelas di Master Siswa menampilkan nama kelas beserta program keahliannya untuk memudahkan seleksi.

- **18. Ekspor Menyeluruh Seluruh Data (.xlsx) & Unduh Backup Basis Data Lengkap**:
  - Seluruh tombol ekspor Excel (Siswa, Guru, Kelas, Mapel) mengekspor 100% seluruh rekaman data dari database tanpa terpotong batas paginasi atau filter tampilan.
  - Fitur **Unduh Data_Siswa.xlsx** dan **Unduh Data_Guru.xlsx** pada menu **Backup & Database SQL** telah disinkronkan dengan skema basis data relasional sehingga data terunduh lengkap dengan kolom NIS, Nama, Kelas, Tingkat, Program Keahlian, NIP, Mata Pelajaran Diampu, dan Jabatan.

- **19. Pembatasan Hak Akses Khusus Operator (Role-Based Access Control)**:
  - Akun pengguna berstatus **Operator** secara otomatis disembunyikan dari menu **Manajemen User** dan **Backup & Database SQL** di bilah navigasi sidebar maupun kartu aksi Dashboard. Dilengkapi proteksi routing langsung jika halaman terlarang diakses via address bar.

- **20. Tombol Perbarui Pengaturan di Paling Bawah & Konfirmasi Buka Menu Baru**:
  - Tombol **"Perbarui Pengaturan, Logo & Kop Surat"** diletakkan di posisi paling bawah halaman pengaturan untuk menyimpan seluruh perubahan identitas, logo, kop, kelas resmi, mapel, dan tahun ajaran secara serempak.
  - Dilengkapi deteksi status belum disimpan (*dirty state tracking*) dan modal konfirmasi saat pengguna membuka menu lain sebelum menyimpan perubahan.

- **21. Konfirmasi Dialog Saat Keluar Panel Admin (Logout Guard)**:
  - Tombol **Keluar** pada panel administrator kini dilengkapi dialog konfirmasi (*"Apakah Anda yakin ingin keluar dari Panel Administrator?"*) untuk mencegah pengguna keluar secara tidak sengaja.

- **22. Penyederhanaan Tampilan Beranda Publik**:
  - Kartu informasi teknis "Arsitektur & Sistematika Sistem" telah ditiadakan dari beranda publik, menghadirkan antarmuka yang lebih rapi, bersih, dan berfokus langsung pada akses formulir dan arsip dokumen.

- **23. Sinkronisasi Dinamis Identitas Sekolah Resmi di Seluruh Web**:
  - Seluruh tampilan nama sekolah pada tab browser, bilah navigasi navbar, banner hero beranda, footer hak cipta, sidebar admin, halaman login, pratinjau dokumen, hingga dialog konfirmasi secara otomatis menyesuaikan dengan input **Nama Sekolah Resmi** yang dikonfigurasi pada menu **Pengaturan Sekolah & Kop**.

- **24. Sistem Popup Modal Interaktif & Toast Universal**:
  - Seluruh notifikasi, konfirmasi tindakan (hapus data, keluar/logout, reset formulir), dan peringatan sistem kini disajikan dalam bentuk popup modal glassmorphism modern (`popup.js`) dengan tombol aksi interaktif, navigasi keyboard (Enter/Esc), serta floating toast notification di pojok layar.

---

## 📁 Struktur Berkas Proyek

```text
web-sas-dh-n-beritaacara/
├── index.html                   # Entry point root (auto-forwarding untuk GitHub Pages)
├── server.js                    # Web server HTTP mandiri Node.js (Zero Dependency)
├── database.sql                 # Skema DDL & DML MySQL/MariaDB (Auto-synchronized)
├── README.md                    # Panduan ringkas penggunaan sistem
├── Teknik pembuatan.md          # Dokumentasi arsitektur, teknik, & alur pembuatan
├── package.json                 # Metadata proyek & skrip npm
├── data/
│   └── db.json                  # Basis data JSON utama (Master source of truth)
└── public/
    ├── index.html               # Beranda publik SMK NEGERI FYJ CHANNEL
    ├── absensi.html             # Generator Daftar Hadir Ujian
    ├── berita-acara.html        # Generator Berita Acara Ujian
    ├── arsip.html               # Arsip Dokumen Publik (5 Filter Detail)
    ├── admin/                   # Modul Panel Administrator Terpisah
    │   ├── index.html           # Dashboard Admin (Total Kelas Aktif Berbasis Siswa)
    │   ├── siswa.html           # Master Siswa & Kelas (Auto-Register Kelas)
    │   ├── guru.html            # Master Guru & Pengawas (Tombol Hapus Data Guru)
    │   ├── template.html        # Template Ujian & Redaksi
    │   ├── arsip.html           # Arsip Dokumen Admin
    │   ├── pengaturan.html      # Pengaturan Sekolah, Logo, Kop, Kelas & Mapel (Export/Import .xlsx)
    │   ├── users.html           # Manajemen Akun User & Hak Akses
    │   ├── database.html        # Backup & Ekspor Basis Data
    │   └── login.html           # Login Admin (Password Eye Toggle)
    └── assets/
        ├── css/
        │   ├── app.css          # Desain sistem responsif, modal popup & komponen UI
        │   └── preview-a4.css   # Styling cetak A4 presisi (Tanpa underline & tanda kurung pengawas)
        ├── js/
        │   ├── popup.js         # Modal popup konfirmasi interaktif & floating toast universal
        │   ├── absensi.js       # Logika formulir & live preview absensi
        │   ├── berita-acara.js  # Logika formulir & live preview berita acara
        │   ├── admin-common.js  # Auth check, loader, sidebar active state, & toast helper
        │   ├── github-pages-compat.js # Client-side interceptor API untuk GitHub Pages
        │   ├── html2pdf.bundle.min.js # Kompilasi PDF berbasis canvas A4
        │   └── xlsx.full.min.js # SheetJS offline untuk export/import Excel
        └── img/
            ├── logo.png         # Logo resmi SMK NEGERI FYJ CHANNEL
            ├── logo-default.png # Cadangan logo sekolah bawaan
            ├── kop-header.png   # Kop surat aktif
            └── kop-header-default.png # Cadangan kop surat bawaan pabrik
```

---

## 🛠️ Cara Menjalankan Aplikasi

### 1. Menjalankan di Komputer Lokal Menggunakan Node.js (Panduan Pemula)

Sistem ini dirancang dengan arsitektur **Zero External Dependencies** (hanya memanfaatkan modul inti bawaan Node.js seperti `http`, `fs`, `path`, `url`), sehingga Anda **TIDAK PERLU** mengunduh ratusan megabyte `node_modules` atau menjalankan `npm install`.

Ikuti langkah mudah berikut:

1. **Pastikan Node.js Terpasang**:
   - Unduh dan pasang versi LTS resmi dari [nodejs.org](https://nodejs.org).
   - Buka Command Prompt / Terminal, lalu ketik `node -v` untuk memastikan instalasi berhasil.
2. **Buka Direktori Proyek**:
   - Buka folder proyek di File Explorer.
   - Klik pada kolom alamat (*address bar*) di bagian atas folder, ketik `cmd`, lalu tekan `Enter` (atau buka folder di VS Code dan buka terminal terintegrasi).
3. **Jalankan Server Lokal**:

   ```bash
   node server.js
   ```

4. **Buka di Browser**:
   - Buka browser (Chrome, Edge, Firefox, dll) dan akses: 👉 **`http://localhost:3000`**
5. **Masuk ke Panel Administrator**:
   - Klik tombol **Panel Admin** di pojok kanan atas atau buka `http://localhost:3000/admin/login.html`.
   - Akun Admin (Akses Penuh): `admin` / `admin123`.
   - Akun Operator (Kelola Dokumen): `operator` / `operator123`.
6. **Menghentikan Server**:
   - Tekan `Ctrl + C` di jendela Command Prompt / Terminal untuk mematikan server.

### 2. Menjalankan Menggunakan Docker (Opsional)

Aplikasi ini sudah dilengkapi dengan berkas `Dockerfile` dan `docker-compose.yml` resmi berbasis `node:20-alpine`:

```bash
# Jalankan container di latar belakang (background)
docker compose up -d
```

- Buka di browser: 👉 **`http://localhost:3000`**
- Data basis data (`data/db.json`, `database.sql`) dan logo sekolah otomatis disimpan di komputer host melalui *persistent volumes*.
- Untuk menghentikan container: `docker compose down`.

### 3. Menjalankan di GitHub Pages (Mode Statis / Serverless)

1. Pastikan repository Anda aktif di GitHub (`https://github.com/01dell18-gif/web-sas-dh-n-beritaacara`).
2. Masuk ke **Settings** > **Pages** di repository GitHub Anda.
3. Pada **Source**, pilih `Deploy from a branch`, lalu pilih branch `main` dan folder `/(root)`.
4. Klik **Save**. Web siap diakses di `https://01dell18-gif.github.io/web-sas-dh-n-beritaacara/`.
5. Modul `public/assets/js/github-pages-compat.js` otomatis mengaktifkan database lokal via browser storage.

---

## 🔐 Kredensial Bawaan Sistem

- **Administrator (Hak Akses Penuh: CRUD Siswa, Guru, Kelas, Mapel, User, Backup)**:
  - Username: `admin`
  - Password: `admin123`
- **Operator (Hak Akses Terbatas: Input & Cetak Dokumen Ujian, View Siswa/Guru)**:
  - Username: `operator`
  - Password: `operator123`
- Penambahan dan modifikasi akun dapat dilakukan di menu **Manajemen User** (`/admin/users.html`).

---

## 📖 Dokumentasi Lengkap & Arsitektur

Dokumentasi komprehensif mengenai arsitektur sistem, cascading update relasional, mekanisme PDF generator, dan catatan pembaruan v2.11 dapat dipelajari di:
👉 **`Teknik pembuatan.md`**

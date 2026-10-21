# PANDUAN DEPLOYMENT & PENGGUNAAN APLIKASI WEB APPS SCRIPT

Aplikasi Web **Generator Administrasi Ujian (Daftar Hadir & Berita Acara Format Resmi A4)**  
Berbasis **Google Apps Script & Google Spreadsheet Database**  
Sekolah: **SMK NEGERI FYJ CHANNEL**

---

## 🚀 1. Cara Instalasi & Deployment Cepat (Langkah demi Langkah)

### Langkah 1: Buat Google Spreadsheet Baru

1. Buka peramban dan kunjungi [Google Sheets](https://sheets.new).
2. Beri nama Spreadsheet, misalnya: `DB_ADMINISTRASI_UJIAN_SMK_FYJ`.
3. Buka menu **Ekstensi** (*Extensions*) > **Apps Script**.
4. Tab baru editor Google Apps Script akan terbuka.

---

### Langkah 2: Salin Berkas Proyek ke Editor Apps Script

Di dalam editor Apps Script, salin berkas-berkas dari folder `apps-script/` berikut:

1. **Berkas Script (`.gs`)**:
   - Beri nama berkas: `Code.gs`.
   - Salin seluruh isi dari [Code.gs](file:///d:/Downloads/Share-DKV%20F/COBA/ambil%20coba/apps-script/Code.gs).

2. **Berkas HTML Komponen Bersama (Shared Components)**:
   - Buat berkas HTML baru (klik ikon `+` > `HTML`):
     - `StyleCSS.html` (Salin dari [StyleCSS.html](file:///d:/Downloads/Share-DKV%20F/COBA/ambil%20coba/apps-script/StyleCSS.html))
     - `Header.html` (Salin dari [Header.html](file:///d:/Downloads/Share-DKV%20F/COBA/ambil%20coba/apps-script/Header.html))
     - `Sidebar.html` (Salin dari [Sidebar.html](file:///d:/Downloads/Share-DKV%20F/COBA/ambil%20coba/apps-script/Sidebar.html))
     - `AppJS.html` (Salin dari [AppJS.html](file:///d:/Downloads/Share-DKV%20F/COBA/ambil%20coba/apps-script/AppJS.html))
     - `PreviewA4CSS.html` (Salin dari [PreviewA4CSS.html](file:///d:/Downloads/Share-DKV%20F/COBA/ambil%20coba/apps-script/PreviewA4CSS.html))

3. **Berkas HTML Halaman Aplikasi**:
   - Buat berkas HTML berikut:
     - `Landing.html`
     - `Absensi.html`
     - `BeritaAcara.html`
     - `Arsip.html`
     - `Login.html`
     - `AdminDashboard.html`
     - `AdminSiswa.html`
     - `AdminGuru.html`
     - `AdminTemplate.html`
     - `AdminArsip.html`
     - `AdminPengaturan.html`
     - `AdminUsers.html`
     - `AdminDatabase.html`

4. **Berkas Konfigurasi Manifest (`appsscript.json`)**:
   - Klik menu **Setelan Proyek** (ikon roda gigi di bilah kiri Apps Script).
   - Centang opsi: **Tampilkan file manifes "appsscript.json" di editor**.
   - Kembali ke Editor Berkas, buka `appsscript.json` dan gantikan isinya dengan:

     ```json
     {
       "timeZone": "Asia/Makassar",
       "dependencies": {},
       "exceptionLogging": "STACKDRIVER",
       "runtimeVersion": "V8",
       "webapp": {
         "executeAs": "USER_DEPLOYING",
         "access": "ANYONE"
       }
     }
     ```

---

### Langkah 3: Inisialisasi Database Spreadsheet (1 Klik)

1. Pada editor Apps Script, di bagian dropdown fungsi di samping tombol **Jalankan**, pilih fungsi **`setupSpreadsheetDatabase`**.
2. Klik tombol **Jalankan** (*Run*).
3. Google akan meminta izin otorisasi pertama kali:
   - Klik **Tinjau Izin** (*Review Permissions*).
   - Pilih akun Google Anda.
   - Klik **Lanjutan** (*Advanced*) > **Buka [Nama Proyek] (tidak aman)**.
   - Klik **Izinkan** (*Allow*).
4. Periksa Google Spreadsheet Anda: seluruh 9 sheet (`Pengaturan`, `Kelas`, `Siswa`, `Guru`, `MataPelajaran`, `TahunAjaran`, `TemplateUjian`, `Users`, `ArsipDokumen`) beserta seluruh 258 siswa dan 10 guru master telah otomatis dibuat dan terisi lengkap!

---

### Langkah 4: Terapkan Sebagai Web App (Deploy)

1. Klik tombol biru **Terapkan** (*Deploy*) di kanan atas editor Apps Script.
2. Pilih **Penerapan Baru** (*New deployment*).
3. Klik ikon roda gigi di samping *Select type*, pilih **Aplikasi Web** (*Web app*).
4. Masukkan konfigurasi berikut:
   - **Deskripsi**: `Versi Rilis 1.0 - Sistem SAS SMK FYJ`
   - **Jalankan sebagai**: **Saya** (*Me* / Akun Google pemilik)
   - **Yang memiliki akses**: **Siapa saja** (*Anyone*)
5. Klik **Terapkan** (*Deploy*).
6. Salin **URL Aplikasi Web** yang diberikan (format: `https://script.google.com/macros/s/.../exec`).
7. Buka URL tersebut di browser apa pun untuk langsung menggunakan aplikasi!

---

## 🔑 2. Akun & Kredensial Bawaan

| Role | Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Akses penuh seluruh modul dan pengaturan |
| **Operator** | `operator` | `operator123` | Akses operasional (dibatasi dari menu User & Database) |

---

## 💡 3. Navigasi & Alur Penggunaan

### 1. Halaman Beranda Publik (`?page=landing`)

- Akses cepat ke Formulir Daftar Hadir, Formulir Berita Acara, Arsip Dokumen, dan Panel Admin.
- Tampilan responsif dengan identitas resmi sekolah.

### 2. Generator Daftar Hadir Ujian (`?page=absensi`)

- Pilih template ujian, tanggal, mata pelajaran, dan kelas ujian.
- Data siswa otomatis dimuat seketika dari Google Sheets (`apiGetStudents`).
- Klik **Set Semua Hadir** atau atur status per siswa (Hadir, Sakit, Izin, Dispensasi, Alfa).
- Bubuhi tanda tangan pengawas langsung di layar (Mode Digital dengan `SimpleSignaturePad`) atau pilih Mode Manual.
- Pratinjau kertas A4 di sisi kanan otomatis terbarui secara langsung (*Live Synchronized*).
- Klik **Unduh PDF & Arsipkan**: Berkas PDF resmi A4 langsung diunduh dan otomatis tersimpan ke sheet `ArsipDokumen`.
- Ekspor Rekap Absensi (.xlsx): Unduh lembar kerja rekap kehadiran siswa via SheetJS.

### 3. Generator Berita Acara Ujian (`?page=berita-acara`)

- Klik tombol **Sinkron dari Daftar Hadir**: Sistem otomatis mencocokkan arsip kehadiran berdasarkan tanggal, mapel, dan kelas yang dipilih (`apiGetAttendanceRekap`).
- Tinjau redaksi resmi pada pratinjau 2 Halaman A4.
- Bubuhi tanda tangan pengawas 1 dan 2 tanpa garis bawah atau kurung.
- Unduh PDF dan simpan otomatis ke basis data spreadsheet.
- Salin teks berita acara langsung ke clipboard.

### 4. Penelusuran Arsip Dokumen (`?page=arsip`)

- Tersedia filter horizontal: **Tahun Ajaran**, **Semester**, **Tanggal Ujian**, **Kelas**, dan **Mata Pelajaran**.
- Klik **Tinjau** untuk membuka modal lembar A4 penuh, cetak ulang langsung, atau unduh kembali berkas PDF.

### 5. Panel Administrator (`?page=dashboard`)

- **Dashboard**: Ringkasan metrik statistik real-time dan ringkasan kelas aktif.
- **Data Siswa & Kelas**: Tambah/edit siswa (otomatis mendaftarkan kelas baru jika belum ada), ekspor seluruh siswa ke Excel (.xlsx), impor massal dari Excel, dan hapus massal dengan opsi kosongkan kelas.
- **Data Guru & Pengawas**: Kelola data pengawas ujian, autocomplete NIP, ekspor dan impor Excel, serta opsi reset seluruh guru.
- **Template Ujian**: Kustomisasi redaksi berita acara menggunakan chip variabel dinamis seperti `[semester]`, `[tahun_ajaran]`, `[tanggal]`, `[mata_pelajaran]`, `[kelas]`, `[ruang]`.
- **Pengaturan Sekolah, Kelas & Kop**: Ganti nama sekolah, upload logo resmi sekolah, upload kop surat resmi, reset ke default, kelola master mapel serta tahun ajaran, dan atur folder penyimpanan Google Drive untuk upload file SAS.
- **Manajemen User**: Tambah akun admin atau operator dengan proteksi akun utama superadmin.
- **Backup & Database**:
  - Unduh dump database SQL (`database.sql`) siap pakai untuk MySQL/MariaDB.
  - Buka langsung lembar kerja Google Spreadsheet database aktif di tab baru.
  - Unduh langsung `Data_Siswa.xlsx` dan `Data_Guru.xlsx`.
  - Unduh backup JSON database lengkap (`db.json`).
  - Reset basis data ke kondisi awal seeder resmi dengan 1 klik (`apiResetDatabase`).

---

## 📂 4. Integrasi Penyimpanan Berkas Google Drive

Seluruh berkas dokumen atau arsip yang diunggah diarahkan ke folder Google Drive resmi:

- **URL Bawaan Folder**: `https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR`
- **ID Folder**: `19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR`

### Cara Mengganti Folder Penyimpanan di Masa Depan:
1. Masuk ke panel admin melalui menu **Login** (`admin` / `admin123`).
2. Masuk ke menu **Pengaturan** (`?page=pengaturan`).
3. Pada bagian **Folder Google Drive (Penyimpanan File SAS)**, masukkan URL atau ID folder Google Drive yang baru.
4. Klik tombol **Uji Akses Folder Drive** untuk memastikan izin baca/tulis akun telah valid.
5. Klik **Buka Folder di Google Drive** untuk memverifikasi folder di tab baru.
6. Klik tombol **Perbarui Pengaturan** di bawah untuk menyimpan perubahan secara permanen ke sheet `Pengaturan` di Google Spreadsheet.

> **Catatan Hak Akses Folder Drive**: Pastikan folder Google Drive telah diatur hak aksesnya menjadi *"Siapa saja yang memiliki link dapat melihat/mengedit"* (*Anyone with link*) atau akun Google yang men-deploy Web Apps memiliki izin akses Editor pada folder tersebut.

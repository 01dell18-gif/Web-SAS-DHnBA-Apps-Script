# PANDUAN DEPLOYMENT & DOKUMENTASI LENGKAP SISTEM SAS APPS SCRIPT

Aplikasi Web **Generator Administrasi Ujian (Daftar Hadir & Berita Acara Format Resmi A4)**  
Berbasis **Google Apps Script & Google Spreadsheet Database**  
Sekolah: **SMK NEGERI FYJ CHANNEL**

---

## ⚡ 1. Arsitektur Performa & Pengambilan Data Cepat (*High-Speed Database Architecture*)

Untuk mengatasi keterbatasan latensi bawaan Google Apps Script (*container spin-up latency*), sistem telah dilengkapi dengan arsitektur optimasi data bertingkat:

1. **Server-Side Script Cache (`CacheService.getScriptCache()`)**:
   - Membaca data master (Kelas, Guru, Mata Pelajaran, Tahun Ajaran, Pengaturan, Template) dalam waktu **< 10 milidetik** langsung dari cache memori Google Cloud tanpa harus membuka Spreadsheet API berulang-ulang.
   - Cache otomatis diinvalidasi (*auto-invalidated*) secara atomik setiap kali terjadi mutasi data (tambah, edit, hapus, simpan, atau reset).
2. **In-Memory Request Memoization (`_requestTableCache` & `_cachedSpreadsheet`)**:
   - Mencegah pembacaan lembar kerja berulang dalam satu siklus eksekusi Google Apps Script.
3. **Penyatuan Panggilan Server Tunggal (*Single-Trip RPC Consolidation*)**:
   - `apiGetInitialData()` mengembalikan seluruh 9 entitas (`settings`, `classes`, `templates`, `subjects`, `academic_years`, `teachers`, `students`, `archives`, `users`) dalam **1 kali request**.
   - Menghilangkan *waterfall latency* (dari 4-8 detik menjadi ~1 detik).
4. **Client-Side Student Caching**:
   - Pada halaman **Daftar Hadir (`Absensi.html`)**, pergantian kelas berlangsung **seketika (0 ms)** karena daftar siswa telah tersimpan di memori peramban tanpa memicu panggilan jaringan baru.
5. **Dashboard Fast-Load**:
   - Metrik statistik dan tabel ringkasan kelas dimuat bersamaan dalam 1 kali request ke `apiGetDatabaseStats`.

---

## 🧭 2. Peta Tombol, Fungsi & Lokasi Penyimpanan Data di Database

Berikut adalah rekapitulasi seluruh tombol aksi di aplikasi, fungsinya, dan lembar kerja (*sheet*) tempat data disimpan secara permanen di Google Spreadsheet:

| Halaman | Tombol / Aksi | Fungsi & Perilaku | Lokasi Penyimpanan di Spreadsheet |
| :--- | :--- | :--- | :--- |
| **Daftar Hadir** (`Absensi`) | **Unduh PDF & Arsipkan** | Mengunduh lembar A4 dan menyimpan log dokumen ujian | Sheet `ArsipDokumen` (`SHEET_NAMES.ARCHIVES`) |
| **Daftar Hadir** (`Absensi`) | **Set Semua Hadir** | Mengubah status semua siswa menjadi Hadir seketika | Memori Formulir & Pratinjau Langsung |
| **Daftar Hadir** (`Absensi`) | **Ekspor Rekap Absensi** | Mengunduh berkas Excel (.xlsx) rekap presensi siswa | Berkas Lokal Pengguna (.xlsx) |
| **Daftar Hadir** (`Absensi`) | **Tanda Tangan Pengawas** | Tanda tangan digital atau mode manual di lembar A4 | Disimpan dalam arsip HTML di `ArsipDokumen` |
| **Berita Acara** (`BeritaAcara`) | **Sinkron dari Daftar Hadir** | Menarik otomatis rekap peserta dari arsip daftar hadir | Membaca dari Sheet `ArsipDokumen` |
| **Berita Acara** (`BeritaAcara`) | **Unduh PDF & Arsipkan** | Mengunduh Berita Acara A4 dan menyimpan arsip | Sheet `ArsipDokumen` (`SHEET_NAMES.ARCHIVES`) |
| **Berita Acara** (`BeritaAcara`) | **Unggah Foto Pelaksanaan** | Memasukkan foto bukti dokumentasi ujian ke lembar A4 | Disimpan dalam HTML base64 di `ArsipDokumen` |
| **Berita Acara** (`BeritaAcara`) | **Salin Teks Berita Acara** | Menyalin redaksi Berita Acara ke clipboard | Clipboard Peramban |
| **Dashboard** (`AdminDashboard`) | **Lihat Siswa** | Berpindah ke menu Siswa & memfilter kelas terpilih | Filter dinamis data Sheet `Siswa` |
| **Master Siswa** (`AdminSiswa`) | **Tambah Siswa** | Menambahkan peserta didik baru (auto-create kelas) | Sheet `Siswa` (`SHEET_NAMES.STUDENTS`) & `Kelas` |
| **Master Siswa** (`AdminSiswa`) | **Edit Siswa** | Memperbarui NIS, nama, atau kelas peserta didik | Sheet `Siswa` (`SHEET_NAMES.STUDENTS`) |
| **Master Siswa** (`AdminSiswa`) | **Hapus Siswa** | Menghapus 1 peserta didik secara permanen | Sheet `Siswa` (`SHEET_NAMES.STUDENTS`) |
| **Master Siswa** (`AdminSiswa`) | **Hapus Kelas & Siswa** | Menghapus seluruh siswa dalam kelas tertentu | Sheet `Siswa` & Sheet `Kelas` |
| **Master Siswa** (`AdminSiswa`) | **Ekspor / Impor Excel** | Backup & upload massal siswa dari/ke berkas Excel | Sheet `Siswa` & Sheet `Kelas` |
| **Master Guru** (`AdminGuru`) | **Tambah / Edit Guru** | Menambah atau mengubah data guru, NIP, & mapel | Sheet `Guru` (`SHEET_NAMES.TEACHERS`) |
| **Master Guru** (`AdminGuru`) | **Hapus Guru / Hapus Semua** | Menghapus data guru satuan atau massal | Sheet `Guru` (`SHEET_NAMES.TEACHERS`) |
| **Master Guru** (`AdminGuru`) | **Ekspor / Impor / Template** | Backup, template resmi, dan impor guru via Excel | Sheet `Guru` (`SHEET_NAMES.TEACHERS`) |
| **Template Ujian** (`AdminTemplate`) | **Simpan Perubahan (Update)** | Memperbarui redaksi Berita Acara template aktif | Sheet `TemplateUjian` (`SHEET_NAMES.TEMPLATES`) |
| **Template Ujian** (`AdminTemplate`) | **Simpan Template Baru** | Menyimpan template ujian baru ke basis data | Sheet `TemplateUjian` (`SHEET_NAMES.TEMPLATES`) |
| **Template Ujian** (`AdminTemplate`) | **Aktifkan Template** | Menjadikan template default di Daftar Hadir & BA | Sheet `TemplateUjian` & Sheet `Pengaturan` |
| **Template Ujian** (`AdminTemplate`) | **Hapus Template** | Menghapus template ujian dari daftar | Sheet `TemplateUjian` (`SHEET_NAMES.TEMPLATES`) |
| **Pengaturan** (`AdminPengaturan`) | **Textarea Mata Pelajaran** | Input mapel 1 baris per mapel dengan badge jumlah | Sheet `MataPelajaran` & Sheet `Pengaturan` |
| **Pengaturan** (`AdminPengaturan`) | **Textarea Tahun Ajaran** | Input tahun ajaran 1 baris per tahun | Sheet `TahunAjaran` & Sheet `Pengaturan` |
| **Pengaturan** (`AdminPengaturan`) | **Perbarui Pengaturan** | Menyimpan seluruh identitas, mapel, tahun, & kelas | Sheet `Pengaturan`, `MataPelajaran`, `TahunAjaran` |
| **Pengaturan** (`AdminPengaturan`) | **Reset Logo ke Bawaan** | Mengembalikan logo sekolah ke standar default resmi | Sheet `Pengaturan` & Script Properties |
| **Pengaturan** (`AdminPengaturan`) | **Reset Kop ke Bawaan** | Mengembalikan kop surat ke standar default resmi | Sheet `Pengaturan` & Script Properties |
| **Arsip Admin** (`AdminArsip`) | **Hapus Arsip Dokumen** | Menghapus arsip (otomatis menghapus berkas kembar) | Sheet `ArsipDokumen` (`SHEET_NAMES.ARCHIVES`) |
| **User Admin** (`AdminUsers`) | **Tambah / Edit / Hapus User** | Mengelola kredensial akun admin & operator | Sheet `Users` (`SHEET_NAMES.USERS`) |
| **Database** (`AdminDatabase`) | **Unduh SQL / JSON Dump** | Backup cadangan database mandiri | Berkas Lokal Pengguna (.sql / .json) |
| **Database** (`AdminDatabase`) | **Reset ke Standar Awal** | Mengosongkan dan mengisi ulang seluruh tabel | 9 Sheet di Google Spreadsheet |

---

## 🚀 3. Panduan Deployment Cepat

### Langkah 1: Buat Google Spreadsheet Baru (Database Aktif)
1. Kunjungi [Google Sheets](https://sheets.new).
2. Beri nama: `DB_ADMINISTRASI_UJIAN_SMK_FYJ`.
3. Buka menu **Ekstensi** (*Extensions*) > **Apps Script**.
4. *Script otomatis mendeteksi spreadsheet yang aktif tanpa perlu input ID Spreadsheet manual.*

### Langkah 2: Salin Berkas Proyek
Salin seluruh berkas ke editor Apps Script:
- `Code.gs` (Server script)
- `StyleCSS.html`, `Header.html`, `Sidebar.html`, `AppJS.html`, `PreviewA4CSS.html` (Komponen bersama)
- `Index.html`, `Absensi.html`, `BeritaAcara.html`, `Arsip.html`, `Login.html` (Publik)
- `AdminDashboard.html`, `AdminSiswa.html`, `AdminGuru.html`, `AdminTemplate.html`, `AdminArsip.html`, `AdminPengaturan.html`, `AdminUsers.html`, `AdminDatabase.html` (Panel Admin)
- `appsscript.json` (Setelan manifes: timezone `Asia/Makassar`, akses webapp `ANYONE`).

### Langkah 3: Jalankan Inisialisasi Data Awal (*Seeder*)
1. Pada toolbar atas Apps Script, pilih fungsi **`jalankanIsiDataAwal`** (atau `setupSpreadsheetDatabase`).
2. Klik tombol **Jalankan** (*Run*).
3. Setujui dialog izin otorisasi Google (*Review Permissions* > Akun Google > *Advanced* > *Allow*).
4. Sembilan (9) sheet basis data beserta data awal akan otomatis terbuat.

### Langkah 4: Terapkan Sebagai Aplikasi Web (*Web App Deployment*)
1. Klik **Terapkan** (*Deploy*) > **Penerapan Baru** (*New deployment*).
2. Pilih jenis **Aplikasi Web** (*Web app*).
3. Konfigurasi wajib:
   - **Jalankan sebagai** (*Execute as*): **Saya** (*Me* / Pemilik Google Sheet).
   - **Yang memiliki akses** (*Who has access*): **Siapa saja** (*Anyone*).
4. Klik **Terapkan** dan salin URL Web App yang dihasilkan.

---

## 🔑 4. Akun & Kredensial Bawaan
- **Super Admin**: Username `admin` / Password `admin123`
- **Operator**: Username `guru` atau `operator` / Password `guru123` atau `operator123`

---

## 🖼️ 5. Aset Bawaan (Default Assets)
- **Logo Sekolah**: `https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI`
- **Kop Surat**: `https://drive.google.com/thumbnail?id=1Z80pVGJv9v-GFwjE1_kBi_G9uRlR2gN7`
- **Folder Google Drive**: `https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR` (ID: `19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR`)

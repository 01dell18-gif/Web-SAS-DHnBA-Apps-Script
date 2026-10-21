# Generator Absensi & Berita Acara Ujian Resmi Format A4

## SMK NEGERI FYJ CHANNEL (Google Apps Script & Google Sheets Database)

Aplikasi Web Administrasi Ujian Resmi berbasis Cloud Serverless menggunakan **Google Apps Script** dan **Google Spreadsheet** sebagai basis data relasional.

---

## 🌟 Fitur Utama

1. **Multi-Page Web App Google Apps Script**:
   - Beranda Publik (`?page=index` / root)
   - Generator Daftar Hadir Ujian Resmi A4 (`?page=absensi`)
   - Generator Berita Acara Ujian Resmi A4 (`?page=berita-acara`)
   - Arsip Dokumen Publik (`?page=arsip`)
   - Panel Administrator & Login (`?page=login`, `?page=dashboard`)
   - Master Data Siswa & Kelas (`?page=siswa`)
   - Master Data Guru & Pengawas (`?page=guru`)
   - Manajemen Template Redaksi Berita Acara (`?page=template`)
   - Pengarsipan Dokumen Admin (`?page=admin-arsip`)
   - Pengaturan Sekolah, Logo & Kop Surat (`?page=pengaturan`)
   - Manajemen Pengguna & Hak Akses RBAC (`?page=users`)
   - Backup & Manajemen Basis Data (`?page=database`)

2. **Basis Data Google Spreadsheet Relasional (9 Sheet)**:
   - `Pengaturan`: Identitas sekolah, logo base64, kop surat base64, semester & tahun ajaran aktif.
   - `Kelas`: Master daftar kelas, tingkat, dan program keahlian.
   - `Siswa`: Data peserta didik dengan relasi `class_id`.
   - `Guru`: Data dewan guru & pengawas ujian beserta NIP dan jabatan.
   - `MataPelajaran`: Daftar mata pelajaran resmi.
   - `TahunAjaran`: Daftar tahun akademik.
   - `TemplateUjian`: Format redaksi berita acara dinamis dengan chip variabel.
   - `ArsipDokumen`: Riwayat dokumen cetak PDF dan salinan HTML.
   - `Users`: Autentikasi dan otorisasi bertingkat (`admin` dan `operator`).

3. **Dokumentasi Lengkap**:
   - [Skema Basis Data Spreadsheet](apps-script/SKEMA_DATABASE_SPREADSHEET.md)
   - [Panduan Deployment Web App](apps-script/README_DEPLOY.md)

---

## 🚀 Panduan Singkat Deployment

1. Buat Google Spreadsheet baru di [Google Sheets](https://sheets.new).
2. Buka **Ekstensi** > **Apps Script**.
3. Salin seluruh berkas dari folder [`apps-script/`](apps-script/) ke editor Apps Script.
4. Buka `appsscript.json`, pastikan zona waktu `Asia/Makassar` dan akses webapp aktif.
5. Jalankan fungsi `setupSpreadsheetDatabase` sekali untuk inisialisasi 9 sheet dan data seeder otomatis.
6. Klik **Terapkan** (*Deploy*) > **Penerapan Baru** (*New Deployment*) > **Aplikasi Web** (*Web App*) > Akses: **Siapa saja** (*Anyone*).
7. Aplikasi siap digunakan secara daring!

---

© 2026 SMK NEGERI FYJ CHANNEL — Generator Administrasi Ujian Resmi Format A4.

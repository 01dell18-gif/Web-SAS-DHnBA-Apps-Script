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

2. **Performa Tinggi & Pengambilan Data Super Cepat**:
   - **Google Apps Script CacheService**: Cache memori script (`< 10ms`) untuk seluruh master data.
   - **Single-Trip Initial RPC**: Penyatuan pemanggilan 9 entitas database menjadi 1 request (`apiGetInitialData`).
   - **Client-Side Student Caching**: Pergantian kelas dan pemfilteran siswa berlangsung instan (0 ms).
   - **Dashboard Fast-Load**: Pemuatan statistik database dan ringkasan kelas dalam 1 panggilan tunggal.

3. **Master Input Textarea Fleksibel**:
   - Master Daftar Mata Pelajaran Resmi berbasis Textarea (1 baris per mapel dengan badge hitungan dan pembersihan spasi).
   - Master Daftar Tahun Ajaran resmi berbasis Textarea (1 baris per tahun ajaran).
   - Sinkronisasi instan ke Google Sheets saat mengklik tombol **Perbarui Pengaturan**.

4. **Basis Data Google Spreadsheet Relasional (9 Sheet)**:
   - `Pengaturan`: Identitas sekolah, logo default/upload, kop surat default/upload, semester & tahun ajaran aktif, folder Google Drive.
   - `Kelas`: Master daftar kelas, tingkat, dan program keahlian.
   - `Siswa`: Data peserta didik dengan relasi `class_id`.
   - `Guru`: Data dewan guru & pengawas ujian beserta NIP dan jabatan.
   - `MataPelajaran`: Daftar mata pelajaran resmi.
   - `TahunAjaran`: Daftar tahun akademik.
   - `TemplateUjian`: Format redaksi berita acara dinamis dengan chip variabel.
   - `ArsipDokumen`: Riwayat dokumen cetak PDF dan salinan HTML.
   - `Users`: Autentikasi dan otorisasi bertingkat (`admin` dan `operator`).

5. **Dokumentasi Lengkap**:
   - [Skema Basis Data Spreadsheet](SKEMA_DATABASE_SPREADSHEET.md)
   - [Panduan Deployment & Pemetaan Tombol](README_DEPLOY.md)

---

## 🚀 Panduan Singkat Deployment

1. Buat Google Spreadsheet baru di [Google Sheets](https://sheets.new).
2. Buka **Ekstensi** > **Apps Script**.
3. Salin seluruh berkas proyek ke editor Apps Script.
4. Buka `appsscript.json`, pastikan zona waktu `Asia/Makassar` dan akses webapp aktif (`ANYONE`).
5. Jalankan fungsi `jalankanIsiDataAwal` (atau `setupSpreadsheetDatabase`) sekali untuk inisialisasi 9 sheet dan data seeder otomatis.
6. Klik **Terapkan** (*Deploy*) > **Penerapan Baru** (*New Deployment*) > **Aplikasi Web** (*Web App*) > Akses: **Siapa saja** (*Anyone*).
7. Buka URL Web App untuk menggunakan aplikasi!

---

© 2026 SMK NEGERI FYJ CHANNEL — Generator Administrasi Ujian Resmi Format A4.

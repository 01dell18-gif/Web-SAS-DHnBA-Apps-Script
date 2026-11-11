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

## 🚀 3. Panduan Penerapan di Database & Akun Baru (Deployment Guide)

Berikut adalah panduan langkah-demi-langkah jika Anda ingin menerapkan sistem ini ke Google Spreadsheet / Akun Google / Sekolah baru:

### Langkah 1: Siapkan Spreadsheet Database Baru
1. Kunjungi [Google Sheets](https://sheets.new) untuk membuat spreadsheet kosong baru.
2. Beri nama file spreadsheet, misalnya: `DB_ADMINISTRASI_UJIAN_SMK_BARU`.
3. Salin **ID Spreadsheet** dari kolom URL browser Anda:
   ```text
   https://docs.google.com/spreadsheets/d/[SALIN_KODE_ID_DISINI]/edit
   ```
4. Buka file `Code.gs` di baris 9, lalu ganti nilai `TARGET_SPREADSHEET_ID`:
   ```javascript
   var TARGET_SPREADSHEET_ID = 'TEMPELKAN_ID_SPREADSHEET_BARU_DI_SINI';
   ```
   *(Catatan: Jika script dibuat langsung di dalam menu Ekstensi > Apps Script spreadsheet tersebut (container-bound), Anda juga dapat mengosongkan nilai ini `var TARGET_SPREADSHEET_ID = '';` karena sistem otomatis mendeteksi sheet aktif).*

---

### Langkah 2: Cara Memasukkan Seluruh Berkas Kode ke Apps Script Baru

Proyek ini terdiri dari **28 berkas** (`Code.gs`, `appsscript.json`, dan 26 berkas template `.html`). Untuk memasukkan seluruh berkas ke proyek Apps Script baru secara efisien, Anda dapat memilih salah satu dari **3 Cara** berikut:

#### ⚡ Opsi A (Paling Cepat & Direkomendasikan): Menggunakan Google Clasp CLI
Hanya butuh 1 baris perintah untuk mengunggah ke-28 file secara instan dan otomatis tanpa perlu membuat file satu per satu.

1. **Aktifkan Google Apps Script API**:
   - Buka browser dan login ke Google: [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings)
   - Pastikan opsi **Google Apps Script API** disetel ke posisi **ON (Aktif)**.
2. **Ambil Script ID Apps Script Baru Anda**:
   - Buka proyek Google Apps Script baru di browser.
   - Klik menu **Setelan Proyek (Project Settings)** (ikon roda gigi di bilah navigasi kiri).
   - Di bagian *ID Script (Script ID)*, klik tombol **Salin (Copy)**.
3. **Hubungkan ID ke File `.clasp.json`**:
   - Buka file `.clasp.json` yang ada di folder proyek ini di komputer Anda, lalu ganti `scriptId`:
     ```json
     {
       "scriptId": "TEMPELKAN_SCRIPT_ID_BARU_ANDA_DI_SINI",
       "rootDir": "."
     }
     ```
4. **Login & Unggah Seluruh File**:
   - Buka terminal / PowerShell di folder proyek ini:
     ```bash
     # 1. Login akun Google (hanya perlu jika belum pernah login clasp)
     npx @google/clasp login

     # 2. Upload seluruh 28 berkas secara otomatis
     npx @google/clasp push --force
     ```
   - *Selesai! Buka / refresh halaman Apps Script di browser, seluruh 28 file langsung muncul lengkap dan rapi.*

---

#### 🌐 Opsi B (Semi-Otomatis): Menggunakan Ekstensi Chrome "Google Apps Script GitHub Assistant"
Cocok jika Anda ingin mengimpor langsung dari repositori GitHub tanpa menggunakan terminal/Node.js.

1. Pasang ekstensi **Google Apps Script GitHub Assistant** dari Chrome Web Store.
2. Buka editor Google Apps Script baru Anda di Chrome.
3. Pada bilah atas editor, akan muncul menu integrasi GitHub:
   - Hubungkan akun GitHub Anda.
   - Masukkan nama repositori proyek ini: `01dell18-gif/Web-SAS-DHnBA-Apps-Script` (branch `main`).
4. Klik tombol **Pull**. Seluruh 28 berkas akan langsung terimpor otomatis ke Apps Script Anda.

---

#### 📋 Opsi C (Manual): Salin Tempel Lewat Editor Google Apps Script
Jika tidak menggunakan alat bantu terminal atau ekstensi:

1. Buka editor Apps Script baru di browser Anda.
2. Tampilkan file manifes:
   - Buka **Setelan Proyek (Project Settings)** > centang pilihan **"Perlihatkan file manifes 'appsscript.json' di editor"**.
   - Kembali ke tab Editor, buka file `appsscript.json`, lalu timpa isinya dengan isi file `appsscript.json` proyek ini.
3. Buka file `Code.gs` bawaan, lalu salin dan tempel seluruh isi `Code.gs`.
4. Untuk berkas `.html`, klik tombol **+ (Tambah file)** di bilah kiri > pilih **HTML**:
   - Ketikkan nama file persis sama **tanpa ekstensi `.html`** (misalnya cukup ketik: `Index`, `Absensi`, `BeritaAcara`, `StyleCSS`, `Header`, `Sidebar`, dll).
   - Tempelkan kode HTML yang bersesuaian ke dalam file tersebut.
   - Ulangi untuk seluruh 26 file HTML pendukung.

---

---

### Langkah 3: Inisialisasi Database Otomatis (Seeder)
1. Pada editor Apps Script, di dropdown fungsi bagian atas, pilih fungsi **`setupSpreadsheetDatabase`** (atau `jalankanIsiDataAwal`).
2. Klik tombol **Jalankan (Run)**.
3. Saat muncul kotak dialog izin otorisasi Google, pilih **Review Permissions** > pilih Akun Google Anda > klik **Advanced** (*Lanjutan*) > klik **Go to [Nama Proyek] (unsafe)** > klik **Allow (Izinkan)**.
4. Tunggu beberapa detik hingga proses selesai. Sistem akan otomatis:
   - Membuat 9 tabel/sheet lengkap beserta format header tebal (*bold*).
   - Mengisi data awal default (10 siswa dummy, 10 guru dummy, 10 mapel dummy, template ujian resmi, dan setelan dasar sekolah).

---

### Langkah 4: Terapkan Sebagai Aplikasi Web (Deploy Web App)
1. Di pojok kanan atas Apps Script, klik tombol biru **Terapkan (Deploy)** > pilih **Penerapan baru (New deployment)**.
2. Klik ikon roda gigi (*gear*) di sebelah "Pilih jenis" > pilih **Aplikasi Web (Web App)**.
3. Atur konfigurasi penting berikut:
   - **Deskripsi**: misal `Versi 1.0 Produksi`
   - **Jalankan sebagai (*Execute as*)**: **Saya (*Me*)** *(PENTING: agar sistem membaca/menulis database menggunakan izin pemilik tanpa meminta login akun google pengguna umum)*.
   - **Yang memiliki akses (*Who has access*)**: **Siapa saja (*Anyone*)** *(PENTING: agar guru/siswa/pengawas dapat mengakses formulir publik tanpa error otorisasi)*.
4. Klik **Terapkan (Deploy)**.
5. Salin tautan **URL Aplikasi Web** yang berakhiran `/exec`. Contoh:
   ```text
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

### Langkah 5: Sesuaikan Fallback URL di `Code.gs`
Di dalam fungsi `getAppUrl()` pada file `Code.gs` (sekitar baris 268):
```javascript
function getAppUrl() {
  try {
    var url = ScriptApp.getService().getUrl();
    if (url && url.length > 0) {
      return url;
    }
  } catch (e) {
    Logger.log('Tidak dapat mengambil URL via ScriptApp: ' + e.message);
  }

  // Fallback: URL deployment standar project
  return 'https://script.google.com/macros/s/AKfycb.../exec';
}
```
1. **Fungsi kode**: Baris `ScriptApp.getService().getUrl()` secara cerdas mendeteksi URL aktif tempat user membuka web. Sedangkan baris `return 'https://...'` adalah *fallback* (jaring pengaman cadangan) jika fungsi dijalankan langsung dari console/editor tanpa konteks request browser.
2. **Cara memperbarui**: Tempelkan URL Web App hasil Langkah 4 ke dalam string return fallback tersebut.
3. Setelah memperbarui baris tersebut, simpan file `Code.gs`.

---

### 💡 Tips Pembaruan Kode Selanjutnya (Kelola Penerapan)
Jika di masa depan Anda melakukan revisi/perubahan kode:
- **JANGAN** membuat *New Deployment* baru (karena URL web akan berubah dan Anda harus membagikan link baru lagi ke pengguna).
- Cukup gunakan menu: **Terapkan (Deploy)** > **Kelola penerapan (Manage deployments)** > klik ikon **Pensil (Edit)** pada deployment aktif > di bagian *Versi* pilih **Versi baru (New version)** > klik **Terapkan**.
- Dengan cara ini, link web yang sudah dibagikan ke seluruh guru dan pengawas **tetap sama dan tidak akan pernah berubah**.

---

## 🔑 4. Akun & Kredensial Bawaan

- **Super Admin**: Username `admin` / Password `admin123`
- **Operator**: Username `guru` atau `operator` / Password `guru123` atau `operator123`

---

## 🖼️ 5. Aset Bawaan (Default Assets)

- **Logo Sekolah**: `https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI`
- **Kop Surat**: `https://drive.google.com/thumbnail?id=1Z80pVGJv9v-GFwjE1_kBi_G9uRlR2gN7`
- **Folder Google Drive**: `https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR` (ID: `19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR`)

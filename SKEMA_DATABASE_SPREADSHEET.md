# SKEMA BASIS DATA GOOGLE SPREADSHEET (DATABASE SAS)

Dokumentasi rancangan relasional 9 Sheet/Tabel di Google Sheets untuk aplikasi **Generator Administrasi Ujian (Daftar Hadir & Berita Acara)** — **SMK NEGERI FYJ CHANNEL**.

---

## 🗄️ 1. Gambaran Umum Arsitektur Basis Data

Google Spreadsheet difungsikan sebagai basis data relasional serverless:

- **Sheet sebagai Tabel**: Masing-masing sheet bertindak sebagai tabel data independen.
- **Baris 1 sebagai Nama Kolom (Header)**.
- **Baris 2 ke Bawah sebagai Baris Data (Records)**.
- **Auto-Initialization**: Fungsi `setupSpreadsheetDatabase()` dan `jalankanIsiDataAwal()` di [Code.gs](file:///d:/Downloads/Share-DKV%20F/COBA/ambil%20coba/Code.gs) otomatis membuat sheet yang belum ada, menyusun header tebal, membekukan baris pertama (*frozen header*), dan mengisi data awal (*seeder*) secara instan.
- **Lapis Akses Cepat (*High-Speed Caching Layer*)**:
  - `CacheService.getScriptCache()`: Menyimpan cache memori tabel per-sheet selama 30 menit untuk waktu baca **< 10 milidetik**.
  - `_requestTableCache`: Mencegah pembacaan berulang dalam 1 siklus eksekusi Apps Script.
  - `apiGetInitialData()`: Menyatukan pembacaan 9 entitas menjadi **1 kali round-trip**, mengeliminasi *network waterfall delay*.
- **Universal Save Handler**: Fungsi `apiSaveDatabase(payload)` melayani penyimpanan atomik dan pembaruan massal (*bulk sync*) langsung ke Google Sheets dengan proteksi tabel agar tidak terhapus secara tidak sengaja.

```mermaid
erDiagram
    Kelas ||--o{ Siswa : "memiliki (class_id)"
    Kelas ||--o{ ArsipDokumen : "direferensikan (class_id / nama_kelas)"
    Guru ||--o{ ArsipDokumen : "pengawas_1 / pengawas_2"
    Guru ||--o{ Users : "referensi nama user"
    TemplateUjian ||--o{ ArsipDokumen : "format redaksi ujian"
    Pengaturan ||--|| TemplateUjian : "active_template_id"
    MataPelajaran ||--o{ ArsipDokumen : "mata_pelajaran"
    TahunAjaran ||--o{ ArsipDokumen : "tahun_ajaran"

    Kelas {
        int id PK
        string nama_kelas
        string tingkat
        string program_keahlian
        int is_active
    }

    Siswa {
        int id PK
        int class_id FK
        string nis
        string nama
    }

    Guru {
        int id PK
        string nama
        string nip
        string mapel
        string jabatan
        int is_active
    }

    MataPelajaran {
        int id PK
        string nama_mapel
    }

    TahunAjaran {
        int id PK
        string tahun_ajaran
    }

    TemplateUjian {
        int id PK
        string nama_ujian
        string tahun_ajaran
        string semester
        string judul_berita_acara
        string redaksi_isi
        string redaksi_pembuka
        string redaksi_poin_1
        string redaksi_poin_2
        string label_catatan
        int aktif
    }

    ArsipDokumen {
        int id PK
        string type
        string title
        string filename
        string nama_ujian
        string tahun_ajaran
        string semester
        string tanggal_ujian
        string mata_pelajaran
        string nama_kelas
        int class_id FK
        string ruang
        int peserta_seharusnya
        int peserta_hadir
        int peserta_tidak_hadir
        string siswa_tidak_hadir
        string nama_pengawas_1
        string nip_pengawas_1
        string nama_pengawas_2
        string nip_pengawas_2
        string html_content
        string created_at
    }

    Users {
        int id PK
        string username
        string password
        string nama
        string role
        string created_at
    }

    Pengaturan {
        string key PK
        string value
    }
```

---

## 📋 2. Rincian 9 Sheet Database

### 1. Sheet `Pengaturan`

Menyimpan konfigurasi identitas sekolah, logo, kop surat, semester, dan tahun ajaran aktif.

| Kolom | Tipe Data | Keterangan | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| `key` | String (PK) | Kunci konfigurasi unik | `school_name` |
| `value` | String / JSON | Nilai konfigurasi / string base64 / JSON array | `SMK NEGERI FYJ CHANNEL` |

**Daftar Kunci Bawaan:**

- `school_name`: Nama resmi sekolah (`SMK NEGERI FYJ CHANNEL`).
- `school_tagline`: Tagline sekolah (`Generator Administrasi Ujian`).
- `school_logo`: String URL Thumbnail / Base64 logo resmi sekolah (`https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI`).
- `kop_header`: String URL Thumbnail / Base64 gambar kop surat resmi sekolah (`https://drive.google.com/thumbnail?id=1Z80pVGJv9v-GFwjE1_kBi_G9uRlR2gN7`).
- `academic_year`: Tahun ajaran aktif (`2026/2027`).
- `default_semester`: Semester aktif (`Ganjil` / `Genap`).
- `timezone`: Zona waktu (`WITA`, `WIB`, atau `WIT`).
- `active_template_id`: ID template berita acara yang sedang aktif.
- `drive_folder_url`: URL folder Google Drive resmi untuk penyimpanan SAS (`https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR`).
- `drive_folder_id`: ID unik folder Google Drive (`19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR`).

---

### 2. Sheet `Kelas`

Master daftar kelas resmi beserta program keahlian dan tingkat pendidikan.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Auto-increment ID kelas |
| `nama_kelas` | String | Nama kelas resmi (contoh: `XII TKJ`, `XII DKV`) |
| `tingkat` | String | Tingkat kelas (`X`, `XI`, `XII`) |
| `program_keahlian` | String | Nama Program / Konsentrasi Keahlian |
| `is_active` | Integer | Status keaktifan kelas (`1` = Aktif, `0` = Nonaktif) |

---

### 3. Sheet `Siswa`

Master data peserta didik yang terdaftar per kelas.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Auto-increment ID siswa |
| `class_id` | Integer (FK) | Relasi ke kolom `id` pada sheet `Kelas` |
| `nis` | String | Nomor Induk Siswa (NIS) |
| `nama` | String | Nama lengkap peserta didik |

---

### 4. Sheet `Guru`

Master data dewan guru dan pengawas ujian sekolah.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Auto-increment ID guru |
| `nama` | String | Nama lengkap beserta gelar akademik |
| `nip` | String | Nomor Induk Pegawai (NIP) / NUPTK |
| `mapel` | String | Mata pelajaran utama yang diampu |
| `jabatan` | String | Peran / Jabatan (contoh: `Guru / Pengawas Ujian`) |
| `is_active` | Integer | Status aktif (`1` = Aktif) |

---

### 5. Sheet `MataPelajaran`

Daftar mata pelajaran resmi yang diujikan di sekolah. Dikelola melalui **Textarea** di menu Pengaturan Sekolah (satu baris untuk setiap mapel).

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Auto-increment ID mapel |
| `nama_mapel` | String | Nama mata pelajaran resmi |

---

### 6. Sheet `TahunAjaran`

Daftar tahun ajaran akademik yang tersedia. Dikelola melalui **Textarea** di menu Pengaturan Sekolah (satu baris untuk setiap tahun, contoh: `2026/2027`).

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Auto-increment ID tahun ajaran |
| `tahun_ajaran` | String | Periode tahun ajaran (contoh: `2026/2027`) |

---

### 7. Sheet `TemplateUjian`

Template redaksi format Berita Acara Ujian.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Integer (PK) | ID template ujian |
| `nama_ujian` | String | Nama jenis ujian (contoh: `Sumatif Akhir Semester (SAS) Ganjil`) |
| `tahun_ajaran` | String | Periode tahun ajaran |
| `semester` | String | Semester (`Ganjil` / `Genap`) |
| `judul_berita_acara` | String | Judul dokumen berita acara |
| `redaksi_isi` | String (HTML) | Redaksi isi lengkap dengan chip variabel dinamis |
| `redaksi_pembuka` | String | Redaksi kalimat pembuka berita acara |
| `redaksi_poin_1` | String | Redaksi butir rekap peserta hadir/tidak hadir |
| `redaksi_poin_2` | String | Redaksi butir catatan khusus pelaksanaan ujian |
| `label_catatan` | String | Label catatan kejadian khusus |
| `aktif` | Integer | Status template aktif (`1` = Aktif, `0` = Tidak) |

---

### 8. Sheet `ArsipDokumen`

Penyimpanan riwayat dokumen yang telah dicetak atau diunduh sebagai PDF resmi.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Timestamp unik berkas arsip |
| `type` | String | Jenis dokumen (`daftar_hadir` atau `berita_acara`) |
| `title` | String | Judul dokumen |
| `filename` | String | Nama berkas saat diunduh (contoh: `Daftar_Hadir_XII_DKV.pdf`) |
| `nama_ujian` | String | Nama ujian saat dokumen dibuat |
| `tahun_ajaran` | String | Tahun ajaran dokumen |
| `semester` | String | Semester |
| `tanggal_ujian` | String | Tanggal pelaksanaan ujian (`YYYY-MM-DD`) |
| `mata_pelajaran` | String | Mata pelajaran yang diujikan |
| `nama_kelas` | String | Nama kelas |
| `class_id` | Integer | ID kelas |
| `ruang` | String | Ruang ujian |
| `peserta_seharusnya` | Integer | Jumlah peserta seharusnya |
| `peserta_hadir` | Integer | Jumlah peserta hadir |
| `peserta_tidak_hadir` | Integer | Jumlah peserta tidak hadir |
| `siswa_tidak_hadir` | String | Daftar nama dan status siswa tidak hadir |
| `nama_pengawas_1` | String | Nama pengawas I |
| `nip_pengawas_1` | String | NIP pengawas I |
| `nama_pengawas_2` | String | Nama pengawas II |
| `nip_pengawas_2` | String | NIP pengawas II |
| `html_content` | String (HTML) | Salinan HTML dokumen A4 untuk cetak ulang instan |
| `created_at` | String (ISO) | Waktu pengarsipan |

---

### 9. Sheet `Users`

Akun pengguna yang memiliki otorisasi masuk ke Panel Administrator.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Integer (PK) | ID pengguna |
| `username` | String (Unique) | Nama pengguna untuk login |
| `password` | String | Kata sandi pengguna |
| `nama` | String | Nama lengkap pengguna |
| `role` | String | Hak akses: `admin` (Super Admin) atau `operator` |
| `created_at` | String (ISO) | Tanggal pembuatan akun |

---

## 🔄 3. Integritas Data & Mekanisme Sinkronisasi

1. **Sinkronisasi Atomik & Proteksi Data (`apiSaveDatabase`)**:
   Operasi simpan dari formulir diproteksi agar array kosong tidak secara tidak sengaja mengosongkan tabel `Siswa` atau `Guru`. Penghapusan massal hanya dieksekusi jika flag khusus seperti `delete_all_students: true` dikirimkan secara eksplisit.
2. **Auto-Register Kelas Baru**:
   Saat menginput siswa baru atau impor Excel, kelas baru yang belum ada akan otomatis dibuatkan baris di sheet `Kelas`.
3. **Smart Delete Linked Archive**:
   Saat menghapus arsip ujian dari `AdminArsip`, server secara cerdas mengidentifikasi berkas kembaran (Daftar Hadir dan Berita Acara pada tanggal, mapel, dan kelas yang sama) dan menghapus keduanya sekaligus, serta mengembalikan `deleted_ids` ke antarmuka pengguna untuk pembaruan tampilan instan.
4. **Role-Based Access Control (RBAC)**:
   Akses ke menu `Users` dan `Database` dibatasi hanya untuk role `admin`.

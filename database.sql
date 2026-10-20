-- ========================================================
-- DATABASE SCHEMA & MASTER DATA: SISTEM ADMINISTRASI UJIAN
-- SMK NEGERI 1 KLUNGKUNG
-- Auto-synchronized: 2026-10-20T02:27:58.723Z
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `teachers`;
DROP TABLE IF EXISTS `classes`;
DROP TABLE IF EXISTS `exam_templates`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `exam_archives`;

CREATE TABLE `classes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_kelas` VARCHAR(100) NOT NULL,
  `tingkat` VARCHAR(20) DEFAULT 'XII',
  `program_keahlian` VARCHAR(255) DEFAULT '',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `class_id` INT NOT NULL,
  `nis` VARCHAR(50) DEFAULT NULL,
  `nisn` VARCHAR(50) DEFAULT NULL,
  `nama` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `teachers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nip` VARCHAR(50) DEFAULT NULL,
  `nama` VARCHAR(255) NOT NULL,
  `mata_pelajaran` VARCHAR(255) DEFAULT '',
  `jabatan` VARCHAR(100) DEFAULT 'Guru / Pengawas',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `exam_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_ujian` VARCHAR(255) NOT NULL,
  `tahun_ajaran` VARCHAR(50) NOT NULL,
  `semester` ENUM('Ganjil', 'Genap') DEFAULT 'Ganjil',
  `judul_berita_acara` TEXT,
  `redaksi_isi` LONGTEXT,
  `aktif` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `settings` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nama` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `exam_archives` (
  `id` BIGINT NOT NULL PRIMARY KEY,
  `type` ENUM('daftar_hadir', 'berita_acara') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `nama_ujian` VARCHAR(150) NULL,
  `tahun_ajaran` VARCHAR(20) NULL,
  `semester` VARCHAR(20) NULL,
  `tanggal_ujian` DATE NULL,
  `mata_pelajaran` VARCHAR(150) NULL,
  `nama_kelas` VARCHAR(100) NULL,
  `class_id` INT NULL,
  `ruang` VARCHAR(50) NULL,
  `peserta_seharusnya` INT DEFAULT 0,
  `peserta_hadir` INT DEFAULT 0,
  `peserta_tidak_hadir` INT DEFAULT 0,
  `nama_pengawas_1` VARCHAR(150) NULL,
  `nip_pengawas_1` VARCHAR(50) NULL,
  `nama_pengawas_2` VARCHAR(150) NULL,
  `nip_pengawas_2` VARCHAR(50) NULL,
  `html_content` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (1, '19820514 200801 1 012', 'I Wayan Sukadana, S.Pd.', 'Teknik Jaringan Komputer', 'Guru Madya / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (2, '19870921 201101 2 008', 'Ni Made Rai Artini, S.Kom.', 'Desain Komunikasi Visual', 'Guru Muda / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (3, '19680315 199412 1 002', 'Drs. I Ketut Suardana, M.Pd.', 'Bahasa Indonesia', 'Guru Pembina / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (4, '19841120 200902 2 005', 'Ni Luh Putu Dewi Lestari, S.Pd.', 'Matematika', 'Guru Madya / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (5, '19890610 201503 1 004', 'I Made Agus Wira Pratama, S.T.', 'Teknik Sepeda Motor', 'Guru Muda / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (6, '19910425 201903 2 011', 'Ni Kadek Sri Wahyuni, S.Farm., Apt.', 'Layanan Penunjang Kefarmasian', 'Guru Pertama / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (7, '19780814 200604 1 009', 'I Gusti Ngurah Agung Putra, S.E.', 'Akuntansi dan Keuangan', 'Guru Madya / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (8, '19860112 201001 2 018', 'Ni Putu Eka Yuliani, S.Pd.', 'Manajemen Perkantoran', 'Guru Muda / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (9, '19920818 202012 1 007', 'I Komang Yudi Antara, S.Kom.', 'Bisnis Digital', 'Guru Pertama / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nip`, `nama`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (10, '19800722 200501 1 006', 'Ida Bagus Made Ananda, S.Pd.', 'Bahasa Inggris', 'Guru Madya / Pengawas', 1);

INSERT INTO `exam_templates` (`id`, `nama_ujian`, `tahun_ajaran`, `semester`, `judul_berita_acara`, `redaksi_isi`, `aktif`) VALUES (1, 'Sumatif Akhir Semester (SAS) [semester]', '2026/2027', 'Ganjil', 'BERITA ACARA \nPENYELENGGARAAN SUMATIF AKHIR SEMESTER (SAS) GANJIL\nTAHUN AJARAN [tahun_ajaran]', '<p>Pada hari ini [hari], tanggal [tanggal] ([tanggal_teks]) bulan [bulan] tahun [tahun] ([tahun_teks]):</p>\n<ol style="margin-top: 6px; margin-bottom: 12px;">\n<li style="margin-bottom: 8px;">Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran] dari pukul [jam_mulai] sampai dengan pukul [jam_selesai] WITA.\n<ul style="margin-bottom: 6px; margin-left: 20px; list-style-type: disc;">\n<li>Pada Sekolah:&nbsp;<strong>[sekolah]</strong></li>\n<li>Kelas:&nbsp;<strong>[kelas]</strong></li>\n<li>Mata Pelajaran:&nbsp;<strong>[mata_pelajaran]</strong></li>\n<li>Ruang:&nbsp;<strong>[ruang]</strong></li>\n<li>Jumlah Peserta Seharusnya:&nbsp;<strong>[peserta_seharusnya]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Tidak Hadir:&nbsp;<strong>[peserta_tidak_hadir]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Hadir:&nbsp;<strong>[peserta_hadir]</strong>&nbsp;orang</li>\n</ul>\n</li>\n<li style="margin-bottom: 8px;">Telah mengisi lembar blangko berita acara sebanyak [blangko_berita_acara] eksemplar dan blangko daftar hadir sebanyak [blangko_daftar_hadir] eksemplar, untuk Mata Pelajaran [mata_pelajaran] di ruang [ruang] dan kelas [kelas] dengan disaksikan oleh para peserta.</li>\n<li style="margin-bottom: 8px;">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):<br><em>[catatan_pelaksanaan]</em></li>\n</ol>\n<p style="margin-top: 15px;">Demikian Berita Acara ini dibuat dengan sesungguhnya.</p>\n<p style="margin-top: 15px;"><span style="font-size: 14.6667px;"><br></span></p>\n<p style="text-align: center; margin-top: 15px;"><span style="font-size: 14.6667px;">Yang membuat berita acara :</span></p>', 1);
INSERT INTO `exam_templates` (`id`, `nama_ujian`, `tahun_ajaran`, `semester`, `judul_berita_acara`, `redaksi_isi`, `aktif`) VALUES (2, 'Sumatif Akhir Semester (SAS) [semester]', '2026/2027', 'Genap', 'BERITA ACARA \nPENYELENGGARAAN SUMATIF AKHIR SEMESTER (SAS) GENAP\nTAHUN AJARAN [tahun_ajaran]', '<p>Pada hari ini [hari], tanggal [tanggal] ([tanggal_teks]) bulan [bulan] tahun [tahun] ([tahun_teks]):</p>\n<ol style="margin-top: 6px; margin-bottom: 12px;">\n<li style="margin-bottom: 8px;">Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran] dari pukul [jam_mulai] sampai dengan pukul [jam_selesai] WITA.\n<ul style="margin-bottom: 6px; margin-left: 20px; list-style-type: disc;">\n<li>Pada Sekolah:&nbsp;<strong>[sekolah]</strong></li>\n<li>Kelas:&nbsp;<strong>[kelas]</strong></li>\n<li>Mata Pelajaran:&nbsp;<strong>[mata_pelajaran]</strong></li>\n<li>Ruang:&nbsp;<strong>[ruang]</strong></li>\n<li>Jumlah Peserta Seharusnya:&nbsp;<strong>[peserta_seharusnya]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Tidak Hadir:&nbsp;<strong>[peserta_tidak_hadir]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Hadir:&nbsp;<strong>[peserta_hadir]</strong>&nbsp;orang</li>\n</ul>\n</li>\n<li style="margin-bottom: 8px;">Telah mengisi lembar blangko berita acara sebanyak [blangko_berita_acara] eksemplar dan blangko daftar hadir sebanyak [blangko_daftar_hadir] eksemplar, untuk Mata Pelajaran [mata_pelajaran] di ruang [ruang] dan kelas [kelas] dengan disaksikan oleh para peserta.</li>\n<li style="margin-bottom: 8px;">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):<br><em>[catatan_pelaksanaan]</em></li>\n</ol>\n<p style="margin-top: 15px;">Demikian Berita Acara ini dibuat dengan sesungguhnya.</p>\n<p style="margin-top: 15px;"><span style="font-size: 14.6667px;"><br></span></p>\n<p style="text-align: center; margin-top: 15px;"><span style="font-size: 14.6667px;">Yang membuat berita acara :</span></p>', 1);

INSERT INTO `settings` (`key`, `value`) VALUES ('school_name', 'SMK NEGERI 1 KLUNGKUNG');
INSERT INTO `settings` (`key`, `value`) VALUES ('school_tagline', 'Generator Administrasi Ujian');
INSERT INTO `settings` (`key`, `value`) VALUES ('kop_header', '/assets/img/kop-header.png');
INSERT INTO `settings` (`key`, `value`) VALUES ('school_logo', '/assets/img/logo.png');
INSERT INTO `settings` (`key`, `value`) VALUES ('academic_year', '2026/2027');
INSERT INTO `settings` (`key`, `value`) VALUES ('default_semester', 'Ganjil');
INSERT INTO `settings` (`key`, `value`) VALUES ('timezone', 'WITA');
INSERT INTO `settings` (`key`, `value`) VALUES ('academic_years', '["2026/2027","2027/2028"]');
INSERT INTO `settings` (`key`, `value`) VALUES ('subjects', '["Desain Komunikasi Visual","Teknik Komputer dan Jaringan","Teknik Sepeda Motor","Layanan Penunjang Kefarmasian Klinis dan Komunitas","Bisnis Digital","Manajemen Perkantoran","Akuntansi dan Keuangan Lembaga","Matematika","Bahasa Indonesia","Bahasa Inggris","Pendidikan Agama Hindu dan Budi Pekerti","Pendidikan Pancasila","Sejarah","Informatika","Projek IPAS","Mapel Pilihan","Seni Budaya","Kreativitas, Inovasi dan Kewirausahaan"]');

INSERT INTO `users` (`id`, `username`, `password`, `nama`, `role`) VALUES (1, 'admin', 'admin123', 'Administrator SMK N 1 Klungkung', 'admin');


SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- DATABASE SCHEMA & MASTER DATA: SISTEM ADMINISTRASI UJIAN
-- SMK NEGERI FYJ CHANNEL
-- Auto-synchronized: 2026-10-20T06:28:50.087Z
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
  `nama` VARCHAR(255) NOT NULL,
  `nip` VARCHAR(50) DEFAULT NULL,
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

INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (1, 'XII TKJ', 'XII', 'Teknik Komputer dan Jaringan', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (2, 'XII DKV', 'XII', 'Desain Komunikasi Visual', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (3, 'XII LPKKK 1', 'XII', 'LPKKK', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (4, 'XII LPKKK 2', 'XII', 'Layanan Penunjang Kefarmasian Klinis dan Komunitas', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (5, 'XII BD 1', 'XII', 'BD', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (6, 'XII BD 2', 'XII', 'Bisnis Digital', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (7, 'XII MP 1', 'XII', 'Manajemen Perkantoran dan Layanan Bisnis', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (8, 'XII MP 2', 'XII', 'Manajemen Perkantoran dan Layanan Bisnis', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (9, 'XII LPB', 'XII', 'Layanan Perbankan', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (10, 'XII AK', 'XII', 'Akuntansi dan Keuangan Lembaga', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (11, 'XII TSM', 'XII', 'Teknik Sepeda Motor', 1);

INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (1, 1, '13561', 'Agustinus Poka Mete');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (2, 1, '13562', 'Akbar Alfiansah');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (3, 1, '13563', 'Dwi Retno Ayuningrum');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (4, 1, '13565', 'I Gede Adtya Wedha Paramartha');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (5, 1, '13566', 'I Gede Putra Sang Pajar');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (6, 1, '13567', 'I Komang Giri Artawan');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (7, 1, '13568', 'I Made Sugiarta');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (8, 1, '13569', 'I Putu Adi Ari Endrawan');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (9, 1, '13570', 'I Putu Agus Pratama Putra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (10, 1, '13571', 'I Putu Pasek Prawira Putra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (11, 1, '13572', 'I Wayan Kartika Adi Putra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (12, 1, '13573', 'Komang Jano Artha');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (13, 1, '13574', 'M. Afgansyah Al-Maghfiroh');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (14, 1, '13575', 'Made Pradnya Wahyu Radheya');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (15, 1, '13576', 'Ni Ketut Sinta');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (16, 1, '13577', 'Ni Komang Sila Triana Sari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (17, 1, '13578', 'Radit');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (18, 1, '13579', 'Rizka Nurdiandari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (19, 1, '13580', 'Rizky Adib Irlan Syah');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (20, 1, '13581', 'Rizqy Al Farraby');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (21, 2, '13769', 'Anak Agung Gede Dika Pradipta');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (22, 2, '13770', 'Gek Danaya Anindia');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (23, 2, '13771', 'I Gede Ary Kesuma Suputra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (24, 2, '13772', 'I Gede Rian Primayoga');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (25, 2, '13773', 'I Komang Raka Danaswara');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (26, 2, '13774', 'I Made Dharma Mahardika');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (27, 2, '13775', 'I Made Wahyu Adikusuma');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (28, 2, '13776', 'I Putu Gede Eka Yogantara Pratmaja');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (29, 2, '13777', 'I Putu Rendy Galang Permana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (30, 2, '13778', 'I Wayan Wira Pradnyana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (31, 2, '13779', 'Kadek Gita Anindita Kemulan');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (32, 2, '13780', 'Komang Aditya');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (33, 2, '13781', 'Ni Kadek Ayu Melani Ratna Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (34, 2, '13782', 'Ni Kadek Ita Sutriani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (35, 2, '13783', 'Ni Kadek Ranita Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (36, 2, '13784', 'Ni Luh Putu Sekar Darma Yanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (37, 2, '13785', 'Ni Made Ayu Dwi Apriliani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (38, 2, '13786', 'Ni Putu Dian Cahyani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (39, 2, '13787', 'Ni Putu Ghina Anastasia Putri');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (40, 2, '13788', 'Ni Putu Rismayani Darma Swari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (41, 2, '13789', 'Queena Bilqist Mulyadi Putri');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (42, 2, '13790', 'Raditya Nugraha');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (43, 2, '13791', 'Wayan Satya Dharma');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (44, 3, '13582', 'Agus Billy Fedrico');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (45, 3, '13583', 'Agus Eka Widya Pradnyana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (46, 3, '13584', 'Dewa Ayu Sri Widyastuti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (47, 3, '13585', 'I Dewa Ayu Dwi Cahya Indrayani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (48, 3, '13586', 'I Komang Edi Setiawan.');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (49, 3, '13587', 'Ida Ayu Putu Diah Kamiswari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (50, 3, '13588', 'Luh Ade Galuh Pratiwi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (51, 3, '13589', 'Munifa Inayatur Rohma');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (52, 3, '13590', 'Ni Kadek Ayu Arsani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (53, 3, '13591', 'Ni Kadek Diah Dwi Adnyani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (54, 3, '13592', 'Ni Kadek Dian Candra Pratiwi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (55, 3, '13593', 'Ni Kadek Evinayanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (56, 3, '13595', 'Ni Komang Ayu Santika');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (57, 3, '13596', 'Ni Komang Widya Krista Yanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (58, 3, '13597', 'Ni Made Juniari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (59, 3, '13598', 'Ni Made Shita Wulandari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (60, 3, '13599', 'Ni Putu Intan Merliani Putri');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (61, 3, '13600', 'Ni Putu Novi Armatiana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (62, 3, '13601', 'Ni Wayan Ani Arthayasih');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (63, 3, '13602', 'Ni Wayan Nanda Pradnya Suari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (64, 3, '13603', 'Yoneda Yebleb');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (65, 4, '13604', 'Aisyah Dwi Agusthina');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (66, 4, '13605', 'Elyska Kirana Putri');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (67, 4, '14102', 'Gusti Ayu Putu Alita Bintang Lestari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (68, 4, '13606', 'I Gusti Ayu Indah Pertiwi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (69, 4, '13608', 'Mauli Diana Rahayu Putri');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (70, 4, '13609', 'Ni Kadek Bintang Nopiani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (71, 4, '13611', 'Ni Kadek Winda Wulandewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (72, 4, '13612', 'Ni Komang Anggraeni');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (73, 4, '13613', 'Ni Komang Leges Aria Sentani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (74, 4, '13614', 'Ni Komang Sri Diah Lastari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (75, 4, '13615', 'Ni Komang Tri Maetarani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (76, 4, '13616', 'Ni Komang Trisna Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (77, 4, '13617', 'Ni Luh Komang Divya Santhi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (78, 4, '13618', 'Ni Putu Galih Pratiwi Setiawan');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (79, 4, '13619', 'Ni Putu Indah Muliarni');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (80, 4, '13620', 'Ni Putu Martini Lestari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (81, 4, '13621', 'Ni Putu Widya Wulandari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (82, 4, '13622', 'Ni Wayan Novi Lestari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (83, 4, '13624', 'Rizqiana Ayudianingsih');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (84, 5, '13625', 'Dewa Ayu Made Dwi Artika Darmayanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (85, 5, '13626', 'I Gede Adi Putra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (86, 5, '13627', 'I Gusti Ayu Wika Ariestari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (87, 5, '13628', 'I Gusti Ngurah Wijana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (88, 5, '13629', 'I Kadek Yogi Iswara');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (89, 5, '13630', 'I Nyoman Candra Paranarta');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (90, 5, '13631', 'Kadek Suki Oktami');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (91, 5, '13632', 'Luh Desiyani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (92, 5, '13633', 'Ni Kadek Ayu Dwipayani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (93, 5, '13634', 'Ni Kadek Sanjiani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (94, 5, '13635', 'Ni Kadek Widiantari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (95, 5, '13636', 'Ni Komang Ayu Intan Pratiwi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (96, 5, '13637', 'Ni Komang Henny Herdi Yani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (97, 5, '13638', 'Ni Komang Purnama Sari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (98, 5, '13639', 'Ni Komang Sri Damayanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (99, 5, '13640', 'Ni Komang Trisna Yuni Astari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (100, 5, '13641', 'Ni Luh Putu Frema Sugi Maharani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (101, 5, '13642', 'Ni Made Sari Astini');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (102, 5, '13643', 'Ni Made Sukma Yanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (103, 5, '13644', 'Ni Nyoman Manik Dalem Maharani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (104, 5, '13645', 'Ni Putu Eka Candra Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (105, 5, '13646', 'Ni Putu Sari Astuti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (106, 5, '13647', 'Ni Putu Sariasih');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (107, 5, '13648', 'Ni Putu Selpi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (108, 5, '13649', 'Ni Putu Sinta Purnama Yanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (109, 5, '13650', 'Putu Agus Mahendra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (110, 5, '13651', 'Putu Aryadinata');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (111, 5, '13652', 'Putu Purnamawati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (112, 5, '13653', 'Rizki Ananta Ramadhani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (113, 6, '13654', 'Anisa Safila');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (114, 6, '13655', 'Dewa Ayu Raras Variati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (115, 6, '13794', 'Galang Damai Dinata');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (116, 6, '13656', 'I Gede Sutawan');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (117, 6, '13657', 'I Kadek Desta Prawira');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (118, 6, '13658', 'I Kadek Purnawirawan');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (119, 6, '13659', 'I Ketut Alit Rupawan');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (120, 6, '13660', 'I Komang Sucitra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (121, 6, '13661', 'I Made Windya Arsana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (122, 6, '13662', 'I Putu Aditya Suputra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (123, 6, '13663', 'Kadek Agus Apriana Bajesti Putra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (124, 6, '13664', 'Luh Made Purnama Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (125, 6, '13665', 'Ni Kadek Meta Febriantari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (126, 6, '13666', 'Ni Kadek Putri Jayanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (127, 6, '13667', 'Ni Komang Ayu Septianingsih');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (128, 6, '13668', 'Ni Luh Nova Sinta Riari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (129, 6, '13669', 'Ni Nengah Febriani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (130, 6, '13670', 'Ni Pande Wayan Yonika Damayani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (131, 6, '13671', 'Ni Putu Lia Trisnayanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (132, 6, '13672', 'Putu Vera Agustin');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (133, 7, '13673', 'Anak Agung Dewi Suryaningrat');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (134, 7, '13674', 'Desak Nyoman Widya Sari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (135, 7, '13675', 'I Dewa Ayu Bulan Sriasih');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (136, 7, '13676', 'I Gede Ary Sudiantara');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (137, 7, '13677', 'I Gede Nesa Wira Arsana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (138, 7, '13678', 'I Gusti Ayu Diana Kristiani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (139, 7, '13679', 'I Gusti Ngurah Agus Januarta');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (140, 7, '13680', 'Komang Ayu Seri Musthikarani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (141, 7, '13681', 'Made Nitarianti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (142, 7, '13682', 'Meisya Fazrina');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (143, 7, '13683', 'Ni Kadek Aprilia Lestari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (144, 7, '13684', 'Ni Kadek Ayu Lestari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (145, 7, '13685', 'Ni Kadek Darma Yanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (146, 7, '13686', 'Ni Kadek Ika Pradevi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (147, 7, '13687', 'Ni Kadek Risna Kumala Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (148, 7, '13688', 'Ni Kadek Sintia Wati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (149, 7, '13689', 'Ni Ketut Melia Purnama Sari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (150, 7, '13690', 'Ni Komang Ayu Widiantari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (151, 7, '13691', 'Ni Komang Diah Anandita Permata');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (152, 7, '13692', 'Ni Komang Rini Cahyani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (153, 7, '13693', 'Ni Luh Ayu Purnama Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (154, 7, '13694', 'Ni Luh Lisna Diantari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (155, 7, '13695', 'Ni Luh Sri Nadi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (156, 7, '13696', 'Ni Nengah Septia Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (157, 7, '13697', 'Ni Putu Eka Pramita Sari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (158, 7, '13698', 'Pande Ni Putu Adisty Kusuma Jati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (159, 7, '13699', 'Tiara Yuliyanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (160, 8, '13700', 'Anak Agung Istri Amira Vebriani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (161, 8, '13701', 'I Dewa Ayu Juniantari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (162, 8, '13702', 'I Gede Tri Jaya Winnata');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (163, 8, '13703', 'Ida Bagus Yuda Pratama');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (164, 8, '13704', 'Irsyad Adiba Hafas Zidansyah');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (165, 8, '13705', 'Ni Kadek Ayu Aprilia Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (166, 8, '13706', 'Ni Kadek Ayu Larasati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (167, 8, '13707', 'Ni Kadek Puspa Aryanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (168, 8, '13708', 'Ni Kadek Sriyanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (169, 8, '13709', 'Ni Komang Adelia Putri');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (170, 8, '13710', 'Ni Komang Indah Jesika Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (171, 8, '13711', 'Ni Komang Listia Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (172, 8, '13712', 'Ni Komang Padmawati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (173, 8, '13713', 'Ni Komang Sutri Prantini');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (174, 8, '13714', 'Ni Komang Triana Pusparani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (175, 8, '13715', 'Ni Luh Vika Widyawati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (176, 8, '13716', 'Ni Made Suci Manik Astari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (177, 8, '13717', 'Ni Putu Ayu Bintang');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (178, 8, '13718', 'Ni Putu Diah Arthasari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (179, 8, '13719', 'Ni Putu Eka Semara Putri');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (180, 8, '13720', 'Ni Putu Eka Widiantari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (181, 8, '13721', 'Ni Putu Mei Wulandari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (182, 8, '13722', 'Ni Putu Puspawati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (183, 8, '13723', 'Ni Putu Tia Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (184, 8, '13724', 'Pande Putu Galuh Risanti Indira Yunika');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (185, 8, '13725', 'Putu Juli Ayu Antari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (186, 8, '13726', 'Sang Made Arta Mahendra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (187, 9, '13727', 'Afrilia');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (188, 9, '13728', 'Anak Agung Istri Prima Pebrianti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (189, 9, '13729', 'Gede Risky Adi Permana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (190, 9, '13730', 'I Gusti Ayu Putu Candra Widiantari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (191, 9, '13731', 'I Gusti Made Diah Purnama Sari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (192, 9, '13732', 'Ida Ayu Indah Gangga Swari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (193, 9, '13733', 'Ida Ayu Nyoman Reditya Oktaviani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (194, 9, '13734', 'Ida Ayu Sinta Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (195, 9, '13736', 'Nabila Tusak Diah');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (196, 9, '13737', 'Ni Kadek Intan Satrya Wati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (197, 9, '13738', 'Ni Made Ari Diana Sari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (198, 9, '13739', 'Rina Agustina');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (199, 10, '13741', 'I Desak Ketut Patniki Astuti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (200, 10, '13742', 'I Dewa Ayu Awidiya Sari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (201, 10, '13743', 'I Dewa Ayu Meira Dianra Sari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (202, 10, '13744', 'I Putu Juniarta');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (203, 10, '13745', 'I Wayan Agus Septiadi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (204, 10, '13746', 'Ketut Ananta Wardana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (205, 10, '13747', 'Ni Kadek Anggun Putri Pramesti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (206, 10, '13748', 'Ni Kadek Ratih Sancikadewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (207, 10, '13749', 'Ni Kadek Santiasih');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (208, 10, '13750', 'Ni Kadek Sinta Widyantini');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (209, 10, '13751', 'Ni Kadek Suadnyani Megeng');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (210, 10, '13752', 'Ni Ketut Catur Rahayu');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (211, 10, '13753', 'Ni Komang Bintang Triasih');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (212, 10, '13754', 'Ni Luh Nyoman Tri Githa Pramesti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (213, 10, '13755', 'Ni Luh Putu Candra Cahyani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (214, 10, '13756', 'Ni Putu Anggik Deswandari');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (215, 10, '13757', 'Ni Putu Ayu Krisna Candra Dewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (216, 10, '13758', 'Ni Putu Dewik');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (217, 10, '13759', 'Ni Putu Diah Darmayanti');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (218, 10, '13760', 'Ni Putu Dian Ambarwati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (219, 10, '13761', 'Ni Putu Dian Maharani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (220, 10, '13762', 'Ni Putu Echa Setyawati');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (221, 10, '13763', 'Ni Putu Eka Pandewi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (222, 10, '13764', 'Ni Putu Stefany Devita Putri');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (223, 10, '13765', 'Ni Putu Wita Sinta Pradnyani');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (224, 10, '13766', 'Ni Wayan Chandra Rusita Devi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (225, 10, '13767', 'Pande Made Shasmita Aurellia Putri');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (226, 10, '13768', 'Yenny Febri Yanthy Ningsih');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (227, 11, '13526', 'Aldo Valentino');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (228, 11, '13527', 'ARKANANTA MAULANA PUTRA APRILIANSYAH');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (229, 11, '13528', 'I Gede Ari Widnyana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (230, 11, '13529', 'I Gede Candra Wiguna');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (231, 11, '13530', 'I Gede Resa Pradnya Andika');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (232, 11, '13531', 'I GUSTI NGURAH SATHYA DANANJAYA');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (233, 11, '13532', 'I Kadek Angga Aditya Putra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (234, 11, '13533', 'I Kadek Dodik Ramayoga');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (235, 11, '13534', 'I Kadek Dwi Adi Darma Yudhi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (236, 11, '13535', 'I Kadek Ipan Junata');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (237, 11, '13536', 'I KADEK KUSUMA CAHYADI');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (238, 11, '13537', 'I Ketut Catur Yoga Saputra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (239, 11, '13540', 'I Komang Bayu Septi Permana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (240, 11, '13541', 'I Komang Pebri Andika Saputra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (241, 11, '13542', 'I Made Agus Bayu Widi');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (242, 11, '13543', 'I Made Div Aditya Pramana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (243, 11, '13544', 'I Ngurah Komang Ari Artana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (244, 11, '13545', 'I Putu Bayu Saputra');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (245, 11, '13547', 'I Putu Pande Sedaya Tana');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (246, 11, '13548', 'I Wayan Surya Nanta');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (247, 11, '13550', 'JULIANTARA PUTRA');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (248, 11, '13551', 'Kadek Angga Trisnawan');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (249, 11, '13552', 'Ketut Mahardika');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (250, 11, '13538', 'Ketut Rianta');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (251, 11, '13553', 'Lorensius Kaka Lalo');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (252, 11, '13554', 'Made Adi Mahardika');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (253, 11, '13555', 'MUHAMMAD AZIZUL HAKIM');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (254, 11, '13556', 'Nyoman Yudhi Triananda Wibawa');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (255, 11, '13558', 'REDNO FEDRIANZAH');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (256, 11, '13795', 'ROBERTO CHRISTIANO');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (257, 11, '13559', 'WIRANTO SANJAYA');
INSERT INTO `students` (`id`, `class_id`, `nis`, `nama`) VALUES (258, 11, '13560', 'YUSUF ARDIANSYAH');

INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (1, 'I Wayan Sukadana, S.Pd.', '19820514 200801 1 012', 'Teknik Jaringan Komputer', 'Guru Madya / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (2, 'Ni Made Rai Artini, S.Kom.', '19870921 201101 2 008', 'Desain Komunikasi Visual', 'Guru Muda / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (3, 'Drs. I Ketut Suardana, M.Pd.', '19680315 199412 1 002', 'Bahasa Indonesia', 'Guru Pembina / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (4, 'Ni Luh Putu Dewi Lestari, S.Pd.', '19841120 200902 2 005', 'Matematika', 'Guru Madya / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (5, 'I Made Agus Wira Pratama, S.T.', '19890610 201503 1 004', 'Teknik Sepeda Motor', 'Guru Muda / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (6, 'Ni Kadek Sri Wahyuni, S.Farm., Apt.', '19910425 201903 2 011', 'Layanan Penunjang Kefarmasian', 'Guru Pertama / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (7, 'I Gusti Ngurah Agung Putra, S.E.', '19780814 200604 1 009', 'Akuntansi dan Keuangan', 'Guru Madya / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (8, 'Ni Putu Eka Yuliani, S.Pd.', '19860112 201001 2 018', 'Manajemen Perkantoran', 'Guru Muda / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (9, 'I Komang Yudi Antara, S.Kom.', '19920818 202012 1 007', 'Bisnis Digital', 'Guru Pertama / Pengawas', 1);
INSERT INTO `teachers` (`id`, `nama`, `nip`, `mata_pelajaran`, `jabatan`, `is_active`) VALUES (10, 'Ida Bagus Made Ananda, S.Pd.', '19800722 200501 1 006', 'Bahasa Inggris', 'Guru Madya / Pengawas', 1);

INSERT INTO `exam_templates` (`id`, `nama_ujian`, `tahun_ajaran`, `semester`, `judul_berita_acara`, `redaksi_isi`, `aktif`) VALUES (1, 'Sumatif Akhir Semester (SAS)', '2026/2027', 'Ganjil', 'BERITA ACARA \nPENYELENGGARAAN SUMATIF AKHIR SEMESTER (SAS) GANJIL\nTAHUN AJARAN [tahun_ajaran]', '<p>Pada hari ini [hari], tanggal [tanggal] ([tanggal_teks]) bulan [bulan] tahun [tahun] ([tahun_teks]):</p>\n<ol style="margin-top: 6px; margin-bottom: 12px;">\n<li style="margin-bottom: 8px;">Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran] dari pukul [jam_mulai] sampai dengan pukul [jam_selesai] WITA.\n<ul style="margin-bottom: 6px; margin-left: 20px; list-style-type: disc;">\n<li>Pada Sekolah:&nbsp;<strong>[sekolah]</strong></li>\n<li>Kelas:&nbsp;<strong>[kelas]</strong></li>\n<li>Mata Pelajaran:&nbsp;<strong>[mata_pelajaran]</strong></li>\n<li>Ruang:&nbsp;<strong>[ruang]</strong></li>\n<li>Jumlah Peserta Seharusnya:&nbsp;<strong>[peserta_seharusnya]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Tidak Hadir:&nbsp;<strong>[peserta_tidak_hadir]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Hadir:&nbsp;<strong>[peserta_hadir]</strong>&nbsp;orang</li>\n</ul>\n</li>\n<li style="margin-bottom: 8px;">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):[catatan_pelaksanaan]</li>\n<li style="margin-bottom: 8px;">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):<br><em>[catatan_pelaksanaan]</em></li>\n</ol>\n<p style="margin-top: 15px;">Demikian Berita Acara ini dibuat dengan sesungguhnya.</p>\n<p style="margin-top: 15px;"><span style="font-size: 14.6667px;"><br></span></p>\n<p style="text-align: center; margin-top: 15px;"><span style="font-size: 14.6667px;">Yang membuat berita acara :</span></p>', 1);
INSERT INTO `exam_templates` (`id`, `nama_ujian`, `tahun_ajaran`, `semester`, `judul_berita_acara`, `redaksi_isi`, `aktif`) VALUES (2, 'Sumatif Akhir Semester (SAS)', '2026/2027', 'Genap', 'BERITA ACARA \nPENYELENGGARAAN SUMATIF AKHIR SEMESTER (SAS) GENAP\nTAHUN AJARAN [tahun_ajaran]', '<p>Pada hari ini [hari], tanggal [tanggal] ([tanggal_teks]) bulan [bulan] tahun [tahun] ([tahun_teks]):</p>\n<ol style="margin-top: 6px; margin-bottom: 12px;">\n<li style="margin-bottom: 8px;">Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran] dari pukul [jam_mulai] sampai dengan pukul [jam_selesai] WITA.\n<ul style="margin-bottom: 6px; margin-left: 20px; list-style-type: disc;">\n<li>Pada Sekolah:&nbsp;<strong>[sekolah]</strong></li>\n<li>Kelas:&nbsp;<strong>[kelas]</strong></li>\n<li>Mata Pelajaran:&nbsp;<strong>[mata_pelajaran]</strong></li>\n<li>Ruang:&nbsp;<strong>[ruang]</strong></li>\n<li>Jumlah Peserta Seharusnya:&nbsp;<strong>[peserta_seharusnya]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Tidak Hadir:&nbsp;<strong>[peserta_tidak_hadir]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Hadir:&nbsp;<strong>[peserta_hadir]</strong>&nbsp;orang</li>\n</ul>\n</li>\n<li style="margin-bottom: 8px;">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):[catatan_pelaksanaan]</li>\n<li style="margin-bottom: 8px;">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):<br><em>[catatan_pelaksanaan]</em></li>\n</ol>\n<p style="margin-top: 15px;">Demikian Berita Acara ini dibuat dengan sesungguhnya.</p>\n<p style="margin-top: 15px;"><span style="font-size: 14.6667px;"><br></span></p>\n<p style="text-align: center; margin-top: 15px;"><span style="font-size: 14.6667px;">Yang membuat berita acara :</span></p>', 1);

INSERT INTO `settings` (`key`, `value`) VALUES ('school_name', 'SMK NEGERI FYJ CHANNEL');
INSERT INTO `settings` (`key`, `value`) VALUES ('school_tagline', 'Generator Administrasi Ujian');
INSERT INTO `settings` (`key`, `value`) VALUES ('kop_header', '/assets/img/kop-header.png');
INSERT INTO `settings` (`key`, `value`) VALUES ('school_logo', '/assets/img/logo.png');
INSERT INTO `settings` (`key`, `value`) VALUES ('academic_year', '2026/2027');
INSERT INTO `settings` (`key`, `value`) VALUES ('default_semester', 'Ganjil');
INSERT INTO `settings` (`key`, `value`) VALUES ('timezone', 'WITA');
INSERT INTO `settings` (`key`, `value`) VALUES ('academic_years', '["2026/2027","2027/2028"]');
INSERT INTO `settings` (`key`, `value`) VALUES ('subjects', '["Desain Komunikasi Visual","Teknik Komputer dan Jaringan","Teknik Sepeda Motor","Layanan Penunjang Kefarmasian Klinis dan Komunitas","Bisnis Digital","Manajemen Perkantoran","Akuntansi dan Keuangan Lembaga","Matematika","Bahasa Indonesia","Bahasa Inggris","Pendidikan Agama Hindu dan Budi Pekerti","Pendidikan Pancasila","Sejarah","Informatika","Projek IPAS","Mapel Pilihan","Seni Budaya","Kreativitas, Inovasi dan Kewirausahaan"]');

INSERT INTO `users` (`id`, `username`, `password`, `nama`, `role`) VALUES (1, 'admin', 'admin123', 'Administrator FYJ Channel', 'admin');
INSERT INTO `users` (`id`, `username`, `password`, `nama`, `role`) VALUES (2, 'guru', 'guru123', 'Ni Made Rai Artini, S.Kom.', 'operator');

INSERT INTO `exam_archives` (`id`, `type`, `title`, `filename`, `nama_ujian`, `tahun_ajaran`, `semester`, `tanggal_ujian`, `mata_pelajaran`, `nama_kelas`, `class_id`, `ruang`, `peserta_seharusnya`, `peserta_hadir`, `peserta_tidak_hadir`, `nama_pengawas_1`, `nip_pengawas_1`, `nama_pengawas_2`, `nip_pengawas_2`, `html_content`) VALUES (1792477730087, 'daftar_hadir', 'Daftar Hadir XII BD 1 - Bahasa Inggris', 'DH-SAS_XII_BD_1-Bahasa_Inggris-2026-10-20.pdf', 'Sumatif Akhir Semester (SAS) Ganjil', '2026/2027', 'Ganjil', '2026-10-20', 'Bahasa Inggris', 'XII BD 1', 5, 'Ruang 01', 29, 26, 3, 'I Wayan Sukadana, S.Pd.', '19820514 200801 1 012', '', '', '\n                <div class="a4-page" id="a4Page" style="margin: 0 auto !important; width: 210mm !important; min-height: 297mm !important; box-sizing: border-box !important; flex-shrink: 0 !important;">\n                    <!-- KOP SURAT SEKOLAH -->\n                    <div class="kop-surat" style="border-bottom: none; padding-bottom: 0; margin-bottom: 8px; text-align: center;">\n                        <img src="/assets/img/kop-header.png?t=1792477664025" alt="Kop Surat Resmi" style="width: 100%; max-height: 105px; object-fit: contain; display: block; margin: 0 auto;">\n                    </div>\n                    \n                    <!-- JUDUL DOKUMEN -->\n                    <div class="doc-title">\n                        DAFTAR HADIR PESERTA UJIAN<br>\n                        <span id="pvNamaUjian">SUMATIF AKHIR SEMESTER (SAS) GANJIL</span><br>\n                        TAHUN AJARAN <span id="pvTahunAjaran">2026/2027</span>\n                    </div>\n\n                    <!-- METADATA UJIAN -->\n                    <table class="meta-table">\n                        <tbody><tr>\n                            <td style="width: 16%;">Hari / Tanggal</td>\n                            <td style="width: 2%;">:</td>\n                            <td style="width: 38%;"><strong id="pvHariTanggal">Selasa, 20 Oktober 2026</strong></td>\n                            <td style="width: 14%;">Kelas</td>\n                            <td style="width: 2%;">:</td>\n                            <td style="width: 28%;"><strong id="pvKelas">XII BD 1</strong></td>\n                        </tr>\n                        <tr>\n                            <td>Mata Pelajaran</td>\n                            <td>:</td>\n                            <td><strong id="pvMataPelajaran">Bahasa Inggris</strong></td>\n                            <td>Sesi / Ruang</td>\n                            <td>:</td>\n                            <td><span id="pvSesi">1</span> / <span id="pvRuang">Ruang 01</span></td>\n                        </tr>\n                        <tr>\n                            <td>Waktu Ujian</td>\n                            <td>:</td>\n                            <td><span id="pvWaktu">07:30 - 09:30 WITA</span></td>\n                            <td></td>\n                            <td></td>\n                            <td></td>\n                        </tr>\n                    </tbody></table>\n\n                    <!-- TABEL SISWA -->\n                    <table class="attendance-table">\n                        <thead>\n                            <tr>\n                                <th style="width: 35px;">No</th>\n                                <th style="width: 85px;">NIS</th>\n                                <th>Nama Peserta Didik</th>\n                                <th style="width: 100px;">Kehadiran</th>\n                            </tr>\n                        </thead>\n                        <tbody id="pvStudentTbody">\n                <tr id="pvStudentRow_84">\n                    <td class="center" style="width: 35px; text-align: center;">1</td>\n                    <td class="center" style="width: 85px; text-align: center;">13625</td>\n                    <td style="padding-left: 8px;">Dewa Ayu Made Dwi Artika Darmayanti</td>\n                    <td class="center" id="pvStatus_84" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_85">\n                    <td class="center" style="width: 35px; text-align: center;">2</td>\n                    <td class="center" style="width: 85px; text-align: center;">13626</td>\n                    <td style="padding-left: 8px;">I Gede Adi Putra</td>\n                    <td class="center" id="pvStatus_85" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_86">\n                    <td class="center" style="width: 35px; text-align: center;">3</td>\n                    <td class="center" style="width: 85px; text-align: center;">13627</td>\n                    <td style="padding-left: 8px;">I Gusti Ayu Wika Ariestari</td>\n                    <td class="center" id="pvStatus_86" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_87">\n                    <td class="center" style="width: 35px; text-align: center;">4</td>\n                    <td class="center" style="width: 85px; text-align: center;">13628</td>\n                    <td style="padding-left: 8px;">I Gusti Ngurah Wijana</td>\n                    <td class="center" id="pvStatus_87" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_88">\n                    <td class="center" style="width: 35px; text-align: center;">5</td>\n                    <td class="center" style="width: 85px; text-align: center;">13629</td>\n                    <td style="padding-left: 8px;">I Kadek Yogi Iswara</td>\n                    <td class="center" id="pvStatus_88" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_89">\n                    <td class="center" style="width: 35px; text-align: center;">6</td>\n                    <td class="center" style="width: 85px; text-align: center;">13630</td>\n                    <td style="padding-left: 8px;">I Nyoman Candra Paranarta</td>\n                    <td class="center" id="pvStatus_89" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_90">\n                    <td class="center" style="width: 35px; text-align: center;">7</td>\n                    <td class="center" style="width: 85px; text-align: center;">13631</td>\n                    <td style="padding-left: 8px;">Kadek Suki Oktami</td>\n                    <td class="center" id="pvStatus_90" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_91">\n                    <td class="center" style="width: 35px; text-align: center;">8</td>\n                    <td class="center" style="width: 85px; text-align: center;">13632</td>\n                    <td style="padding-left: 8px;">Luh Desiyani</td>\n                    <td class="center" id="pvStatus_91" style="font-weight: 600; width: 100px; text-align: center; color: rgb(202, 138, 4);">Izin</td>\n                </tr>\n            \n                <tr id="pvStudentRow_92">\n                    <td class="center" style="width: 35px; text-align: center;">9</td>\n                    <td class="center" style="width: 85px; text-align: center;">13633</td>\n                    <td style="padding-left: 8px;">Ni Kadek Ayu Dwipayani</td>\n                    <td class="center" id="pvStatus_92" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_93">\n                    <td class="center" style="width: 35px; text-align: center;">10</td>\n                    <td class="center" style="width: 85px; text-align: center;">13634</td>\n                    <td style="padding-left: 8px;">Ni Kadek Sanjiani</td>\n                    <td class="center" id="pvStatus_93" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_94">\n                    <td class="center" style="width: 35px; text-align: center;">11</td>\n                    <td class="center" style="width: 85px; text-align: center;">13635</td>\n                    <td style="padding-left: 8px;">Ni Kadek Widiantari</td>\n                    <td class="center" id="pvStatus_94" style="font-weight: 600; width: 100px; text-align: center; color: rgb(2, 132, 199);">Dispensasi</td>\n                </tr>\n            \n                <tr id="pvStudentRow_95">\n                    <td class="center" style="width: 35px; text-align: center;">12</td>\n                    <td class="center" style="width: 85px; text-align: center;">13636</td>\n                    <td style="padding-left: 8px;">Ni Komang Ayu Intan Pratiwi</td>\n                    <td class="center" id="pvStatus_95" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_96">\n                    <td class="center" style="width: 35px; text-align: center;">13</td>\n                    <td class="center" style="width: 85px; text-align: center;">13637</td>\n                    <td style="padding-left: 8px;">Ni Komang Henny Herdi Yani</td>\n                    <td class="center" id="pvStatus_96" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_97">\n                    <td class="center" style="width: 35px; text-align: center;">14</td>\n                    <td class="center" style="width: 85px; text-align: center;">13638</td>\n                    <td style="padding-left: 8px;">Ni Komang Purnama Sari</td>\n                    <td class="center" id="pvStatus_97" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_98">\n                    <td class="center" style="width: 35px; text-align: center;">15</td>\n                    <td class="center" style="width: 85px; text-align: center;">13639</td>\n                    <td style="padding-left: 8px;">Ni Komang Sri Damayanti</td>\n                    <td class="center" id="pvStatus_98" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_99">\n                    <td class="center" style="width: 35px; text-align: center;">16</td>\n                    <td class="center" style="width: 85px; text-align: center;">13640</td>\n                    <td style="padding-left: 8px;">Ni Komang Trisna Yuni Astari</td>\n                    <td class="center" id="pvStatus_99" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_100">\n                    <td class="center" style="width: 35px; text-align: center;">17</td>\n                    <td class="center" style="width: 85px; text-align: center;">13641</td>\n                    <td style="padding-left: 8px;">Ni Luh Putu Frema Sugi Maharani</td>\n                    <td class="center" id="pvStatus_100" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_101">\n                    <td class="center" style="width: 35px; text-align: center;">18</td>\n                    <td class="center" style="width: 85px; text-align: center;">13642</td>\n                    <td style="padding-left: 8px;">Ni Made Sari Astini</td>\n                    <td class="center" id="pvStatus_101" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_102">\n                    <td class="center" style="width: 35px; text-align: center;">19</td>\n                    <td class="center" style="width: 85px; text-align: center;">13643</td>\n                    <td style="padding-left: 8px;">Ni Made Sukma Yanti</td>\n                    <td class="center" id="pvStatus_102" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_103">\n                    <td class="center" style="width: 35px; text-align: center;">20</td>\n                    <td class="center" style="width: 85px; text-align: center;">13644</td>\n                    <td style="padding-left: 8px;">Ni Nyoman Manik Dalem Maharani</td>\n                    <td class="center" id="pvStatus_103" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_104">\n                    <td class="center" style="width: 35px; text-align: center;">21</td>\n                    <td class="center" style="width: 85px; text-align: center;">13645</td>\n                    <td style="padding-left: 8px;">Ni Putu Eka Candra Dewi</td>\n                    <td class="center" id="pvStatus_104" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_105">\n                    <td class="center" style="width: 35px; text-align: center;">22</td>\n                    <td class="center" style="width: 85px; text-align: center;">13646</td>\n                    <td style="padding-left: 8px;">Ni Putu Sari Astuti</td>\n                    <td class="center" id="pvStatus_105" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_106">\n                    <td class="center" style="width: 35px; text-align: center;">23</td>\n                    <td class="center" style="width: 85px; text-align: center;">13647</td>\n                    <td style="padding-left: 8px;">Ni Putu Sariasih</td>\n                    <td class="center" id="pvStatus_106" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_107">\n                    <td class="center" style="width: 35px; text-align: center;">24</td>\n                    <td class="center" style="width: 85px; text-align: center;">13648</td>\n                    <td style="padding-left: 8px;">Ni Putu Selpi</td>\n                    <td class="center" id="pvStatus_107" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_108">\n                    <td class="center" style="width: 35px; text-align: center;">25</td>\n                    <td class="center" style="width: 85px; text-align: center;">13649</td>\n                    <td style="padding-left: 8px;">Ni Putu Sinta Purnama Yanti</td>\n                    <td class="center" id="pvStatus_108" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_109">\n                    <td class="center" style="width: 35px; text-align: center;">26</td>\n                    <td class="center" style="width: 85px; text-align: center;">13650</td>\n                    <td style="padding-left: 8px;">Putu Agus Mahendra</td>\n                    <td class="center" id="pvStatus_109" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_110">\n                    <td class="center" style="width: 35px; text-align: center;">27</td>\n                    <td class="center" style="width: 85px; text-align: center;">13651</td>\n                    <td style="padding-left: 8px;">Putu Aryadinata</td>\n                    <td class="center" id="pvStatus_110" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>\n                </tr>\n            \n                <tr id="pvStudentRow_111">\n                    <td class="center" style="width: 35px; text-align: center;">28</td>\n                    <td class="center" style="width: 85px; text-align: center;">13652</td>\n                    <td style="padding-left: 8px;">Putu Purnamawati</td>\n                    <td class="center" id="pvStatus_111" style="font-weight: 600; width: 100px; text-align: center; color: rgb(202, 138, 4);">Izin</td>\n                </tr>\n            \n                <tr id="pvStudentRow_112">\n                    <td class="center" style="width: 35px; text-align: center;">29</td>\n                    <td class="center" style="width: 85px; text-align: center;">13653</td>\n                    <td style="padding-left: 8px;">Rizki Ananta Ramadhani</td>\n                    <td class="center" id="pvStatus_112" style="font-weight: 600; width: 100px; text-align: center; color: rgb(202, 138, 4);">Izin</td>\n                </tr>\n            </tbody>\n                    </table>\n\n                    <!-- REKAPITULASI KEHADIRAN -->\n                    <div class="rekap-box">\n                        <div style="font-weight: bold; font-size: 9.5pt;">Rekapitulasi Kehadiran:</div>\n                        <table class="rekap-table">\n                            <tbody><tr>\n                                <td>Hadir</td>\n                                <td>Dispensasi</td>\n                                <td>Izin</td>\n                                <td>Sakit</td>\n                                <td>Tidak Hadir</td>\n                                <td><strong>Total Siswa</strong></td>\n                            </tr>\n                            <tr>\n                                <td><strong id="pvRekapHadir">25</strong></td>\n                                <td><strong id="pvRekapDispensasi">1</strong></td>\n                                <td><strong id="pvRekapIzin">3</strong></td>\n                                <td><strong id="pvRekapSakit">0</strong></td>\n                                <td><strong id="pvRekapTidakHadir" style="color: red;">0</strong></td>\n                                <td><strong id="pvRekapTotal">29</strong></td>\n                            </tr>\n                        </tbody></table>\n                    </div>\n\n                    <!-- AREA TANDA TANGAN PENGAWAS -->\n                    <div class="signature-section">\n                        <div class="signature-row" id="pvSignatureRow" style="display: flex; justify-content: space-between;">\n                            <div class="signature-col" id="pvColPengawas2" style="width: 45%; text-align: center; display: none;">\n                                <div>Pengawas II,</div>\n                                <div class="signature-space">\n                                    <img id="pvSignImg2" style="display: none;" alt="TTD Pengawas 2">\n                                </div>\n                                <div class="signature-name" id="pvNamaPengawas2">....................................</div>\n                                <div class="signature-nip" id="pvNipPengawas2">NIP. .........................</div>\n                            </div>\n                            <div class="signature-col" id="pvColPengawas1" style="width: 45%; text-align: center; margin-left: auto;">\n                                <div>Pengawas I,</div>\n                                <div class="signature-space">\n                                    <img id="pvSignImg1" style="display: block;" alt="TTD Pengawas 1" src="data:image/png;base64,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">\n                                </div>\n                                <div class="signature-name" id="pvNamaPengawas1">I Wayan Sukadana, S.Pd.</div>\n                                <div class="signature-nip" id="pvNipPengawas1">NIP. 19820514 200801 1 012</div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            ');

SET FOREIGN_KEY_CHECKS = 1;

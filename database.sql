-- ========================================================
-- DATABASE SCHEMA & MASTER DATA: SISTEM ADMINISTRASI UJIAN
-- SMK NEGERI 1 KLUNGKUNG
-- Auto-synchronized: 2026-10-20T04:23:49.403Z
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

INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (1, 'XII TKJ', 'XII', 'Teknik Komputer dan Jaringan', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (2, 'XII DKV', 'XII', 'Desain Komunikasi Visual', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (3, 'XII LPKKK 1', 'XII', 'Layanan Penunjang Kefarmasian Klinis dan Komunitas', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (4, 'XII LPKKK 2', 'XII', 'Layanan Penunjang Kefarmasian Klinis dan Komunitas', 1);
INSERT INTO `classes` (`id`, `nama_kelas`, `tingkat`, `program_keahlian`, `is_active`) VALUES (5, 'XII BD 1', 'XII', 'Bisnis Digital', 1);
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


SET FOREIGN_KEY_CHECKS = 1;

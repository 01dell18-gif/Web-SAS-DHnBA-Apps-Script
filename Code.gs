/**
 * ==============================================================================
 * GENERATOR ABSENSI & BERITA ACARA UJIAN RESMI FORMAT A4
 * SMK NEGERI FYJ CHANNEL
 * Google Apps Script & Google Sheets Database Architecture
 * ==============================================================================
 */

// Global state untuk template rendering
var _activePage = 'landing';
var _activeParams = {};

// Nama sheet basis data
var SHEET_NAMES = {
  SETTINGS: 'Pengaturan',
  CLASSES: 'Kelas',
  STUDENTS: 'Siswa',
  TEACHERS: 'Guru',
  SUBJECTS: 'MataPelajaran',
  ACADEMIC_YEARS: 'TahunAjaran',
  TEMPLATES: 'TemplateUjian',
  ARCHIVES: 'ArsipDokumen',
  USERS: 'Users'
};

/**
 * Endpoint Utama Web App (Router Multi-Page)
 */
function doGet(e) {
  try {
    var page = (e && e.parameter && e.parameter.page) || 'landing';
    _activePage = page;
    _activeParams = e && e.parameter ? e.parameter : {};

    // Peta Rute URL ke File HTML Template
    var routeMap = {
      '': 'Index',
      'index': 'Index',
      'landing': 'Index',
      'home': 'Index',
      'absensi': 'Absensi',
      'berita-acara': 'BeritaAcara',
      'arsip': 'Arsip',
      'login': 'Login',
      'dashboard': 'AdminDashboard',
      'siswa': 'AdminSiswa',
      'guru': 'AdminGuru',
      'template': 'AdminTemplate',
      'admin-arsip': 'AdminArsip',
      'pengaturan': 'AdminPengaturan',
      'users': 'AdminUsers',
      'database': 'AdminDatabase'
    };

    var pageFile = routeMap[page] || 'Index';
    return renderTemplate(pageFile);
  } catch (err) {
    return HtmlService.createHtmlOutput('<div style="font-family: sans-serif; padding: 2rem;"><h2 style="color: #e11d48;">Terjadi Kesalahan Sistem</h2><p>' + err.message + '</p></div>')
      .setTitle('Error - Generator SAS');
  }
}

/**
 * Render file HTML dengan evaluasi scriptlet
 */
function renderTemplate(filename) {
  var template = HtmlService.createTemplateFromFile(filename);
  template.currentPage = _activePage;
  template.params = _activeParams;
  template.appUrl = getAppUrl();
  
  var settings = apiGetSettings();
  template.schoolSettings = settings;

  var titles = {
    'Index': 'Beranda - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'Landing': 'Beranda - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'Absensi': 'Generator Daftar Hadir Ujian - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'BeritaAcara': 'Generator Berita Acara Ujian - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'Arsip': 'Arsip Dokumen Ujian - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'Login': 'Login Administrator - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'AdminDashboard': 'Dashboard Admin - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'AdminSiswa': 'Master Siswa & Kelas - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'AdminGuru': 'Master Guru & Pengawas - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'AdminTemplate': 'Template Ujian - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'AdminArsip': 'Arsip Dokumen Admin - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'AdminPengaturan': 'Pengaturan Sekolah, Kelas & Kop - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'AdminUsers': 'Manajemen User - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL'),
    'AdminDatabase': 'Backup & Database - ' + (settings.school_name || 'SMK NEGERI FYJ CHANNEL')
  };

  var output = template.evaluate()
    .setTitle(titles[filename] || (settings.school_name || 'Generator Administrasi Ujian'))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  return output;
}

/**
 * Server-Side Template Inclusion (Scriptlet Pattern)
 */
function include(filename, data) {
  var t = HtmlService.createTemplateFromFile(filename);
  t.currentPage = _activePage;
  t.params = _activeParams;
  t.appUrl = getAppUrl();
  t.schoolSettings = apiGetSettings();
  
  if (data && typeof data === 'object') {
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        t[k] = data[k];
      }
    }
  }
  return t.evaluate().getContent();
}

/**
 * Mendapatkan URL Web App yang sedang aktif
 */
function getAppUrl() {
  try {
    var url = ScriptApp.getService().getUrl();
    if (url && url.length > 5) return url;
  } catch (e) {}

  try {
    var propsUrl = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL');
    if (propsUrl && propsUrl.length > 5) return propsUrl;
  } catch (e) {}

  return '';
}

/**
 * Set manual WEB_APP_URL jika diperlukan
 */
function setWebAppUrl(url) {
  PropertiesService.getScriptProperties().setProperty('WEB_APP_URL', url);
  return { success: true, message: 'WEB_APP_URL berhasil disimpan: ' + url };
}

// ==============================================================================
// LAPISAN BASIS DATA: GOOGLE SPREADSHEET DAO / ORM
// ==============================================================================

/**
 * Mendapatkan instance Spreadsheet Database (dengan caching untuk kecepatan maksimal)
 */
var _cachedSpreadsheet = null;
var _requestTableCache = {};

function clearRequestCache(sheetName) {
  _requestTableCache = {};
  try {
    var scriptCache = CacheService.getScriptCache();
    if (sheetName) {
      scriptCache.remove('sas_tbl_' + sheetName);
    } else {
      for (var k in SHEET_NAMES) {
        scriptCache.remove('sas_tbl_' + SHEET_NAMES[k]);
      }
      scriptCache.remove('sas_settings');
    }
  } catch (e) {}
}

function getDbSpreadsheet() {
  if (_cachedSpreadsheet) {
    try {
      _cachedSpreadsheet.getId();
      return _cachedSpreadsheet;
    } catch (e) {
      _cachedSpreadsheet = null;
    }
  }

  // 1. Prioritaskan Spreadsheet aktif (langsung otomatis jika Container-Bound script dari menu Ekstensi)
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      _cachedSpreadsheet = active;
      return active;
    }
  } catch (e) {}

  // 2. Jika Standalone script, periksa SPREADSHEET_ID yang dikonfigurasi di Script Properties
  var props = PropertiesService.getScriptProperties();
  var configuredId = props.getProperty('SPREADSHEET_ID');
  
  if (configuredId) {
    try {
      var ss = SpreadsheetApp.openById(configuredId);
      _cachedSpreadsheet = ss;
      return ss;
    } catch (e) {
      console.warn('Gagal membuka spreadsheet dari SPREADSHEET_ID:', e);
    }
  }

  // 3. Jika belum ada spreadsheet yang aktif maupun ID terkonfigurasi, buat baru secara otomatis
  var newSs = SpreadsheetApp.create('DB_SAS_SMK_NEGERI_FYJ_CHANNEL');
  props.setProperty('SPREADSHEET_ID', newSs.getId());
  _cachedSpreadsheet = newSs;
  setupSpreadsheetDatabase(false, newSs);
  return newSs;
}

/**
 * Set manual SPREADSHEET_ID via fungsi admin
 */
function setSpreadsheetId(id) {
  _cachedSpreadsheet = null;
  clearRequestCache();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
  return { success: true, message: 'SPREADSHEET_ID berhasil disimpan: ' + id };
}

/**
 * Helper mendapatkan sheet tertentu (otomatis dibuat jika belum ada)
 */
function getOrCreateSheet(sheetName, headers, ss) {
  var spreadsheet = ss || getDbSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    if (headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F1F5F9');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * Membaca data tabel sheet menjadi Array of Objects (dengan in-memory caching per-request)
 */
function getTableData(sheetName) {
  if (_requestTableCache && _requestTableCache[sheetName]) {
    return _requestTableCache[sheetName];
  }

  // Coba ambil dari CacheService (Apps Script Script Cache) untuk kecepatan maksimal (<10ms)
  var scriptCache = null;
  try {
    scriptCache = CacheService.getScriptCache();
    var cachedJson = scriptCache ? scriptCache.get('sas_tbl_' + sheetName) : null;
    if (cachedJson) {
      var cachedRows = JSON.parse(cachedJson);
      if (Array.isArray(cachedRows)) {
        if (!_requestTableCache) _requestTableCache = {};
        _requestTableCache[sheetName] = cachedRows;
        return cachedRows;
      }
    }
  } catch (e) {}

  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var rows = [];

  for (var r = 1; r < values.length; r++) {
    var rowObj = {};
    var hasData = false;
    for (var c = 0; c < headers.length; c++) {
      var val = values[r][c];
      if (val !== '' && val !== null && val !== undefined) hasData = true;
      rowObj[headers[c]] = val;
    }
    if (hasData) rows.push(rowObj);
  }

  if (!_requestTableCache) _requestTableCache = {};
  _requestTableCache[sheetName] = rows;

  // Simpan ke ScriptCache jika ukuran aman (< 95 KB)
  if (scriptCache) {
    try {
      var str = JSON.stringify(rows);
      if (str.length < 95000) {
        scriptCache.put('sas_tbl_' + sheetName, str, 1800); // 30 menit
      }
    } catch (e) {}
  }

  return rows;
}

/**
 * Menambahkan 1 baris ke tabel sheet
 */
function appendTableRow(sheetName, obj, defaultHeaders) {
  clearRequestCache();
  var ss = getDbSpreadsheet();
  var sheet = getOrCreateSheet(sheetName, defaultHeaders, ss);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  var headers = [];
  if (lastRow >= 1 && lastCol >= 1) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
  } else if (defaultHeaders) {
    headers = defaultHeaders;
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F1F5F9');
    sheet.setFrozenRows(1);
  }

  var rowVals = [];
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i];
    var val = obj[key];
    if (val === undefined || val === null) val = '';
    if (typeof val === 'object') val = JSON.stringify(val);
    rowVals.push(val);
  }

  sheet.appendRow(rowVals);
  return obj;
}

/**
 * Update 1 baris tabel berdasarkan kunci kolom
 */
function updateTableRow(sheetName, keyCol, keyVal, updateObj) {
  clearRequestCache();
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return false;

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var keyIdx = headers.indexOf(keyCol);
  if (keyIdx === -1) return false;

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][keyIdx]) === String(keyVal)) {
      for (var k in updateObj) {
        if (updateObj.hasOwnProperty(k)) {
          var cIdx = headers.indexOf(k);
          if (cIdx !== -1) {
            var v = updateObj[k];
            if (v === undefined || v === null) v = '';
            if (typeof v === 'object') v = JSON.stringify(v);
            values[r][cIdx] = v;
          }
        }
      }
      sheet.getRange(r + 1, 1, 1, lastCol).setValues([values[r]]);
      return true;
    }
  }
  return false;
}

/**
 * Hapus baris tabel berdasarkan kunci kolom
 */
function deleteTableRow(sheetName, keyCol, keyVal) {
  clearRequestCache();
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return false;

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var keyIdx = headers.indexOf(keyCol);
  if (keyIdx === -1) return false;

  for (var r = values.length - 1; r >= 1; r--) {
    if (String(values[r][keyIdx]) === String(keyVal)) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

/**
 * Tulis ulang seluruh sheet secara cepat menggunakan batch setValues
 */
function batchReplaceTable(sheetName, headers, objectsArray) {
  clearRequestCache();
  var ss = getDbSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(sheetName);
  }

  var matrix = [headers];
  for (var i = 0; i < objectsArray.length; i++) {
    var obj = objectsArray[i];
    var row = [];
    for (var c = 0; c < headers.length; c++) {
      var k = headers[c];
      var v = (obj && obj[k] !== undefined && obj[k] !== null) ? obj[k] : '';
      if (typeof v === 'object') v = JSON.stringify(v);
      row.push(v);
    }
    matrix.push(row);
  }

  sheet.getRange(1, 1, matrix.length, headers.length).setValues(matrix);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F1F5F9');
  sheet.setFrozenRows(1);
  return true;
}

// ==============================================================================
// INISIALISASI & SEEDER OTOMATIS BASIS DATA SPREADSHEET
// ==============================================================================

var SEED_DATA = {"classes":[{"id":1,"nama_kelas":"XII TKJ","tingkat":"XII","program_keahlian":"Teknik Komputer dan Jaringan","is_active":1},{"id":2,"nama_kelas":"XII DKV","tingkat":"XII","program_keahlian":"Desain Komunikasi Visual","is_active":1},{"id":3,"nama_kelas":"XII LPKKK 1","tingkat":"XII","program_keahlian":"Layanan Penunjang Kefarmasian Klinis dan Komunitas","is_active":1},{"id":4,"nama_kelas":"XII BD 1","tingkat":"XII","program_keahlian":"Bisnis Digital","is_active":1},{"id":5,"nama_kelas":"XII MP 1","tingkat":"XII","program_keahlian":"Manajemen Perkantoran dan Layanan Bisnis","is_active":1}],"students":[{"id":1,"class_id":1,"nis":"13561","nama":"Agustinus Poka Mete"},{"id":2,"class_id":1,"nis":"13562","nama":"Akbar Alfiansah"},{"id":3,"class_id":1,"nis":"13563","nama":"Dwi Retno Ayuningrum"},{"id":4,"class_id":1,"nis":"13565","nama":"I Gede Adtya Wedha Paramartha"},{"id":5,"class_id":1,"nis":"13566","nama":"I Gede Putra Sang Pajar"}],"teachers":[{"id":1,"nama":"I Wayan Sukadana, S.Pd.","nip":"19820514 200801 1 012","mapel":"Teknik Komputer dan Jaringan","jabatan":"Guru Madya / Pengawas"},{"id":2,"nama":"Ni Made Rai Artini, S.Kom.","nip":"19870921 201101 2 008","mapel":"Desain Komunikasi Visual","jabatan":"Guru Muda / Pengawas"},{"id":3,"nama":"Drs. I Ketut Suardana, M.Pd.","nip":"19680315 199412 1 002","mapel":"Bahasa Indonesia","jabatan":"Guru Pembina / Pengawas"},{"id":4,"nama":"Ni Luh Putu Dewi Lestari, S.Pd.","nip":"19841120 200902 2 005","mapel":"Matematika","jabatan":"Guru Madya / Pengawas"},{"id":5,"nama":"I Made Agus Wira Pratama, S.T.","nip":"19890610 201503 1 004","mapel":"Teknik Sepeda Motor","jabatan":"Guru Muda / Pengawas"}],"subjects":["Desain Komunikasi Visual","Teknik Komputer dan Jaringan","Layanan Penunjang Kefarmasian Klinis dan Komunitas","Bisnis Digital","Manajemen Perkantoran dan Layanan Bisnis"],"academic_years":["2024/2025","2025/2026","2026/2027","2027/2028","2028/2029"],"templates":[{"id":1,"nama_ujian":"Sumatif Akhir Semester (SAS)","tahun_ajaran":"2026/2027","semester":"Ganjil","judul_berita_acara":"BERITA ACARA \nPENYELENGGARAAN SUMATIF AKHIR SEMESTER (SAS) GANJIL\nTAHUN AJARAN [tahun_ajaran]","redaksi_isi":"<p>Pada hari ini [hari], tanggal [tanggal] ([tanggal_teks]) bulan [bulan] tahun [tahun] ([tahun_teks]):</p>\n<ol style=\"margin-top: 6px; margin-bottom: 12px;\">\n<li style=\"margin-bottom: 8px;\">Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran] dari pukul [jam_mulai] sampai dengan pukul [jam_selesai] WITA.\n<ul style=\"margin-bottom: 6px; margin-left: 20px; list-style-type: disc;\">\n<li>Pada Sekolah:&nbsp;<strong>[sekolah]</strong></li>\n<li>Kelas:&nbsp;<strong>[kelas]</strong></li>\n<li>Mata Pelajaran:&nbsp;<strong>[mata_pelajaran]</strong></li>\n<li>Ruang:&nbsp;<strong>[ruang]</strong></li>\n<li>Jumlah Peserta Seharusnya:&nbsp;<strong>[peserta_seharusnya]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Tidak Hadir:&nbsp;<strong>[peserta_tidak_hadir]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Hadir:&nbsp;<strong>[peserta_hadir]</strong>&nbsp;orang</li>\n</ul>\n</li>\n<li style=\"margin-bottom: 8px;\">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):[catatan_pelaksanaan]</li>\n<li style=\"margin-bottom: 8px;\">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):<br><em>[catatan_pelaksanaan]</em></li>\n</ol>\n<p style=\"margin-top: 15px;\">Demikian Berita Acara ini dibuat dengan sesungguhnya.</p>\n<p style=\"margin-top: 15px;\"><span style=\"font-size: 14.6667px;\"><br></span></p>\n<p style=\"text-align: center; margin-top: 15px;\"><span style=\"font-size: 14.6667px;\">Yang membuat berita acara :</span></p>","redaksi_pembuka":"Pada hari ini [hari], tanggal [tanggal] bulan [bulan] tahun [tahun].","redaksi_poin_1":"Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran] dari pukul [jam_mulai] sampai dengan pukul [jam_selesai].\n- Pada Sekolah: SMK NEGERI FYJ CHANNEL\n- Mata Pelajaran: [mata_pelajaran]\n- Kelas: [kelas]\n- Ruang: [ruang]\n- Jumlah Peserta Seharusnya: [peserta_seharusnya] orang\n- Jumlah Peserta yang Tidak Hadir: [peserta_tidak_hadir] orang\n- Jumlah Peserta yang Hadir: [peserta_hadir] orang","redaksi_poin_2":"Telah dibagikan tautan soal ujian online untuk Mata Pelajaran [mata_pelajaran] di ruang [ruang] dengan disaksikan oleh para peserta, serta telah dibagikan lembar blangko berita acara sebanyak [blangko_berita_acara] eksemplar dan blangko daftar hadir sebanyak [blangko_daftar_hadir] eksemplar.","label_catatan":"Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):","aktif":1}],"settings":{"school_name":"SMK NEGERI FYJ CHANNEL","school_tagline":"Generator Administrasi Ujian","kop_header":"https://drive.google.com/thumbnail?id=1Z80pVGJv9v-GFwjE1_kBi_G9uRlR2gN7","school_logo":"https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI","academic_year":"2026/2027","default_semester":"Ganjil","timezone":"WITA","academic_years":["2024/2025","2025/2026","2026/2027","2027/2028","2028/2029"],"subjects":["Desain Komunikasi Visual","Teknik Komputer dan Jaringan","Layanan Penunjang Kefarmasian Klinis dan Komunitas","Bisnis Digital","Manajemen Perkantoran dan Layanan Bisnis"],"active_template_id":1,"drive_folder_url":"https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR","drive_folder_id":"19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR"},"users":[{"id":1,"username":"admin","password":"admin123","nama":"Administrator FYJ Channel","role":"admin"},{"id":2,"username":"guru","password":"guru123","nama":"Ni Made Rai Artini, S.Kom.","role":"operator","created_at":"2026-10-20T03:27:58.858Z"}]};

/**
 * Fungsi Setup Inisialisasi Database Spreadsheet
 */
function setupSpreadsheetDatabase(forceReset, targetSs) {
  var ss = targetSs || getDbSpreadsheet();

  // 1. Sheet Pengaturan (Key, Value)
  var settingsHeaders = ['key', 'value'];
  var currentSettings = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!currentSettings || forceReset) {
    var setRows = [];
    for (var k in SEED_DATA.settings) {
      if (SEED_DATA.settings.hasOwnProperty(k)) {
        var val = SEED_DATA.settings[k];
        setRows.push({ key: k, value: typeof val === 'object' ? JSON.stringify(val) : String(val) });
      }
    }
    batchReplaceTable(SHEET_NAMES.SETTINGS, settingsHeaders, setRows);
  }

  // 2. Sheet Kelas
  var classHeaders = ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'is_active'];
  var currentClasses = ss.getSheetByName(SHEET_NAMES.CLASSES);
  if (!currentClasses || forceReset) {
    batchReplaceTable(SHEET_NAMES.CLASSES, classHeaders, SEED_DATA.classes || []);
  }

  // 3. Sheet Siswa
  var studentHeaders = ['id', 'class_id', 'nis', 'nama'];
  var currentStudents = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!currentStudents || forceReset) {
    batchReplaceTable(SHEET_NAMES.STUDENTS, studentHeaders, SEED_DATA.students || []);
  }

  // 4. Sheet Guru & Pengawas
  var teacherHeaders = ['id', 'nama', 'nip', 'mapel', 'jabatan', 'is_active'];
  var currentTeachers = ss.getSheetByName(SHEET_NAMES.TEACHERS);
  if (!currentTeachers || forceReset) {
    batchReplaceTable(SHEET_NAMES.TEACHERS, teacherHeaders, SEED_DATA.teachers || []);
  }

  // 5. Sheet Mata Pelajaran
  var subjectHeaders = ['id', 'nama_mapel'];
  var currentSubjects = ss.getSheetByName(SHEET_NAMES.SUBJECTS);
  if (!currentSubjects || forceReset) {
    var subRows = (SEED_DATA.subjects || []).map(function(s, idx) {
      return { id: idx + 1, nama_mapel: s };
    });
    batchReplaceTable(SHEET_NAMES.SUBJECTS, subjectHeaders, subRows);
  }

  // 6. Sheet Tahun Ajaran
  var yearHeaders = ['id', 'tahun_ajaran'];
  var currentYears = ss.getSheetByName(SHEET_NAMES.ACADEMIC_YEARS);
  if (!currentYears || forceReset) {
    var yearRows = (SEED_DATA.academic_years || []).map(function(y, idx) {
      return { id: idx + 1, tahun_ajaran: y };
    });
    batchReplaceTable(SHEET_NAMES.ACADEMIC_YEARS, yearHeaders, yearRows);
  }

  // 7. Sheet Template Ujian
  var templateHeaders = ['id', 'nama_ujian', 'tahun_ajaran', 'semester', 'judul_berita_acara', 'redaksi_isi', 'redaksi_pembuka', 'redaksi_poin_1', 'redaksi_poin_2', 'label_catatan', 'aktif'];
  var currentTemplates = ss.getSheetByName(SHEET_NAMES.TEMPLATES);
  if (!currentTemplates || forceReset) {
    batchReplaceTable(SHEET_NAMES.TEMPLATES, templateHeaders, SEED_DATA.templates || []);
  }

  // 8. Sheet Users
  var userHeaders = ['id', 'username', 'password', 'nama', 'role', 'created_at'];
  var currentUsers = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!currentUsers || forceReset) {
    batchReplaceTable(SHEET_NAMES.USERS, userHeaders, SEED_DATA.users || []);
  }

  // 9. Sheet Arsip Dokumen
  var archiveHeaders = [
    'id', 'type', 'title', 'filename', 'nama_ujian', 'tahun_ajaran', 'semester',
    'tanggal_ujian', 'mata_pelajaran', 'nama_kelas', 'class_id', 'ruang',
    'peserta_seharusnya', 'peserta_hadir', 'peserta_tidak_hadir', 'siswa_tidak_hadir',
    'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2',
    'html_content', 'created_at'
  ];
  getOrCreateSheet(SHEET_NAMES.ARCHIVES, archiveHeaders, ss);

  // Bersihkan sheet 'Sheet1' bawaan jika ada
  var defaultSheet1 = ss.getSheetByName('Sheet1');
  if (defaultSheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet1); } catch (e) {}
  }

  return {
    success: true,
    message: 'Basis data Google Spreadsheet berhasil diinisialisasi dan diisi data awal!',
    spreadsheetUrl: ss.getUrl()
  };
}

/**
 * ==============================================================================
 * FUNGSI EKSEKUSI PERTAMA KALI (SEEDER DATABASE SPREADSHEET)
 * ==============================================================================
 * Petunjuk:
 * 1. Di editor Google Apps Script, pilih fungsi 'jalankanIsiDataAwal' dari dropdown fungsi di toolbar atas.
 * 2. Klik tombol 'Jalankan' (Run).
 * 3. Beri izin otorisasi saat diminta (Review Permissions -> Akun Anda -> Advanced -> Buka -> Allow).
 * 4. Seluruh 9 sheet (Pengaturan, Kelas, Siswa, Guru, MataPelajaran, TahunAjaran, TemplateUjian, Users, ArsipDokumen)
 *    akan langsung otomatis dibuat dan terisi data bawaan (seeder).
 */
function jalankanIsiDataAwal() {
  var res = setupSpreadsheetDatabase(true);
  Logger.log('=== SEEDER BASIS DATA BERHASIL ===');
  Logger.log('Status: ' + res.message);
  Logger.log('URL Spreadsheet: ' + res.spreadsheetUrl);
  return res;
}

// ==============================================================================
// RPC API CONTROLLER (DIPANGGIL DARI CLIENT VIA google.script.run)
// ==============================================================================

/**
 * 1. Ambil Pengaturan Sistem
 */
function apiGetSettings() {
  var rows = getTableData(SHEET_NAMES.SETTINGS);
  if (!rows || rows.length === 0) {
    setupSpreadsheetDatabase(false);
    rows = getTableData(SHEET_NAMES.SETTINGS);
  }
  var settings = {};
  for (var i = 0; i < rows.length; i++) {
    var k = rows[i].key;
    var v = rows[i].value;
    if (k) {
      try {
        if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
          settings[k] = JSON.parse(v);
        } else {
          settings[k] = v;
        }
      } catch (e) {
        settings[k] = v;
      }
    }
  }

  // Fallback defaults jika kosong
  if (!settings.school_name) settings.school_name = 'SMK NEGERI FYJ CHANNEL';
  if (!settings.school_tagline) settings.school_tagline = 'Generator Administrasi Ujian';
  if (!settings.school_logo || settings.school_logo.indexOf("/assets/") !== -1) settings.school_logo = SEED_DATA.settings.school_logo;
  if (!settings.kop_header || settings.kop_header.indexOf("/assets/") !== -1) settings.kop_header = SEED_DATA.settings.kop_header;
  if (!settings.academic_year) settings.academic_year = '2026/2027';
  if (!settings.default_semester) settings.default_semester = 'Ganjil';
  if (!settings.timezone) settings.timezone = 'WITA';
  if (!settings.drive_folder_url) settings.drive_folder_url = 'https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR';
  if (!settings.drive_folder_id) settings.drive_folder_id = '19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR';

  return settings;
}

/**
 * Simpan Pengaturan Sistem
 */
function apiSaveSettings(newSettings) {
  try {
    var current = apiGetSettings();
    for (var k in newSettings) {
      if (newSettings.hasOwnProperty(k)) {
        current[k] = newSettings[k];
      }
    }
    var rows = [];
    for (var key in current) {
      if (current.hasOwnProperty(key)) {
        var v = current[key];
        rows.push({ key: key, value: typeof v === 'object' ? JSON.stringify(v) : String(v) });
      }
    }
    batchReplaceTable(SHEET_NAMES.SETTINGS, ['key', 'value'], rows);
    return { success: true, message: 'Pengaturan sekolah berhasil disimpan ke spreadsheet!', settings: current };
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan pengaturan: ' + err.message };
  }
}

/**
 * Upload Logo Sekolah Baru (Base64)
 */
function apiUploadLogo(base64Data) {
  try {
    var settings = apiGetSettings();
    settings.school_logo = base64Data;
    apiSaveSettings(settings);
    return { success: true, message: 'Logo sekolah resmi berhasil diperbarui!', url: base64Data };
  } catch (err) {
    return { success: false, message: 'Gagal memperbarui logo: ' + err.message };
  }
}

/**
 * Reset Logo ke Bawaan
 */
function apiResetLogo() {
  try {
    var defaultLogo = SEED_DATA.settings.school_logo;
    var settings = apiGetSettings();
    settings.school_logo = defaultLogo;
    apiSaveSettings(settings);
    return { success: true, message: 'Logo sekolah berhasil direset ke standar default!', url: defaultLogo };
  } catch (err) {
    return { success: false, message: 'Gagal mereset logo: ' + err.message };
  }
}

/**
 * Upload Kop Surat Baru (Base64)
 */
function apiUploadKop(base64Data) {
  try {
    var settings = apiGetSettings();
    settings.kop_header = base64Data;
    apiSaveSettings(settings);
    return { success: true, message: 'Kop surat resmi berhasil diunggah dan disimpan!', url: base64Data };
  } catch (err) {
    return { success: false, message: 'Gagal mengunggah kop surat: ' + err.message };
  }
}

/**
 * Reset Kop Surat ke Bawaan
 */
function apiResetKop() {
  try {
    var defaultKop = SEED_DATA.settings.kop_header;
    var settings = apiGetSettings();
    settings.kop_header = defaultKop;
    apiSaveSettings(settings);
    return { success: true, message: 'Kop surat berhasil direset ke standar default!', url: defaultKop };
  } catch (err) {
    return { success: false, message: 'Gagal mereset kop surat: ' + err.message };
  }
}

/**
 * 2. Ambil Initial Data Lengkap untuk Aplikasi
 */
function apiGetInitialData() {
  var settings = apiGetSettings();
  var classes = apiGetClasses();
  var templates = apiGetTemplates();
  var subjects = apiGetSubjects();
  var academicYears = apiGetAcademicYears();
  var teachers = apiGetTeachers();
  var students = apiGetStudents();
  var archives = apiGetArchives();
  var users = apiGetUsers();

  return {
    success: true,
    settings: settings,
    classes: classes,
    templates: templates,
    subjects: subjects,
    academic_years: academicYears,
    teachers: teachers,
    students: students,
    archives: archives,
    users: users
  };
}

/**
 * 3. Kelas (Classes)
 */
function apiGetClasses() {
  var rows = getTableData(SHEET_NAMES.CLASSES);
  return rows.map(function(r) {
    return {
      id: Number(r.id) || r.id,
      nama_kelas: String(r.nama_kelas || '').trim(),
      tingkat: String(r.tingkat || '').trim(),
      program_keahlian: String(r.program_keahlian || '').trim(),
      is_active: Number(r.is_active) || 1
    };
  });
}

function apiSaveClass(classObj) {
  try {
    var classes = apiGetClasses();
    var cId = classObj.id ? Number(classObj.id) : null;
    var namaKelas = String(classObj.nama_kelas || '').trim();
    var tingkat = String(classObj.tingkat || '').trim();
    var program = String(classObj.program_keahlian || '').trim();

    if (!namaKelas) {
      return { success: false, message: 'Nama kelas wajib diisi!' };
    }

    if (cId) {
      var existing = classes.find(function(c) { return c.id === cId; });
      if (!existing) return { success: false, message: 'Kelas tidak ditemukan.' };
      
      var oldName = existing.nama_kelas;
      updateTableRow(SHEET_NAMES.CLASSES, 'id', cId, {
        nama_kelas: namaKelas,
        tingkat: tingkat,
        program_keahlian: program,
        is_active: 1
      });

      // Cascade update ke siswa jika nama berubah
      if (oldName !== namaKelas) {
        apiCascadeUpdateClass(oldName, namaKelas, tingkat, program);
      }
      return { success: true, message: 'Data kelas berhasil diperbarui!', id: cId };
    } else {
      var nextId = classes.reduce(function(max, c) { return Math.max(max, Number(c.id) || 0); }, 0) + 1;
      appendTableRow(SHEET_NAMES.CLASSES, {
        id: nextId,
        nama_kelas: namaKelas,
        tingkat: tingkat,
        program_keahlian: program,
        is_active: 1
      }, ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'is_active']);
      return { success: true, message: 'Kelas baru berhasil ditambahkan!', id: nextId };
    }
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan kelas: ' + err.message };
  }
}

function apiDeleteClass(classId) {
  try {
    deleteTableRow(SHEET_NAMES.CLASSES, 'id', classId);
    return { success: true, message: 'Kelas berhasil dihapus.' };
  } catch (err) {
    return { success: false, message: 'Gagal menghapus kelas: ' + err.message };
  }
}

function apiDeleteClassStudents(classId, deleteClass) {
  try {
    var ss = getDbSpreadsheet();
    var students = apiGetStudents();
    var beforeCount = students.length;
    var filtered = students.filter(function(s) { return String(s.class_id) !== String(classId); });
    var deletedCount = beforeCount - filtered.length;

    batchReplaceTable(SHEET_NAMES.STUDENTS, ['id', 'class_id', 'nis', 'nama'], filtered);

    if (deleteClass) {
      deleteTableRow(SHEET_NAMES.CLASSES, 'id', classId);
    }

    return {
      success: true,
      message: 'Berhasil menghapus ' + deletedCount + ' siswa' + (deleteClass ? ' dan kelas terkait.' : '.'),
      deletedCount: deletedCount
    };
  } catch (err) {
    return { success: false, message: 'Gagal menghapus siswa kelas: ' + err.message };
  }
}

function apiCascadeUpdateClass(oldName, newName, tingkat, jurusan) {
  try {
    // Cari class_id
    var classes = apiGetClasses();
    var targetClass = classes.find(function(c) { return c.nama_kelas === newName || c.nama_kelas === oldName; });
    var classId = targetClass ? targetClass.id : null;

    // Update arsip dokumen yang memakai nama_kelas lama
    var archives = apiGetArchives();
    var archChanged = false;
    archives.forEach(function(a) {
      if (a.nama_kelas === oldName) {
        a.nama_kelas = newName;
        archChanged = true;
      }
    });
    if (archChanged) {
      var archHeaders = [
        'id', 'type', 'title', 'filename', 'nama_ujian', 'tahun_ajaran', 'semester',
        'tanggal_ujian', 'mata_pelajaran', 'nama_kelas', 'class_id', 'ruang',
        'peserta_seharusnya', 'peserta_hadir', 'peserta_tidak_hadir', 'siswa_tidak_hadir',
        'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2',
        'html_content', 'created_at'
      ];
      batchReplaceTable(SHEET_NAMES.ARCHIVES, archHeaders, archives);
    }

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function apiImportClasses(classesList) {
  try {
    if (!Array.isArray(classesList) || classesList.length === 0) {
      return { success: false, message: 'Daftar kelas tidak boleh kosong.' };
    }
    var current = apiGetClasses();
    var nextId = current.reduce(function(max, c) { return Math.max(max, Number(c.id) || 0); }, 0) + 1;
    var importedCount = 0;

    classesList.forEach(function(item) {
      var name = String(item.nama_kelas || item.nama || '').trim();
      if (!name) return;
      var existing = current.find(function(c) { return c.nama_kelas.toLowerCase() === name.toLowerCase(); });
      if (!existing) {
        current.push({
          id: nextId++,
          nama_kelas: name,
          tingkat: item.tingkat || (name.startsWith('XII') ? 'XII' : name.startsWith('XI') ? 'XI' : 'X'),
          program_keahlian: item.program_keahlian || item.jurusan || '',
          is_active: 1
        });
        importedCount++;
      }
    });

    batchReplaceTable(SHEET_NAMES.CLASSES, ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'is_active'], current);
    return { success: true, message: 'Berhasil mengimpor ' + importedCount + ' kelas baru!', importedCount: importedCount };
  } catch (err) {
    return { success: false, message: 'Gagal mengimpor kelas: ' + err.message };
  }
}

/**
 * 4. Siswa (Students)
 */
function apiGetStudents(classId) {
  var rows = getTableData(SHEET_NAMES.STUDENTS);
  var mapped = rows.map(function(r) {
    return {
      id: Number(r.id) || r.id,
      class_id: Number(r.class_id) || r.class_id,
      nis: String(r.nis || '').trim(),
      nama: String(r.nama || '').trim()
    };
  });

  if (classId) {
    return mapped.filter(function(s) { return String(s.class_id) === String(classId); });
  }
  return mapped;
}

function apiSaveStudent(studentObj) {
  try {
    var students = apiGetStudents();
    var sId = studentObj.id ? Number(studentObj.id) : null;
    var nis = String(studentObj.nis || '').trim();
    var nama = String(studentObj.nama || '').trim();
    var classId = studentObj.class_id ? Number(studentObj.class_id) : null;
    var namaKelas = String(studentObj.nama_kelas || '').trim();

    if (!nama) return { success: false, message: 'Nama siswa wajib diisi!' };

    // Auto-register kelas baru jika dikirimkan nama kelas dan class_id belum ada
    if (!classId && namaKelas) {
      var classes = apiGetClasses();
      var foundClass = classes.find(function(c) { return c.nama_kelas.toLowerCase() === namaKelas.toLowerCase(); });
      if (foundClass) {
        classId = foundClass.id;
      } else {
        var newClassRes = apiSaveClass({
          nama_kelas: namaKelas,
          tingkat: studentObj.tingkat || (namaKelas.startsWith('XII') ? 'XII' : namaKelas.startsWith('XI') ? 'XI' : 'X'),
          program_keahlian: studentObj.program_keahlian || ''
        });
        classId = newClassRes.id;
      }
    }

    if (!classId) return { success: false, message: 'Kelas untuk siswa harus dipilih atau diisi!' };

    if (sId) {
      updateTableRow(SHEET_NAMES.STUDENTS, 'id', sId, {
        class_id: classId,
        nis: nis,
        nama: nama
      });
      return { success: true, message: 'Data siswa berhasil diperbarui!' };
    } else {
      var nextId = students.reduce(function(max, s) { return Math.max(max, Number(s.id) || 0); }, 0) + 1;
      appendTableRow(SHEET_NAMES.STUDENTS, {
        id: nextId,
        class_id: classId,
        nis: nis,
        nama: nama
      }, ['id', 'class_id', 'nis', 'nama']);
      return { success: true, message: 'Siswa berhasil ditambahkan!', id: nextId };
    }
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan siswa: ' + err.message };
  }
}

function apiDeleteStudent(studentId) {
  try {
    deleteTableRow(SHEET_NAMES.STUDENTS, 'id', studentId);
    return { success: true, message: 'Siswa berhasil dihapus.' };
  } catch (err) {
    return { success: false, message: 'Gagal menghapus siswa: ' + err.message };
  }
}

function apiDeleteAllStudents(resetClasses) {
  try {
    batchReplaceTable(SHEET_NAMES.STUDENTS, ['id', 'class_id', 'nis', 'nama'], []);
    if (resetClasses === true) {
      batchReplaceTable(SHEET_NAMES.CLASSES, ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'is_active'], []);
    }
    return {
      success: true,
      message: 'Seluruh data siswa berhasil dikosongkan' + (resetClasses ? ' dan master kelas telah direset.' : '.')
    };
  } catch (err) {
    return { success: false, message: 'Gagal mengosongkan siswa: ' + err.message };
  }
}

function apiImportStudents(studentsList) {
  try {
    if (!Array.isArray(studentsList) || studentsList.length === 0) {
      return { success: false, message: 'Tidak ada data siswa untuk diimpor.' };
    }

    var classes = apiGetClasses();
    var currentStudents = apiGetStudents();
    var nextStudentId = currentStudents.reduce(function(max, s) { return Math.max(max, Number(s.id) || 0); }, 0) + 1;
    var nextClassId = classes.reduce(function(max, c) { return Math.max(max, Number(c.id) || 0); }, 0) + 1;

    var classMap = {};
    classes.forEach(function(c) {
      classMap[c.nama_kelas.toLowerCase()] = c.id;
    });

    var newClassesToAppend = [];
    var newStudentsToAppend = [];

    studentsList.forEach(function(item) {
      var nama = String(item.nama || item.nama_siswa || '').trim();
      var nis = String(item.nis || '').trim();
      var namaKelas = String(item.nama_kelas || item.kelas || '').trim();
      var tingkat = String(item.tingkat || '').trim();
      var program = String(item.program_keahlian || item.jurusan || '').trim();

      if (!nama || !namaKelas) return;

      var cKey = namaKelas.toLowerCase();
      var targetClassId = classMap[cKey];

      if (!targetClassId) {
        targetClassId = nextClassId++;
        classMap[cKey] = targetClassId;
        var newCls = {
          id: targetClassId,
          nama_kelas: namaKelas,
          tingkat: tingkat || (namaKelas.startsWith('XII') ? 'XII' : namaKelas.startsWith('XI') ? 'XI' : 'X'),
          program_keahlian: program,
          is_active: 1
        };
        classes.push(newCls);
        newClassesToAppend.push(newCls);
      }

      newStudentsToAppend.push({
        id: nextStudentId++,
        class_id: targetClassId,
        nis: nis,
        nama: nama
      });
    });

    if (newClassesToAppend.length > 0) {
      batchReplaceTable(SHEET_NAMES.CLASSES, ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'is_active'], classes);
    }

    var allStudents = currentStudents.concat(newStudentsToAppend);
    batchReplaceTable(SHEET_NAMES.STUDENTS, ['id', 'class_id', 'nis', 'nama'], allStudents);

    return {
      success: true,
      message: 'Berhasil mengimpor ' + newStudentsToAppend.length + ' siswa dan ' + newClassesToAppend.length + ' kelas baru!',
      importedStudents: newStudentsToAppend.length,
      importedClasses: newClassesToAppend.length
    };
  } catch (err) {
    return { success: false, message: 'Gagal mengimpor siswa: ' + err.message };
  }
}

/**
 * 5. Guru & Pengawas (Teachers)
 */
function apiGetTeachers() {
  var rows = getTableData(SHEET_NAMES.TEACHERS);
  return rows.map(function(r) {
    return {
      id: Number(r.id) || r.id,
      nama: String(r.nama || '').trim(),
      nip: String(r.nip || '').trim(),
      mapel: String(r.mapel || r.mata_pelajaran || '').trim(),
      jabatan: String(r.jabatan || 'Guru / Pengawas').trim(),
      is_active: Number(r.is_active) || 1
    };
  });
}

function apiSaveTeacher(teacherObj) {
  try {
    var teachers = apiGetTeachers();
    var tId = teacherObj.id ? Number(teacherObj.id) : null;
    var nama = String(teacherObj.nama || '').trim();
    var nip = String(teacherObj.nip || '').trim();
    var mapel = String(teacherObj.mapel || teacherObj.mata_pelajaran || '').trim();
    var jabatan = String(teacherObj.jabatan || 'Guru / Pengawas').trim();

    if (!nama) return { success: false, message: 'Nama guru wajib diisi!' };

    if (tId) {
      updateTableRow(SHEET_NAMES.TEACHERS, 'id', tId, {
        nama: nama,
        nip: nip,
        mapel: mapel,
        jabatan: jabatan,
        is_active: 1
      });
      return { success: true, message: 'Data guru berhasil diperbarui!' };
    } else {
      var nextId = teachers.reduce(function(max, t) { return Math.max(max, Number(t.id) || 0); }, 0) + 1;
      appendTableRow(SHEET_NAMES.TEACHERS, {
        id: nextId,
        nama: nama,
        nip: nip,
        mapel: mapel,
        jabatan: jabatan,
        is_active: 1
      }, ['id', 'nama', 'nip', 'mapel', 'jabatan', 'is_active']);
      return { success: true, message: 'Guru baru berhasil ditambahkan!', id: nextId };
    }
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan guru: ' + err.message };
  }
}

function apiDeleteTeacher(teacherId) {
  try {
    deleteTableRow(SHEET_NAMES.TEACHERS, 'id', teacherId);
    return { success: true, message: 'Data guru berhasil dihapus.' };
  } catch (err) {
    return { success: false, message: 'Gagal menghapus guru: ' + err.message };
  }
}

function apiDeleteAllTeachers() {
  try {
    batchReplaceTable(SHEET_NAMES.TEACHERS, ['id', 'nama', 'nip', 'mapel', 'jabatan', 'is_active'], []);
    return { success: true, message: 'Seluruh data guru berhasil dikosongkan.' };
  } catch (err) {
    return { success: false, message: 'Gagal mengosongkan guru: ' + err.message };
  }
}

function apiImportTeachers(teachersList) {
  try {
    if (!Array.isArray(teachersList) || teachersList.length === 0) {
      return { success: false, message: 'Tidak ada data guru untuk diimpor.' };
    }

    var current = apiGetTeachers();
    var nextId = current.reduce(function(max, t) { return Math.max(max, Number(t.id) || 0); }, 0) + 1;
    var newTeachers = [];

    teachersList.forEach(function(item) {
      var nama = String(item.nama || item.nama_lengkap || '').trim();
      if (!nama) return;
      newTeachers.push({
        id: nextId++,
        nama: nama,
        nip: String(item.nip || '').trim(),
        mapel: String(item.mapel || item.mata_pelajaran || '').trim(),
        jabatan: String(item.jabatan || 'Guru / Pengawas').trim(),
        is_active: 1
      });
    });

    var combined = current.concat(newTeachers);
    batchReplaceTable(SHEET_NAMES.TEACHERS, ['id', 'nama', 'nip', 'mapel', 'jabatan', 'is_active'], combined);

    return { success: true, message: 'Berhasil mengimpor ' + newTeachers.length + ' guru!', importedCount: newTeachers.length };
  } catch (err) {
    return { success: false, message: 'Gagal mengimpor guru: ' + err.message };
  }
}

/**
 * 6. Mata Pelajaran (Subjects)
 */
function apiGetSubjects() {
  var rows = getTableData(SHEET_NAMES.SUBJECTS);
  if (!rows || rows.length === 0) return SEED_DATA.subjects || [];
  return rows.map(function(r) { return String(r.nama_mapel || '').trim(); }).filter(Boolean);
}

function apiSaveSubjects(subjectsList) {
  try {
    if (!Array.isArray(subjectsList)) subjectsList = [];
    var rows = subjectsList.map(function(s, idx) {
      return { id: idx + 1, nama_mapel: String(s).trim() };
    }).filter(function(r) { return r.nama_mapel; });

    batchReplaceTable(SHEET_NAMES.SUBJECTS, ['id', 'nama_mapel'], rows);
    
    // Update juga di Settings
    var settings = apiGetSettings();
    settings.subjects = subjectsList;
    apiSaveSettings(settings);

    return { success: true, message: 'Daftar mata pelajaran berhasil diperbarui!' };
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan mata pelajaran: ' + err.message };
  }
}

/**
 * 7. Tahun Ajaran (Academic Years)
 */
function apiGetAcademicYears() {
  var rows = getTableData(SHEET_NAMES.ACADEMIC_YEARS);
  if (!rows || rows.length === 0) return SEED_DATA.academic_years || [];
  return rows.map(function(r) { return String(r.tahun_ajaran || '').trim(); }).filter(Boolean);
}

function apiSaveAcademicYears(yearsList) {
  try {
    if (!Array.isArray(yearsList)) yearsList = [];
    var rows = yearsList.map(function(y, idx) {
      return { id: idx + 1, tahun_ajaran: String(y).trim() };
    }).filter(function(r) { return r.tahun_ajaran; });

    batchReplaceTable(SHEET_NAMES.ACADEMIC_YEARS, ['id', 'tahun_ajaran'], rows);

    var settings = apiGetSettings();
    settings.academic_years = yearsList;
    apiSaveSettings(settings);

    return { success: true, message: 'Daftar tahun ajaran berhasil disimpan!' };
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan tahun ajaran: ' + err.message };
  }
}

/**
 * 8. Template Ujian
 */
function apiGetTemplates() {
  var rows = getTableData(SHEET_NAMES.TEMPLATES);
  return rows.map(function(r) {
    return {
      id: Number(r.id) || r.id,
      nama_ujian: String(r.nama_ujian || '').trim(),
      tahun_ajaran: String(r.tahun_ajaran || '').trim(),
      semester: String(r.semester || 'Ganjil').trim(),
      judul_berita_acara: String(r.judul_berita_acara || '').trim(),
      redaksi_isi: String(r.redaksi_isi || ''),
      redaksi_pembuka: String(r.redaksi_pembuka || ''),
      redaksi_poin_1: String(r.redaksi_poin_1 || ''),
      redaksi_poin_2: String(r.redaksi_poin_2 || ''),
      label_catatan: String(r.label_catatan || ''),
      aktif: Number(r.aktif) ? 1 : 0
    };
  });
}

function apiSaveTemplate(tplObj) {
  try {
    var templates = apiGetTemplates();
    var tId = tplObj.id ? Number(tplObj.id) : null;
    var namaUjian = String(tplObj.nama_ujian || '').trim();
    if (!namaUjian) return { success: false, message: 'Nama ujian wajib diisi!' };

    var isAktif = tplObj.aktif ? 1 : 0;
    if (isAktif) {
      templates.forEach(function(t) { t.aktif = 0; });
    }

    if (tId) {
      var found = templates.find(function(t) { return t.id === tId; });
      if (found) {
        Object.assign(found, tplObj);
        found.aktif = isAktif;
      }
    } else {
      var nextId = templates.reduce(function(max, t) { return Math.max(max, Number(t.id) || 0); }, 0) + 1;
      tplObj.id = nextId;
      tplObj.aktif = isAktif || (templates.length === 0 ? 1 : 0);
      templates.push(tplObj);
    }

    var templateHeaders = ['id', 'nama_ujian', 'tahun_ajaran', 'semester', 'judul_berita_acara', 'redaksi_isi', 'redaksi_pembuka', 'redaksi_poin_1', 'redaksi_poin_2', 'label_catatan', 'aktif'];
    batchReplaceTable(SHEET_NAMES.TEMPLATES, templateHeaders, templates);

    return { success: true, message: 'Template ujian berhasil disimpan!', template: tplObj };
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan template: ' + err.message };
  }
}

function apiSetActiveTemplate(templateId) {
  try {
    var templates = apiGetTemplates();
    var activatedName = '';
    templates.forEach(function(t) {
      if (Number(t.id) === Number(templateId)) {
        t.aktif = 1;
        activatedName = t.nama_ujian;
      } else {
        t.aktif = 0;
      }
    });

    var templateHeaders = ['id', 'nama_ujian', 'tahun_ajaran', 'semester', 'judul_berita_acara', 'redaksi_isi', 'redaksi_pembuka', 'redaksi_poin_1', 'redaksi_poin_2', 'label_catatan', 'aktif'];
    batchReplaceTable(SHEET_NAMES.TEMPLATES, templateHeaders, templates);

    var settings = apiGetSettings();
    settings.active_template_id = Number(templateId);
    apiSaveSettings(settings);

    return {
      success: true,
      message: 'Template "' + activatedName + '" berhasil diaktifkan!',
      templates: templates
    };
  } catch (err) {
    return { success: false, message: 'Gagal mengaktifkan template: ' + err.message };
  }
}

function apiDeleteTemplate(templateId) {
  try {
    deleteTableRow(SHEET_NAMES.TEMPLATES, 'id', templateId);
    return { success: true, message: 'Template ujian berhasil dihapus.' };
  } catch (err) {
    return { success: false, message: 'Gagal menghapus template: ' + err.message };
  }
}

/**
 * 9. Arsip Dokumen Ujian (Archives)
 */
function apiGetArchives(filters) {
  var rows = getTableData(SHEET_NAMES.ARCHIVES);
  var mapped = rows.map(function(a) {
    return {
      id: Number(a.id) || a.id,
      type: a.type || 'daftar_hadir',
      title: a.title || '',
      filename: a.filename || '',
      nama_ujian: a.nama_ujian || '',
      tahun_ajaran: a.tahun_ajaran || '',
      semester: a.semester || '',
      tanggal_ujian: a.tanggal_ujian || '',
      mata_pelajaran: a.mata_pelajaran || '',
      nama_kelas: a.nama_kelas || '',
      class_id: a.class_id || '',
      ruang: a.ruang || '',
      peserta_seharusnya: Number(a.peserta_seharusnya) || 0,
      peserta_hadir: Number(a.peserta_hadir) || 0,
      peserta_tidak_hadir: Number(a.peserta_tidak_hadir) || 0,
      siswa_tidak_hadir: a.siswa_tidak_hadir || '',
      nama_pengawas_1: a.nama_pengawas_1 || '',
      nip_pengawas_1: a.nip_pengawas_1 || '',
      nama_pengawas_2: a.nama_pengawas_2 || '',
      nip_pengawas_2: a.nip_pengawas_2 || '',
      html_content: a.html_content || '',
      created_at: a.created_at || ''
    };
  });

  // Urutkan dari yang terbaru
  mapped.sort(function(a, b) {
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  if (!filters || typeof filters !== 'object') return mapped;

  return mapped.filter(function(item) {
    if (filters.tahun_ajaran && item.tahun_ajaran !== filters.tahun_ajaran) return false;
    if (filters.semester && item.semester !== filters.semester) return false;
    if (filters.tanggal_ujian && item.tanggal_ujian !== filters.tanggal_ujian) return false;
    if (filters.kelas && item.nama_kelas !== filters.kelas && String(item.class_id) !== String(filters.kelas)) return false;
    if (filters.mata_pelajaran && item.mata_pelajaran.toLowerCase() !== filters.mata_pelajaran.toLowerCase()) return false;
    if (filters.type && item.type !== filters.type) return false;
    return true;
  });
}

function apiSaveArchive(archiveObj) {
  try {
    var newArchive = {
      id: Date.now(),
      type: archiveObj.type || 'daftar_hadir',
      title: archiveObj.title || 'Dokumen Ujian',
      filename: archiveObj.filename || 'Dokumen.pdf',
      nama_ujian: archiveObj.nama_ujian || '',
      tahun_ajaran: archiveObj.tahun_ajaran || '',
      semester: archiveObj.semester || '',
      tanggal_ujian: archiveObj.tanggal_ujian || '',
      mata_pelajaran: archiveObj.mata_pelajaran || '',
      nama_kelas: archiveObj.nama_kelas || '',
      class_id: archiveObj.class_id || '',
      ruang: archiveObj.ruang || '',
      peserta_seharusnya: Number(archiveObj.peserta_seharusnya) || 0,
      peserta_hadir: Number(archiveObj.peserta_hadir) || 0,
      peserta_tidak_hadir: Number(archiveObj.peserta_tidak_hadir) || 0,
      siswa_tidak_hadir: archiveObj.siswa_tidak_hadir || '',
      nama_pengawas_1: archiveObj.nama_pengawas_1 || '',
      nip_pengawas_1: archiveObj.nip_pengawas_1 || '',
      nama_pengawas_2: archiveObj.nama_pengawas_2 || '',
      nip_pengawas_2: archiveObj.nip_pengawas_2 || '',
      html_content: archiveObj.html_content || '',
      created_at: new Date().toISOString()
    };

    var archiveHeaders = [
      'id', 'type', 'title', 'filename', 'nama_ujian', 'tahun_ajaran', 'semester',
      'tanggal_ujian', 'mata_pelajaran', 'nama_kelas', 'class_id', 'ruang',
      'peserta_seharusnya', 'peserta_hadir', 'peserta_tidak_hadir', 'siswa_tidak_hadir',
      'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2',
      'html_content', 'created_at'
    ];

    appendTableRow(SHEET_NAMES.ARCHIVES, newArchive, archiveHeaders);

    return {
      success: true,
      message: 'Dokumen berhasil diarsipkan ke spreadsheet!',
      archive: newArchive
    };
  } catch (err) {
    return { success: false, message: 'Gagal mengarsipkan dokumen: ' + err.message };
  }
}

function apiDeleteArchive(archiveId) {
  try {
    var archives = apiGetArchives();
    var target = archives.find(function(a) { return String(a.id) === String(archiveId); });
    var deletedCount = 0;
    var deletedIds = [];

    if (target) {
      var tClass = (target.nama_kelas || '').trim().toLowerCase();
      var tMapel = (target.mata_pelajaran || '').trim().toLowerCase();
      var tDate = (target.tanggal_ujian || '').trim();

      var remaining = archives.filter(function(a) {
        if (String(a.id) === String(archiveId)) {
          deletedCount++;
          deletedIds.push(a.id);
          return false;
        }
        // Hapus juga dokumen kembarannya jika sesi, tanggal, mapel, dan kelas sama persis
        var aClass = (a.nama_kelas || '').trim().toLowerCase();
        var aMapel = (a.mata_pelajaran || '').trim().toLowerCase();
        var aDate = (a.tanggal_ujian || '').trim();
        if (tDate && aDate === tDate && tMapel && aMapel === tMapel && tClass && aClass === tClass) {
          deletedCount++;
          deletedIds.push(a.id);
          return false;
        }
        return true;
      });

      var archiveHeaders = [
        'id', 'type', 'title', 'filename', 'nama_ujian', 'tahun_ajaran', 'semester',
        'tanggal_ujian', 'mata_pelajaran', 'nama_kelas', 'class_id', 'ruang',
        'peserta_seharusnya', 'peserta_hadir', 'peserta_tidak_hadir', 'siswa_tidak_hadir',
        'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2',
        'html_content', 'created_at'
      ];
      batchReplaceTable(SHEET_NAMES.ARCHIVES, archiveHeaders, remaining);

      return {
        success: true,
        message: deletedCount > 1
          ? 'Dokumen dan ' + (deletedCount - 1) + ' berkas terkait berhasil dihapus.'
          : 'Arsip dokumen berhasil dihapus.',
        deletedCount: deletedCount,
        deleted_ids: deletedIds
      };
    } else {
      deleteTableRow(SHEET_NAMES.ARCHIVES, 'id', archiveId);
      return { success: true, message: 'Arsip dokumen berhasil dihapus.', deleted_ids: [archiveId] };
    }
  } catch (err) {
    return { success: false, message: 'Gagal menghapus arsip: ' + err.message };
  }
}

/**
 * 10. Sinkronisasi Otomatis Rekap Absensi ke Berita Acara
 */
function apiGetAttendanceRekap(classId, className, tanggal_ujian, mata_pelajaran) {
  try {
    var archives = apiGetArchives({ type: 'daftar_hadir' });
    var mapel = (mata_pelajaran || '').trim().toLowerCase();
    var cName = (className || '').trim().toLowerCase();
    var tgl = (tanggal_ujian || '').trim();

    var match = null;

    if (tgl && mapel) {
      if (classId || cName) {
        match = archives.find(function(a) {
          var mClass = (classId && String(a.class_id) === String(classId)) ||
                       (cName && a.nama_kelas && a.nama_kelas.toLowerCase().includes(cName));
          var mDate = a.tanggal_ujian === tgl;
          var mMapel = a.mata_pelajaran && (a.mata_pelajaran.toLowerCase() === mapel || a.mata_pelajaran.toLowerCase().includes(mapel));
          return mClass && mDate && mMapel;
        });
      }
      if (!match) {
        match = archives.find(function(a) {
          var mDate = a.tanggal_ujian === tgl;
          var mMapel = a.mata_pelajaran && (a.mata_pelajaran.toLowerCase() === mapel || a.mata_pelajaran.toLowerCase().includes(mapel));
          return mDate && mMapel;
        });
      }
    }

    if (!match && (classId || cName)) {
      match = archives.find(function(a) {
        var mClass = (classId && String(a.class_id) === String(classId)) ||
                     (cName && a.nama_kelas && a.nama_kelas.toLowerCase().includes(cName));
        return mClass;
      });
    }

    if (match) {
      return {
        success: true,
        found: true,
        rekap: {
          peserta_seharusnya: match.peserta_seharusnya,
          peserta_hadir: match.peserta_hadir,
          peserta_tidak_hadir: match.peserta_tidak_hadir,
          siswa_tidak_hadir: match.siswa_tidak_hadir || '',
          nama_kelas: match.nama_kelas,
          class_id: match.class_id,
          tanggal_ujian: match.tanggal_ujian,
          mata_pelajaran: match.mata_pelajaran,
          nama_pengawas_1: match.nama_pengawas_1,
          nip_pengawas_1: match.nip_pengawas_1,
          nama_pengawas_2: match.nama_pengawas_2,
          nip_pengawas_2: match.nip_pengawas_2,
          created_at: match.created_at
        }
      };
    } else {
      return { success: true, found: false, message: 'Tidak ditemukan arsip daftar hadir yang cocok.' };
    }
  } catch (err) {
    return { success: false, message: 'Gagal mengambil rekap: ' + err.message };
  }
}

/**
 * 11. Manajemen User & Autentikasi
 */
function apiGetUsers() {
  var rows = getTableData(SHEET_NAMES.USERS);
  return rows.map(function(u) {
    return {
      id: Number(u.id) || u.id,
      username: String(u.username || '').trim().toLowerCase(),
      password: String(u.password || '').trim(),
      nama: String(u.nama || u.username || '').trim(),
      role: String(u.role || 'admin').trim().toLowerCase(),
      created_at: u.created_at || ''
    };
  });
}

function apiSaveUser(userObj) {
  try {
    var users = apiGetUsers();
    var uId = userObj.id ? Number(userObj.id) : null;
    var username = String(userObj.username || '').trim().toLowerCase();
    var nama = String(userObj.nama || userObj.username || '').trim();
    var role = String(userObj.role || 'admin').trim().toLowerCase();
    var password = String(userObj.password || '').trim();

    if (!username) return { success: false, message: 'Username wajib diisi!' };

    if (uId) {
      var existing = users.find(function(u) { return u.id === uId; });
      if (!existing) return { success: false, message: 'User tidak ditemukan.' };

      var dup = users.find(function(u) { return u.username === username && u.id !== uId; });
      if (dup) return { success: false, message: 'Username "' + username + '" sudah digunakan.' };

      var updateData = { username: username, nama: nama, role: role };
      if (password) updateData.password = password;

      updateTableRow(SHEET_NAMES.USERS, 'id', uId, updateData);
      return { success: true, message: 'Pengguna berhasil diperbarui!' };
    } else {
      if (!password) return { success: false, message: 'Password wajib diisi untuk user baru!' };
      var dupNew = users.find(function(u) { return u.username === username; });
      if (dupNew) return { success: false, message: 'Username "' + username + '" sudah terdaftar.' };

      var nextId = users.reduce(function(max, u) { return Math.max(max, Number(u.id) || 0); }, 0) + 1;
      appendTableRow(SHEET_NAMES.USERS, {
        id: nextId,
        username: username,
        password: password,
        nama: nama,
        role: role,
        created_at: new Date().toISOString()
      }, ['id', 'username', 'password', 'nama', 'role', 'created_at']);

      return { success: true, message: 'Pengguna baru berhasil ditambahkan!', id: nextId };
    }
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan user: ' + err.message };
  }
}

function apiDeleteUser(userId) {
  try {
    var users = apiGetUsers();
    var target = users.find(function(u) { return Number(u.id) === Number(userId); });
    if (!target) return { success: false, message: 'User tidak ditemukan.' };

    if (target.username === 'admin' || target.id === 1) {
      return { success: false, message: 'Akun Superadmin utama (admin) tidak boleh dihapus demi keamanan sistem.' };
    }

    deleteTableRow(SHEET_NAMES.USERS, 'id', userId);
    return { success: true, message: 'Pengguna "' + target.username + '" berhasil dihapus.' };
  } catch (err) {
    return { success: false, message: 'Gagal menghapus user: ' + err.message };
  }
}

function apiLogin(username, password) {
  try {
    var users = apiGetUsers();
    var uInput = String(username || '').trim().toLowerCase();
    var pInput = String(password || '').trim();

    var matched = users.find(function(u) {
      return u.username.toLowerCase() === uInput && u.password === pInput;
    });

    if (matched) {
      return {
        success: true,
        user: {
          id: matched.id,
          username: matched.username,
          nama: matched.nama,
          role: matched.role
        },
        message: 'Login berhasil! Selamat datang, ' + matched.nama
      };
    } else {
      return {
        success: false,
        message: 'Username atau password salah. Silakan coba lagi.'
      };
    }
  } catch (err) {
    return { success: false, message: 'Terjadi kesalahan login: ' + err.message };
  }
}

/**
 * 12. Metrik & Status Basis Data
 */
function apiGetDatabaseStats() {
  try {
    var ss = getDbSpreadsheet();
    var students = apiGetStudents();
    var teachers = apiGetTeachers();
    var classes = apiGetClasses();
    var archives = apiGetArchives();
    var users = apiGetUsers();
    var templates = apiGetTemplates();

    // Hitung total kelas aktif yang memiliki siswa terdaftar
    var classesWithStudents = {};
    students.forEach(function(s) {
      classesWithStudents[s.class_id] = true;
    });
    var activeClassesCount = Object.keys(classesWithStudents).length;

    return {
      success: true,
      counts: {
        students: students.length,
        teachers: teachers.length,
        classes: classes.length,
        activeClasses: activeClassesCount,
        archives: archives.length,
        users: users.length,
        templates: templates.length
      },
      classes: classes,
      students: students,
      spreadsheetUrl: ss.getUrl(),
      spreadsheetName: ss.getName(),
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, message: 'Gagal memuat status database: ' + err.message };
  }
}

/**
 * 13. Backup Lengkap JSON Database
 */
function apiExportFullDatabase() {
  try {
    return {
      success: true,
      data: {
        settings: apiGetSettings(),
        classes: apiGetClasses(),
        students: apiGetStudents(),
        teachers: apiGetTeachers(),
        subjects: apiGetSubjects(),
        academic_years: apiGetAcademicYears(),
        templates: apiGetTemplates(),
        users: apiGetUsers(),
        archives: apiGetArchives()
      },
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, message: 'Gagal mengekspor data: ' + err.message };
  }
}

/**
 * 14. Reset Database ke Pengaturan Awal
 */
function apiResetDatabase() {
  try {
    var res = setupSpreadsheetDatabase(true);
    return res;
  } catch (err) {
    return { success: false, message: 'Gagal mereset database: ' + err.message };
  }
}

/**
 * 15. Universal Save Database Handler (Bulk Sync & Update)
 */
function apiSaveDatabase(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      return { success: false, message: 'Payload tidak valid.' };
    }

    if (payload.delete_all_students === true) {
      var sHeaders = ['id', 'class_id', 'nis', 'nama'];
      batchReplaceTable(SHEET_NAMES.STUDENTS, sHeaders, []);
      if (payload.reset_classes === true) {
        var cHeaders = ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'is_active'];
        batchReplaceTable(SHEET_NAMES.CLASSES, cHeaders, []);
      }
    } else if (Array.isArray(payload.students) && (payload.students.length > 0 || payload.allow_empty_students === true)) {
      var sHeaders = ['id', 'class_id', 'nis', 'nama'];
      batchReplaceTable(SHEET_NAMES.STUDENTS, sHeaders, payload.students);
    }

    if (payload.delete_all_teachers === true) {
      var tHeaders = ['id', 'nama', 'nip', 'mapel', 'jabatan', 'is_active'];
      batchReplaceTable(SHEET_NAMES.TEACHERS, tHeaders, []);
    } else if (Array.isArray(payload.teachers) && (payload.teachers.length > 0 || payload.allow_empty_teachers === true)) {
      var tHeaders = ['id', 'nama', 'nip', 'mapel', 'jabatan', 'is_active'];
      batchReplaceTable(SHEET_NAMES.TEACHERS, tHeaders, payload.teachers);
    }

    if (Array.isArray(payload.classes)) {
      var cHeaders = ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'is_active'];
      batchReplaceTable(SHEET_NAMES.CLASSES, cHeaders, payload.classes);
    }

    if (Array.isArray(payload.templates)) {
      var tplHeaders = ['id', 'nama_ujian', 'tahun_ajaran', 'semester', 'judul_berita_acara', 'redaksi_isi', 'redaksi_pembuka', 'redaksi_poin_1', 'redaksi_poin_2', 'label_catatan', 'aktif'];
      batchReplaceTable(SHEET_NAMES.TEMPLATES, tplHeaders, payload.templates);
    }

    if (Array.isArray(payload.subjects)) {
      var subHeaders = ['id', 'nama_mapel'];
      var subRows = payload.subjects.map(function(s, idx) {
        return typeof s === 'string' ? { id: idx + 1, nama_mapel: s } : s;
      });
      batchReplaceTable(SHEET_NAMES.SUBJECTS, subHeaders, subRows);
    }

    if (Array.isArray(payload.academic_years)) {
      var yHeaders = ['id', 'tahun_ajaran'];
      var yRows = payload.academic_years.map(function(y, idx) {
        return typeof y === 'string' ? { id: idx + 1, tahun_ajaran: y } : y;
      });
      batchReplaceTable(SHEET_NAMES.ACADEMIC_YEARS, yHeaders, yRows);
    }

    if (payload.settings && typeof payload.settings === 'object') {
      apiSaveSettings(payload.settings);
    }

    if (Array.isArray(payload.users)) {
      var uHeaders = ['id', 'username', 'password', 'nama', 'role', 'created_at'];
      batchReplaceTable(SHEET_NAMES.USERS, uHeaders, payload.users);
    }

    if (Array.isArray(payload.archives)) {
      var aHeaders = [
        'id', 'type', 'title', 'filename', 'nama_ujian', 'tahun_ajaran', 'semester',
        'tanggal_ujian', 'mata_pelajaran', 'nama_kelas', 'class_id', 'ruang',
        'peserta_seharusnya', 'peserta_hadir', 'peserta_tidak_hadir', 'siswa_tidak_hadir',
        'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2',
        'html_content', 'created_at'
      ];
      batchReplaceTable(SHEET_NAMES.ARCHIVES, aHeaders, payload.archives);
    }

    return { success: true, message: 'Basis data berhasil diperbarui ke Google Spreadsheet.' };
  } catch (err) {
    return { success: false, message: 'Gagal menyimpan database: ' + err.message };
  }
}


/**
 * Ekstraksi Folder ID dari Google Drive URL atau ID mentah
 */
function extractDriveFolderId(urlOrId) {
  if (!urlOrId) return '';
  var str = String(urlOrId).trim();
  var match = str.match(/[-\w]{25,}/);
  return match ? match[0] : str;
}

/**
 * Mendapatkan instance Folder Google Drive untuk upload file SAS
 */
function getDriveUploadFolder() {
  var settings = apiGetSettings();
  var folderId = settings.drive_folder_id || extractDriveFolderId(settings.drive_folder_url);
  if (!folderId) {
    folderId = '19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR';
  }
  try {
    return DriveApp.getFolderById(folderId);
  } catch (err) {
    throw new Error('Gagal mengakses folder Google Drive dengan ID [' + folderId + ']: ' + err.message + '. Pastikan folder dibagikan atau akun memiliki hak akses!');
  }
}

/**
 * Tes koneksi dan akses ke folder Google Drive
 */
function apiTestDriveFolder(urlOrId) {
  try {
    var folderId = extractDriveFolderId(urlOrId);
    if (!folderId) {
      return { success: false, message: 'ID atau URL folder Google Drive tidak valid.' };
    }
    var folder = DriveApp.getFolderById(folderId);
    var name = folder.getName();
    var url = folder.getUrl();
    return {
      success: true,
      folderId: folderId,
      folderName: name,
      folderUrl: url,
      message: 'Berhasil terhubung ke folder Google Drive: "' + name + '"'
    };
  } catch (err) {
    return {
      success: false,
      message: 'Gagal mengakses folder: ' + err.message + '. Pastikan URL/ID benar dan izin akses folder sudah dibuka.'
    };
  }
}

/**
 * Upload file base64 ke folder Google Drive terkonfigurasi
 */
function apiUploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    if (!base64Data) {
      return { success: false, message: 'Data file kosong!' };
    }
    var folder = getDriveUploadFolder();
    var cleanBase64 = base64Data;
    var detectedMime = mimeType || 'application/octet-stream';

    if (base64Data.indexOf(';base64,') > -1) {
      var parts = base64Data.split(';base64,');
      var meta = parts[0];
      cleanBase64 = parts[1];
      if (!mimeType) {
        detectedMime = meta.replace('data:', '');
      }
    }

    var decoded = Utilities.base64Decode(cleanBase64);
    var safeName = fileName || ('SAS_Upload_' + Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyyMMdd_HHmmss'));
    var blob = Utilities.newBlob(decoded, detectedMime, safeName);
    var file = folder.createFile(blob);
    
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      console.warn('Set sharing notice:', e);
    }

    return {
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      downloadUrl: file.getDownloadUrl(),
      message: 'File berhasil diunggah ke Google Drive di folder: ' + folder.getName()
    };
  } catch (err) {
    return {
      success: false,
      message: 'Gagal mengunggah file ke Google Drive: ' + err.message
    };
  }
}

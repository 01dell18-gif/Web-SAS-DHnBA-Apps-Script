/**
 * ==============================================================================
 * SISTEM ADMINISTRASI UJIAN (SAS) - SMK NEGERI FYJ CHANNEL
 * Generator Absensi & Berita Acara Ujian Resmi Format A4 PDF & Excel (.xls)
 * Platform: Google Apps Script & Google Sheets Database Relasional
 * ==============================================================================
 */

var _activePage = 'index';
var _activeParams = {};

var SHEET_NAMES = {
  SETTINGS: 'Pengaturan',
  CLASSES: 'Kelas',
  STUDENTS: 'Siswa',
  TEACHERS: 'Guru',
  MAPEL: 'Mapel',
  TEMPLATES: 'TemplateUjian',
  ABSENSI: 'Absensi',
  BERITA_ACARA: 'BeritaAcara',
  USERS: 'Users',
  LOGS: 'ActivityLogs'
};

/**
 * Router Multi-Page Utama Web App
 */
function doGet(e) {
  try {
    var page = (e && e.parameter && e.parameter.page) || 'index';
    _activePage = page;
    _activeParams = e && e.parameter ? e.parameter : {};

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
      'kelas': 'AdminKelas',
      'siswa': 'AdminSiswa',
      'guru': 'AdminGuru',
      'mapel': 'AdminMapel',
      'import': 'AdminImport',
      'rekap-kehadiran': 'AdminRekapKehadiran',
      'admin-absensi': 'AdminArsipAbsensi',
      'admin-berita-acara': 'AdminArsipBeritaAcara',
      'rekonsiliasi': 'AdminRekonsiliasi',
      'template': 'AdminTemplate',
      'pengaturan': 'AdminPengaturan',
      'users': 'AdminUsers',
      'profil': 'AdminProfil',
      'preview': 'Preview',
      // Backward Compatibility
      'admin-arsip': 'AdminArsipAbsensi',
      'database': 'AdminDashboard'
    };

    var pageFile = routeMap[page] || 'Index';
    return renderTemplate(pageFile);
  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family: sans-serif; padding: 2rem; color: #1e293b;">' +
      '<h2 style="color: #e11d48;">Terjadi Kesalahan Sistem</h2>' +
      '<p>' + err.message + '</p>' +
      '<a href="' + getAppUrl() + '?page=index" style="color: #4f46e5; text-decoration: underline;">Kembali ke Beranda</a>' +
      '</div>'
    ).setTitle('Error - SAS SMK');
  }
}

function include(filename, data) {
  var t = HtmlService.createTemplateFromFile(filename);
  t.currentPage = _activePage;
  t.params = _activeParams;
  t.appUrl = getAppUrl();
  t.settings = getSettingsMap();
  t.schoolSettings = t.settings;

  if (data && typeof data === 'object') {
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        t[k] = data[k];
      }
    }
  }
  return t.evaluate().getContent();
}

function getAppUrl() {
  try {
    var url = ScriptApp.getService().getUrl();
    if (url && url.indexOf('/macros/s/') !== -1) return url;
  } catch (e) {}

  try {
    var propsUrl = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL');
    if (propsUrl && propsUrl.indexOf('/macros/s/') !== -1) return propsUrl;
  } catch (e) {}

  try {
    var settings = getSettingsMap();
    if (settings && settings.web_app_url && settings.web_app_url.indexOf('/macros/s/') !== -1) {
      return settings.web_app_url;
    }
  } catch (e) {}

  return 'https://script.google.com/macros/s/AKfycbwsPpl26VbTP2HgegLO4TCSwI6DalsXPW0bMn3ATxc8/exec';
}

function renderTemplate(filename) {
  var template = HtmlService.createTemplateFromFile(filename);
  template.currentPage = _activePage;
  template.params = _activeParams;
  template.appUrl = getAppUrl();
  template.settings = getSettingsMap();
  template.schoolSettings = template.settings;

  return template.evaluate()
    .setTitle('Generator Absensi & Berita Acara - SMK NEGERI FYJ Channel')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * In-Memory Request Cache & Database Helpers
 */
var _cachedSpreadsheet = null;
var _requestTableCache = {};

function getSpreadsheet() {
  if (!_cachedSpreadsheet) {
    try {
      _cachedSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      _cachedSpreadsheet = null;
    }
    if (!_cachedSpreadsheet) {
      var props = PropertiesService.getScriptProperties();
      var ssId = props.getProperty('SPREADSHEET_ID');
      if (ssId) {
        try {
          _cachedSpreadsheet = SpreadsheetApp.openById(ssId);
        } catch (e) {
          _cachedSpreadsheet = null;
        }
      }
      if (!_cachedSpreadsheet) {
        // Auto-create a new dedicated Google Sheet if standalone and none configured
        try {
          _cachedSpreadsheet = SpreadsheetApp.create('Database SAS - SMK NEGERI FYJ CHANNEL');
          props.setProperty('SPREADSHEET_ID', _cachedSpreadsheet.getId());
        } catch (err) {
          throw new Error('Gagal mengakses atau membuat Spreadsheet database: ' + err.message);
        }
      }
    }
  }
  return _cachedSpreadsheet;
}

function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function invalidateCaches() {
  _requestTableCache = {};
  try {
    CacheService.getScriptCache().removeAll([
      'sas_initial_data', 'sas_settings', 'sas_classes', 'sas_teachers', 'sas_mapel', 'sas_templates'
    ]);
  } catch (e) {}
}

function apiClearCache() {
  invalidateCaches();
  return { success: true };
}

/**
 * Generic Sheet Table Reader & Writer
 */
function readTable(sheetName) {
  if (_requestTableCache[sheetName]) {
    return _requestTableCache[sheetName];
  }
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    _requestTableCache[sheetName] = [];
    return [];
  }
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var rowObj = { _row: i + 1 };
    var isEmpty = true;
    for (var j = 0; j < headers.length; j++) {
      var key = String(headers[j]).trim();
      var val = values[i][j];
      if (val !== '' && val !== null && val !== undefined) isEmpty = false;
      rowObj[key] = val;
    }
    if (!isEmpty) rows.push(rowObj);
  }
  _requestTableCache[sheetName] = rows;
  return rows;
}

function getNextId(sheetName) {
  var rows = readTable(sheetName);
  var maxId = 0;
  for (var i = 0; i < rows.length; i++) {
    var id = parseInt(rows[i].id, 10);
    if (!isNaN(id) && id > maxId) maxId = id;
  }
  return maxId + 1;
}

function insertRow(sheetName, obj) {
  var sheet = getSheet(sheetName);
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return null;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!obj.id) obj.id = getNextId(sheetName);
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  if (!obj.created_at) obj.created_at = now;
  obj.updated_at = now;

  var rowData = [];
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    var val = obj[h] !== undefined ? obj[h] : '';
    rowData.push(val);
  }
  sheet.appendRow(rowData);
  invalidateCaches();
  return obj;
}

function updateRowById(sheetName, id, updates) {
  var rows = readTable(sheetName);
  var target = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) {
      target = rows[i];
      break;
    }
  }
  if (!target) return null;

  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIdx = target._row;
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  updates.updated_at = now;

  for (var j = 0; j < headers.length; j++) {
    var h = String(headers[j]).trim();
    if (updates[h] !== undefined) {
      sheet.getRange(rowIdx, j + 1).setValue(updates[h]);
    }
  }
  invalidateCaches();
  return true;
}

function deleteRowById(sheetName, id) {
  var rows = readTable(sheetName);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) {
      getSheet(sheetName).deleteRow(rows[i]._row);
      invalidateCaches();
      return true;
    }
  }
  return false;
}

function truncateSheet(sheetName, headers) {
  var sheet = getSheet(sheetName);
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  invalidateCaches();
}

/**
 * Settings Table Helper & Drive URL Utility
 */
function convertDriveUrlToThumbnail(url) {
  if (!url || typeof url !== 'string') return '';
  url = url.trim();
  if (url.indexOf('thumbnail?id=') !== -1 || url.indexOf('data:image/') === 0) {
    return url;
  }
  var match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1600';
  }
  var matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1] && (url.indexOf('drive.google.com') !== -1 || url.indexOf('docs.google.com') !== -1)) {
    return 'https://drive.google.com/thumbnail?id=' + matchId[1] + '&sz=w1600';
  }
  return url;
}

function getSettingsMap() {
  try {
    var rows = readTable(SHEET_NAMES.SETTINGS);
    var map = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var k = String(r.setting_key || r.key || r.kunci || r.Kunci || '').trim();
      if (!k) continue;
      var v = (r.setting_value !== undefined) ? r.setting_value :
              ((r.value !== undefined) ? r.value :
              ((r.nilai !== undefined) ? r.nilai : r.Nilai));
      if (v === undefined || v === null) v = '';
      map[k] = v;
    }

    // Map synonyms/aliases between English & Indonesian
    if (!map.nama_sekolah && map.school_name) map.nama_sekolah = map.school_name;
    if (!map.school_name && map.nama_sekolah) map.school_name = map.nama_sekolah;
    if (!map.nama_sekolah) map.nama_sekolah = 'SMK NEGERI FYJ Channel';

    if (!map.alamat_sekolah && map.school_address) map.alamat_sekolah = map.school_address;
    if (!map.alamat_sekolah) map.alamat_sekolah = 'Jl. Merpati No. 1';

    if (!map.kop_baris_1) map.kop_baris_1 = 'PEMERINTAH PROVINSI FYJ';
    if (!map.kop_baris_2) map.kop_baris_2 = 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA';
    if (!map.kop_baris_3) map.kop_baris_3 = map.nama_sekolah;
    if (!map.kop_telepon) map.kop_telepon = 'Telp. (0300) 2002 | Email: smkn@yahoo.com';
    if (!map.kop_website) map.kop_website = 'Website: smkn.sch.id';

    if (!map.tahun_ajaran_aktif && map.academic_year) map.tahun_ajaran_aktif = map.academic_year;
    if (!map.academic_year && map.tahun_ajaran_aktif) map.academic_year = map.tahun_ajaran_aktif;
    if (!map.tahun_ajaran_aktif) map.tahun_ajaran_aktif = '2026/2027';

    if (!map.semester_aktif && map.default_semester) map.semester_aktif = map.default_semester;
    if (!map.default_semester && map.semester_aktif) map.default_semester = map.semester_aktif;
    if (!map.semester_aktif) map.semester_aktif = 'Ganjil';

    if (!map.kop_mode) map.kop_mode = 'image';

    if (!map.google_drive_folder_url && map.drive_folder_url) map.google_drive_folder_url = map.drive_folder_url;
    if (!map.drive_folder_url && map.google_drive_folder_url) map.drive_folder_url = map.google_drive_folder_url;
    if (!map.google_drive_folder_url) map.google_drive_folder_url = 'https://drive.google.com/drive/folders/1sHpxyW6DbHSp1D7KNN-_xTu8fG9rY35h?usp=sharing';

    // Synchronize kop_header and kop_image_path synonyms & format Drive URL
    var kopImg = map.kop_header || map.kop_image_path || '';
    kopImg = convertDriveUrlToThumbnail(kopImg);
    map.kop_header = kopImg;
    map.kop_image_path = kopImg;

    // Synchronize school_logo and logo_path synonyms & format Drive URL
    var logoImg = map.school_logo || map.logo_path || '';
    logoImg = convertDriveUrlToThumbnail(logoImg);
    map.school_logo = logoImg;
    map.logo_path = logoImg;

    // Academic years parsing
    var defaultYears = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];
    if (map.daftar_tahun_ajaran) {
      if (typeof map.daftar_tahun_ajaran === 'string') {
        try {
          map.daftar_tahun_ajaran = JSON.parse(map.daftar_tahun_ajaran);
        } catch (e) {
          map.daftar_tahun_ajaran = map.daftar_tahun_ajaran.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
        }
      }
    }
    if (!Array.isArray(map.daftar_tahun_ajaran) || map.daftar_tahun_ajaran.length === 0) {
      map.daftar_tahun_ajaran = defaultYears;
    }
    if (map.tahun_ajaran_aktif && map.daftar_tahun_ajaran.indexOf(map.tahun_ajaran_aktif) === -1) {
      map.daftar_tahun_ajaran.push(map.tahun_ajaran_aktif);
    }

    return map;
  } catch (e) {
    return {
      nama_sekolah: 'SMK NEGERI FYJ Channel',
      alamat_sekolah: 'Jl. Merpati No. 1',
      tahun_ajaran_aktif: '2026/2027',
      semester_aktif: 'Ganjil',
      daftar_tahun_ajaran: ['2024/2025', '2025/2026', '2026/2027', '2027/2028'],
      kop_mode: 'image',
      kop_header: '',
      kop_image_path: '',
      school_logo: '',
      logo_path: ''
    };
  }
}

/**
 * Single-Trip RPC: Load Entire Initial Master Data (<1s)
 */
function apiGetInitialData() {
  var cache = CacheService.getScriptCache();
  var cachedJson = cache.get('sas_initial_data');
  if (cachedJson) {
    try {
      return JSON.parse(cachedJson);
    } catch (e) {}
  }

  var settings = getSettingsMap();
  var classes = readTable(SHEET_NAMES.CLASSES);
  var students = readTable(SHEET_NAMES.STUDENTS);
  var teachers = readTable(SHEET_NAMES.TEACHERS);
  var mapels = readTable(SHEET_NAMES.MAPEL);
  var templates = readTable(SHEET_NAMES.TEMPLATES);
  var users = readTable(SHEET_NAMES.USERS);
  var absensi = readTable(SHEET_NAMES.ABSENSI);
  var beritaAcara = readTable(SHEET_NAMES.BERITA_ACARA);
  var logs = readTable(SHEET_NAMES.LOGS);

  // Filter sensitive passwords before sending to client
  var sanitizedUsers = users.map(function(u) {
    return {
      id: u.id,
      username: u.username,
      nama_lengkap: u.nama_lengkap,
      role: u.role,
      password_plain: u.password_plain || '',
      foto: u.foto || null
    };
  });

  var result = {
    settings: settings,
    classes: classes,
    students: students,
    teachers: teachers,
    mapels: mapels,
    templates: templates,
    users: sanitizedUsers,
    absensi: absensi,
    berita_acara: beritaAcara,
    logs: logs.slice(-20)
  };

  try {
    var str = JSON.stringify(result);
    if (str.length < 90000) {
      cache.put('sas_initial_data', str, 1800);
    }
  } catch (err) {}

  return result;
}

/**
 * Authentication Endpoints
 */
function apiLogin(username, password) {
  var users = readTable(SHEET_NAMES.USERS);
  username = String(username || '').trim().toLowerCase();
  password = String(password || '').trim();

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (String(u.username).toLowerCase() === username) {
      if (String(u.password_plain) === password || String(u.password) === password) {
        logActivity('LOGIN', 'User ' + u.username + ' berhasil masuk sistem');
        return {
          success: true,
          user: {
            id: u.id,
            username: u.username,
            nama_lengkap: u.nama_lengkap,
            role: u.role || 'admin',
            foto: u.foto || null
          }
        };
      }
    }
  }
  return { success: false, message: 'Username atau password tidak sesuai.' };
}

function logActivity(activity, details) {
  try {
    var sheet = getSheet(SHEET_NAMES.LOGS);
    var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
    var nextId = getNextId(SHEET_NAMES.LOGS);
    sheet.appendRow([nextId, now, activity, details, 'Web Client']);
  } catch (e) {}
}

/**
 * CRUD Endpoints: Absensi & Berita Acara
 */
function apiSaveAbsensi(payload) {
  var isEdit = payload.id && parseInt(payload.id, 10) > 0;
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  
  if (isEdit) {
    updateRowById(SHEET_NAMES.ABSENSI, payload.id, payload);
    logActivity('UPDATE_ABSENSI', 'Memperbarui absensi kelas ' + payload.nama_kelas + ' mapel ' + payload.mata_pelajaran);
    return { success: true, id: payload.id };
  } else {
    var saved = insertRow(SHEET_NAMES.ABSENSI, payload);
    logActivity('CREATE_ABSENSI', 'Membuat absensi baru kelas ' + payload.nama_kelas + ' mapel ' + payload.mata_pelajaran);
    return { success: true, id: saved.id };
  }
}

function apiDeleteAbsensi(id) {
  deleteRowById(SHEET_NAMES.ABSENSI, id);
  logActivity('DELETE_ABSENSI', 'Menghapus absensi ID #' + id);
  return { success: true };
}

function apiDeleteAllAbsensi() {
  truncateSheet(SHEET_NAMES.ABSENSI, [
    'id', 'nama_ujian', 'tahun_ajaran', 'semester', 'class_id', 'nama_kelas', 'tingkat',
    'mata_pelajaran', 'sesi', 'ruang', 'tanggal_ujian', 'jam_mulai', 'jam_selesai',
    'peserta_hadir', 'peserta_dispensasi', 'peserta_izin', 'peserta_sakit', 'peserta_tidak_hadir',
    'total_peserta', 'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2',
    'signature_mode', 'ttd_pengawas_1', 'ttd_pengawas_2', 'data_siswa', 'created_at', 'updated_at'
  ]);
  logActivity('CLEAR_ALL_ABSENSI', 'Mereset seluruh data arsip Daftar Hadir');
  return { success: true };
}

function apiSaveBeritaAcara(payload) {
  var isEdit = payload.id && parseInt(payload.id, 10) > 0;
  if (isEdit) {
    updateRowById(SHEET_NAMES.BERITA_ACARA, payload.id, payload);
    logActivity('UPDATE_BERITA_ACARA', 'Memperbarui Berita Acara kelas ' + payload.nama_kelas + ' mapel ' + payload.mata_pelajaran);
    return { success: true, id: payload.id };
  } else {
    var saved = insertRow(SHEET_NAMES.BERITA_ACARA, payload);
    logActivity('CREATE_BERITA_ACARA', 'Membuat Berita Acara baru kelas ' + payload.nama_kelas + ' mapel ' + payload.mata_pelajaran);
    return { success: true, id: saved.id };
  }
}

function apiDeleteBeritaAcara(id) {
  deleteRowById(SHEET_NAMES.BERITA_ACARA, id);
  logActivity('DELETE_BERITA_ACARA', 'Menghapus Berita Acara ID #' + id);
  return { success: true };
}

function apiDeleteAllBeritaAcara() {
  truncateSheet(SHEET_NAMES.BERITA_ACARA, [
    'id', 'template_id', 'nama_ujian', 'tahun_ajaran', 'semester', 'class_id', 'nama_kelas',
    'tingkat', 'mata_pelajaran', 'tanggal_ujian', 'jam_mulai', 'jam_selesai', 'ruang',
    'peserta_seharusnya', 'peserta_hadir', 'peserta_tidak_hadir', 'blangko_berita_acara',
    'blangko_daftar_hadir', 'catatan_pelaksanaan', 'nama_pengawas_1', 'nip_pengawas_1',
    'nama_pengawas_2', 'nip_pengawas_2', 'signature_mode', 'ttd_pengawas_1', 'ttd_pengawas_2',
    'foto_dokumentasi', 'created_at', 'updated_at'
  ]);
  logActivity('CLEAR_ALL_BERITA_ACARA', 'Mereset seluruh data arsip Berita Acara');
  return { success: true };
}

function apiDeleteAllDocs() {
  apiDeleteAllAbsensi();
  apiDeleteAllBeritaAcara();
  logActivity('CLEAR_ALL_DOCUMENTS', 'Mereset seluruh dokumen ujian (Daftar Hadir & Berita Acara)');
  return { success: true };
}

/**
 * Rekap Matriks Kehadiran Endpoint
 */
function apiSaveSubjectAttendance(payload) {
  var classId = payload.class_id;
  var mapel = payload.mata_pelajaran;
  var rows = readTable(SHEET_NAMES.ABSENSI);
  var existing = null;

  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].class_id) === String(classId) &&
        String(rows[i].mata_pelajaran).trim().toLowerCase() === String(mapel).trim().toLowerCase()) {
      existing = rows[i];
      break;
    }
  }

  if (existing) {
    updateRowById(SHEET_NAMES.ABSENSI, existing.id, payload);
    logActivity('UPDATE_MAPEL_ABSENSI', 'Memperbarui absensi mapel ' + mapel + ' kelas ' + payload.nama_kelas);
    return { success: true, id: existing.id };
  } else {
    var saved = insertRow(SHEET_NAMES.ABSENSI, payload);
    logActivity('CREATE_MAPEL_ABSENSI', 'Membuat absensi mapel ' + mapel + ' kelas ' + payload.nama_kelas);
    return { success: true, id: saved.id };
  }
}

/**
 * CRUD Master Data: Kelas, Siswa, Guru, Mapel
 */
function apiSaveKelas(payload) {
  if (payload.id && parseInt(payload.id, 10) > 0) {
    updateRowById(SHEET_NAMES.CLASSES, payload.id, payload);
    logActivity('UPDATE_KELAS', 'Memperbarui data kelas ' + payload.nama_kelas);
  } else {
    insertRow(SHEET_NAMES.CLASSES, payload);
    logActivity('CREATE_KELAS', 'Menambahkan kelas baru ' + payload.nama_kelas);
  }
  return { success: true };
}

function apiDeleteKelas(id) {
  deleteRowById(SHEET_NAMES.CLASSES, id);
  logActivity('DELETE_KELAS', 'Menghapus kelas ID #' + id);
  return { success: true };
}

function apiDeleteAllKelas() {
  truncateSheet(SHEET_NAMES.CLASSES, ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'aktif', 'created_at', 'updated_at']);
  logActivity('CLEAR_ALL_KELAS', 'Mereset seluruh data kelas');
  return { success: true };
}

function apiSaveSiswa(payload) {
  if (payload.id && parseInt(payload.id, 10) > 0) {
    updateRowById(SHEET_NAMES.STUDENTS, payload.id, payload);
    logActivity('UPDATE_SISWA', 'Memperbarui siswa ' + payload.nama);
  } else {
    insertRow(SHEET_NAMES.STUDENTS, payload);
    logActivity('CREATE_SISWA', 'Menambahkan siswa ' + payload.nama);
  }
  return { success: true };
}

function apiDeleteSiswa(id) {
  deleteRowById(SHEET_NAMES.STUDENTS, id);
  logActivity('DELETE_SISWA', 'Menghapus siswa ID #' + id);
  return { success: true };
}

function apiDeleteAllSiswa() {
  truncateSheet(SHEET_NAMES.STUDENTS, ['id', 'class_id', 'nama_kelas', 'nis', 'nisn', 'nama', 'program_keahlian', 'aktif', 'created_at', 'updated_at']);
  logActivity('CLEAR_ALL_SISWA', 'Mereset seluruh data siswa');
  return { success: true };
}

function apiImportSiswa(students) {
  var count = 0;
  for (var i = 0; i < students.length; i++) {
    insertRow(SHEET_NAMES.STUDENTS, students[i]);
    count++;
  }
  logActivity('IMPORT_SISWA', 'Mengimpor ' + count + ' data siswa dari Excel');
  return { success: true, count: count };
}

function apiSaveGuru(payload) {
  if (payload.id && parseInt(payload.id, 10) > 0) {
    updateRowById(SHEET_NAMES.TEACHERS, payload.id, payload);
    logActivity('UPDATE_GURU', 'Memperbarui guru ' + payload.nama);
  } else {
    insertRow(SHEET_NAMES.TEACHERS, payload);
    logActivity('CREATE_GURU', 'Menambahkan guru ' + payload.nama);
  }
  return { success: true };
}

function apiDeleteGuru(id) {
  deleteRowById(SHEET_NAMES.TEACHERS, id);
  logActivity('DELETE_GURU', 'Menghapus guru ID #' + id);
  return { success: true };
}

function apiDeleteAllGuru() {
  truncateSheet(SHEET_NAMES.TEACHERS, ['id', 'nama', 'nip', 'jabatan', 'aktif', 'created_at', 'updated_at']);
  logActivity('CLEAR_ALL_GURU', 'Mereset seluruh data guru & pengawas');
  return { success: true };
}

function apiImportGuru(teachers) {
  var count = 0;
  for (var i = 0; i < teachers.length; i++) {
    insertRow(SHEET_NAMES.TEACHERS, teachers[i]);
    count++;
  }
  logActivity('IMPORT_GURU', 'Mengimpor ' + count + ' data guru dari Excel');
  return { success: true, count: count };
}

function apiSaveMapel(payload) {
  if (payload.id && parseInt(payload.id, 10) > 0) {
    updateRowById(SHEET_NAMES.MAPEL, payload.id, payload);
    logActivity('UPDATE_MAPEL', 'Memperbarui mapel ' + payload.nama_mapel);
  } else {
    insertRow(SHEET_NAMES.MAPEL, payload);
    logActivity('CREATE_MAPEL', 'Menambahkan mapel ' + payload.nama_mapel);
  }
  return { success: true };
}

function apiDeleteMapel(id) {
  deleteRowById(SHEET_NAMES.MAPEL, id);
  logActivity('DELETE_MAPEL', 'Menghapus mapel ID #' + id);
  return { success: true };
}

function apiDeleteAllMapel() {
  truncateSheet(SHEET_NAMES.MAPEL, ['id', 'kode_mapel', 'nama_mapel', 'kelompok', 'aktif', 'created_at', 'updated_at']);
  logActivity('CLEAR_ALL_MAPEL', 'Mereset seluruh data mapel');
  return { success: true };
}

function apiImportMapel(mapels) {
  var count = 0;
  for (var i = 0; i < mapels.length; i++) {
    insertRow(SHEET_NAMES.MAPEL, mapels[i]);
    count++;
  }
  logActivity('IMPORT_MAPEL', 'Mengimpor ' + count + ' data mapel dari Excel');
  return { success: true, count: count };
}

/**
 * Settings, Templates, Profil & Users
 */
function apiSavePengaturan(payload) {
  var sheet = getSheet(SHEET_NAMES.SETTINGS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  var keyColName = 'setting_key';
  var valColName = 'setting_value';

  if (lastRow >= 1 && lastCol >= 2) {
    var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var h0 = String(headerRow[0] || '').trim().toLowerCase();
    if (h0 === 'key' || h0 === 'kunci') {
      keyColName = headerRow[0];
      valColName = headerRow[1];
    }
  } else {
    sheet.clear();
    sheet.appendRow(['setting_key', 'setting_value']);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  }

  var rows = readTable(SHEET_NAMES.SETTINGS);
  var existingMap = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var k = String(r[keyColName] || r.setting_key || r.key || r.kunci || '').trim();
    if (k) existingMap[k] = r._row;
  }

  // Auto-convert Google Drive URLs to direct thumbnail URLs
  if (payload.kop_header) payload.kop_header = convertDriveUrlToThumbnail(payload.kop_header);
  if (payload.kop_image_path) payload.kop_image_path = convertDriveUrlToThumbnail(payload.kop_image_path);
  if (payload.school_logo) payload.school_logo = convertDriveUrlToThumbnail(payload.school_logo);
  if (payload.logo_path) payload.logo_path = convertDriveUrlToThumbnail(payload.logo_path);

  // Synchronize kop_header and kop_image_path synonyms
  if (payload.kop_header !== undefined) {
    payload.kop_image_path = payload.kop_header;
  } else if (payload.kop_image_path !== undefined) {
    payload.kop_header = payload.kop_image_path;
  }

  // Synchronize school_logo and logo_path synonyms
  if (payload.school_logo !== undefined) {
    payload.logo_path = payload.school_logo;
  } else if (payload.logo_path !== undefined) {
    payload.school_logo = payload.logo_path;
  }

  // Synchronize school_name and nama_sekolah
  if (payload.nama_sekolah !== undefined) {
    payload.school_name = payload.nama_sekolah;
  } else if (payload.school_name !== undefined) {
    payload.nama_sekolah = payload.school_name;
  }

  // Synchronize academic_year and tahun_ajaran_aktif
  if (payload.tahun_ajaran_aktif !== undefined) {
    payload.academic_year = payload.tahun_ajaran_aktif;
  } else if (payload.academic_year !== undefined) {
    payload.tahun_ajaran_aktif = payload.academic_year;
  }

  // Synchronize default_semester and semester_aktif
  if (payload.semester_aktif !== undefined) {
    payload.default_semester = payload.semester_aktif;
  } else if (payload.default_semester !== undefined) {
    payload.semester_aktif = payload.default_semester;
  }

  // Synchronize drive_folder_url and google_drive_folder_url
  if (payload.google_drive_folder_url !== undefined) {
    payload.drive_folder_url = payload.google_drive_folder_url;
  } else if (payload.drive_folder_url !== undefined) {
    payload.google_drive_folder_url = payload.drive_folder_url;
  }

  // If daftar_tahun_ajaran is array, stringify it
  if (payload.daftar_tahun_ajaran && Array.isArray(payload.daftar_tahun_ajaran)) {
    payload.daftar_tahun_ajaran = JSON.stringify(payload.daftar_tahun_ajaran);
  }

  for (var key in payload) {
    var val = payload[key];
    if (typeof val === 'object' && val !== null) {
      val = JSON.stringify(val);
    }
    if (existingMap[key]) {
      sheet.getRange(existingMap[key], 2).setValue(val);
    } else {
      sheet.appendRow([key, val]);
      existingMap[key] = sheet.getLastRow();
    }
  }
  invalidateCaches();
  logActivity('UPDATE_SETTINGS', 'Memperbarui pengaturan sekolah, logo, kop & tahun ajaran');
  return { success: true, settings: getSettingsMap() };
}

/**
 * Google Drive Archive Folder Helper
 */
function getDriveFolderArsip() {
  var settings = getSettingsMap();
  var driveUrl = settings.google_drive_folder_url || settings.drive_folder_url || '';
  var folderId = settings.google_drive_folder_id || settings.drive_folder_id || '';

  if (!folderId && driveUrl) {
    var match = driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      folderId = match[1];
    } else {
      var matchId = driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        folderId = matchId[1];
      }
    }
  }

  var folder = null;
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      Logger.log('Folder Drive berdasarkan ID tidak ditemukan atau tidak ada akses: ' + e.message);
      folder = null;
    }
  }

  // If folder not found or not configured, search or create a dedicated folder in Google Drive
  if (!folder) {
    var folderName = 'Arsip Administrasi Ujian - ' + (settings.nama_sekolah || 'SMK NEGERI FYJ Channel');
    try {
      var existingFolders = DriveApp.getFoldersByName(folderName);
      if (existingFolders.hasNext()) {
        folder = existingFolders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
    } catch (e) {
      try {
        folder = DriveApp.getRootFolder();
      } catch (err) {
        folder = null;
      }
    }

    if (folder) {
      try {
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {}

      try {
        apiSavePengaturan({
          google_drive_folder_url: folder.getUrl(),
          google_drive_folder_id: folder.getId()
        });
      } catch (e) {}
    }
  }

  return folder;
}

function apiEnsureDriveFolder() {
  try {
    var folder = getDriveFolderArsip();
    return {
      success: true,
      id: folder.getId(),
      name: folder.getName(),
      url: folder.getUrl()
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Upload Asset (Kop Surat / Logo) directly to Google Drive Archive Folder
 * and immediately replace previous URL in Sheet Pengaturan.
 */
function apiUploadAssetToDrive(type, base64Data, filename, mimeType) {
  if (!base64Data) {
    throw new Error('Data berkas gambar tidak ditemukan.');
  }

  var folder = getDriveFolderArsip();
  if (!folder) {
    throw new Error('Folder Google Drive Arsip tidak dapat diakses.');
  }

  var cleanBase64 = base64Data;
  if (base64Data.indexOf(';base64,') !== -1) {
    cleanBase64 = base64Data.split(';base64,')[1];
  }

  mimeType = mimeType || 'image/png';
  if (!filename) {
    var ext = (mimeType.indexOf('jpeg') !== -1 || mimeType.indexOf('jpg') !== -1) ? 'jpg' :
              (mimeType.indexOf('webp') !== -1 ? 'webp' : 'png');
    filename = (type === 'logo' ? 'logo_sekolah_' : 'kop_header_') + Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyyMMdd_HHmmss') + '.' + ext;
  }

  var bytes = Utilities.base64Decode(cleanBase64);
  var blob = Utilities.newBlob(bytes, mimeType, filename);
  var file = folder.createFile(blob);

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log('Set sharing notice: ' + e.message);
  }

  var fileId = file.getId();
  var driveViewUrl = file.getUrl();
  var directImageUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600';

  var updates = {};
  if (type === 'logo') {
    updates.school_logo = directImageUrl;
    updates.logo_path = directImageUrl;
  } else {
    updates.kop_header = directImageUrl;
    updates.kop_image_path = directImageUrl;
  }

  apiSavePengaturan(updates);
  logActivity('UPLOAD_ASSET', 'Mengunggah ' + (type === 'logo' ? 'Logo Sekolah' : 'Banner Kop Surat') + ' ke Google Drive Arsip: ' + filename);

  return {
    success: true,
    fileId: fileId,
    url: directImageUrl,
    driveViewUrl: driveViewUrl,
    filename: filename,
    type: type,
    folderUrl: folder.getUrl()
  };
}

function apiAddTahunAjaran(tahun) {
  if (!tahun || typeof tahun !== 'string') throw new Error('Format tahun ajaran tidak valid.');
  tahun = tahun.trim();
  var settings = getSettingsMap();
  var list = settings.daftar_tahun_ajaran || [];
  if (list.indexOf(tahun) === -1) {
    list.push(tahun);
    list.sort();
  }
  return apiSavePengaturan({ daftar_tahun_ajaran: list });
}

function apiDeleteTahunAjaran(tahun) {
  if (!tahun) throw new Error('Tahun ajaran tidak valid.');
  var settings = getSettingsMap();
  if (settings.tahun_ajaran_aktif === tahun) {
    throw new Error('Tahun ajaran ' + tahun + ' sedang aktif dan tidak dapat dihapus.');
  }
  var list = (settings.daftar_tahun_ajaran || []).filter(function(t) { return t !== tahun; });
  return apiSavePengaturan({ daftar_tahun_ajaran: list });
}

function apiSetActiveTahunAjaran(tahun) {
  if (!tahun) throw new Error('Tahun ajaran tidak valid.');
  var settings = getSettingsMap();
  var list = settings.daftar_tahun_ajaran || [];
  if (list.indexOf(tahun) === -1) {
    list.push(tahun);
  }
  return apiSavePengaturan({ tahun_ajaran_aktif: tahun, daftar_tahun_ajaran: list });
}

function apiImportKelas(classes) {
  var count = 0;
  for (var i = 0; i < classes.length; i++) {
    insertRow(SHEET_NAMES.CLASSES, classes[i]);
    count++;
  }
  logActivity('IMPORT_KELAS', 'Mengimpor ' + count + ' data kelas dari Excel');
  return { success: true, count: count };
}

function apiImportUsers(users) {
  var count = 0;
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (u.password && !u.password_plain) u.password_plain = u.password;
    if (u.password_plain && !u.password) u.password = u.password_plain;
    insertRow(SHEET_NAMES.USERS, u);
    count++;
  }
  logActivity('IMPORT_USERS', 'Mengimpor ' + count + ' akun pengguna dari Excel');
  return { success: true, count: count };
}

/**
 * Universal Quick Toggle Status (Aktif <-> Nonaktif)
 */
function apiToggleMasterStatus(tableType, id, newStatus) {
  var sheetMap = {
    'kelas': SHEET_NAMES.CLASSES,
    'siswa': SHEET_NAMES.STUDENTS,
    'guru': SHEET_NAMES.TEACHERS,
    'mapel': SHEET_NAMES.MAPEL,
    'users': SHEET_NAMES.USERS,
    'template': SHEET_NAMES.TEMPLATES
  };
  var sheetName = sheetMap[tableType];
  if (!sheetName) return { success: false, message: 'Tabel master tidak valid: ' + tableType };

  var rows = readTable(sheetName);
  var target = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) {
      target = rows[i];
      break;
    }
  }
  if (!target) return { success: false, message: 'Data tidak ditemukan' };

  var statusVal;
  if (newStatus !== undefined && newStatus !== null) {
    statusVal = (newStatus === 1 || newStatus === '1' || newStatus === true || newStatus === 'true') ? 1 : 0;
  } else {
    var cur = parseInt(target.aktif, 10);
    statusVal = (cur === 1) ? 0 : 1;
  }

  updateRowById(sheetName, id, { aktif: statusVal });
  invalidateCaches();
  logActivity('TOGGLE_STATUS', 'Mengubah status ' + tableType + ' #' + id + ' menjadi ' + (statusVal === 1 ? 'Aktif' : 'Nonaktif'));
  return { success: true, newStatus: statusVal };
}

function apiSaveTemplate(payload) {
  if (payload.id && parseInt(payload.id, 10) > 0) {
    updateRowById(SHEET_NAMES.TEMPLATES, payload.id, payload);
    logActivity('UPDATE_TEMPLATE', 'Memperbarui template ujian ID #' + payload.id);
  } else {
    insertRow(SHEET_NAMES.TEMPLATES, payload);
    logActivity('CREATE_TEMPLATE', 'Menambahkan template ujian baru ' + payload.nama_ujian);
  }
  return { success: true };
}

function apiSaveUser(payload) {
  if (payload.password) {
    payload.password_plain = payload.password;
  } else if (payload.password_plain) {
    payload.password = payload.password_plain;
  }
  if (payload.id && parseInt(payload.id, 10) > 0) {
    updateRowById(SHEET_NAMES.USERS, payload.id, payload);
    logActivity('UPDATE_USER', 'Memperbarui pengguna ' + payload.username);
  } else {
    insertRow(SHEET_NAMES.USERS, payload);
    logActivity('CREATE_USER', 'Menambahkan pengguna baru ' + payload.username);
  }
  return { success: true };
}

function apiDeleteUser(id) {
  deleteRowById(SHEET_NAMES.USERS, id);
  logActivity('DELETE_USER', 'Menghapus pengguna ID #' + id);
  return { success: true };
}

function apiUpdateProfil(payload) {
  var users = readTable(SHEET_NAMES.USERS);
  var target = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].id) === String(payload.id)) {
      target = users[i];
      break;
    }
  }
  if (!target) return { success: false, message: 'User tidak ditemukan.' };

  var updates = {
    nama_lengkap: payload.nama_lengkap,
    username: payload.username
  };
  if (payload.password_plain) {
    updates.password = payload.password_plain;
    updates.password_plain = payload.password_plain;
  }
  if (payload.foto !== undefined) {
    updates.foto = payload.foto;
  }

  updateRowById(SHEET_NAMES.USERS, target.id, updates);
  logActivity('UPDATE_PROFILE', 'Memperbarui profil pengguna ' + payload.username);
  return {
    success: true,
    user: {
      id: target.id,
      username: updates.username,
      nama_lengkap: updates.nama_lengkap,
      role: target.role,
      foto: updates.foto !== undefined ? updates.foto : target.foto
    }
  };
}

/**
 * ==============================================================================
 * DATABASE INITIALIZATION & PRE-SEEDER
 * Jalankan fungsi 'jalankanIsiDataAwal' sekali untuk membuat seluruh sheet & data!
 * ==============================================================================
 */
function jalankanIsiDataAwal() {
  setupSpreadsheetDatabase();
}

function apiGetDatabaseInfo() {
  try {
    var ss = getSpreadsheet();
    return {
      success: true,
      id: ss.getId(),
      name: ss.getName(),
      url: ss.getUrl()
    };
  } catch (e) {
    return {
      success: false,
      message: e.message
    };
  }
}

function apiSetupDatabase() {
  try {
    setupSpreadsheetDatabase();
    invalidateCaches();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function setupSpreadsheetDatabase() {
  var ss = getSpreadsheet();

  // 1. Sheet Pengaturan (Diselaraskan runtut sesuai Menu Pengaturan)
  var sheetSettings = getSheet(SHEET_NAMES.SETTINGS);
  sheetSettings.clear();
  sheetSettings.appendRow(['setting_key', 'setting_value']);
  sheetSettings.getRange(1, 1, 1, 2).setFontWeight('bold');

  var defaultSettings = [
    // 1. Kop Surat Dokumen Resmi A4
    ['kop_mode', 'image'],
    ['kop_header', 'https://drive.google.com/thumbnail?id=1Z80pVGJv9v-GFwjE1_kBi_G9uRlR2gN7&sz=w1600'],
    ['kop_image_path', 'https://drive.google.com/thumbnail?id=1Z80pVGJv9v-GFwjE1_kBi_G9uRlR2gN7&sz=w1600'],
    ['kop_baris_1', 'PEMERINTAH PROVINSI FYJ'],
    ['kop_baris_2', 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA'],
    ['kop_baris_3', 'SMK NEGERI FYJ Channel'],
    ['kop_telepon', 'Telp. (0300) 2002 | Email: smkn@yahoo.com'],
    ['kop_website', 'Website: smkn.sch.id'],

    // 2. Logo Sekolah
    ['school_logo', 'https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI&sz=w1600'],
    ['logo_path', 'https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI&sz=w1600'],

    // 3. Identitas Sekolah & Penyimpanan Google Drive
    ['nama_sekolah', 'SMK NEGERI FYJ Channel'],
    ['school_name', 'SMK NEGERI FYJ Channel'],
    ['alamat_sekolah', 'Jl. Merpati No. 1'],
    ['google_drive_folder_url', 'https://drive.google.com/drive/folders/1sHpxyW6DbHSp1D7KNN-_xTu8fG9rY35h?usp=sharing'],
    ['drive_folder_url', 'https://drive.google.com/drive/folders/1sHpxyW6DbHSp1D7KNN-_xTu8fG9rY35h?usp=sharing'],

    // 4. Master Tahun Ajaran & Semester
    ['tahun_ajaran_aktif', '2026/2027'],
    ['academic_year', '2026/2027'],
    ['semester_aktif', 'Ganjil'],
    ['default_semester', 'Ganjil'],
    ['daftar_tahun_ajaran', JSON.stringify(['2024/2025', '2025/2026', '2026/2027', '2027/2028'])]
  ];

  for (var s = 0; s < defaultSettings.length; s++) {
    sheetSettings.appendRow(defaultSettings[s]);
  }

  // 2. Sheet Kelas
  var sheetKelas = getSheet(SHEET_NAMES.CLASSES);
  sheetKelas.clear();
  var kelasHeaders = ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'aktif', 'created_at', 'updated_at'];
  sheetKelas.appendRow(kelasHeaders);
  sheetKelas.getRange(1, 1, 1, kelasHeaders.length).setFontWeight('bold');
  var classesData = [{"id":1,"nama_kelas":"XII TKJ","tingkat":"XII","program_keahlian":"Teknik Komputer dan Jaringan","is_active":1},{"id":2,"nama_kelas":"XII DKV","tingkat":"XII","program_keahlian":"Desain Komunikasi Visual","is_active":1},{"id":3,"nama_kelas":"XII LPKKK 1","tingkat":"XII","program_keahlian":"LPKKK","is_active":1},{"id":4,"nama_kelas":"XII LPKKK 2","tingkat":"XII","program_keahlian":"Layanan Penunjang Kefarmasian Klinis dan Komunitas","is_active":1},{"id":5,"nama_kelas":"XII BD 1","tingkat":"XII","program_keahlian":"BD","is_active":1},{"id":6,"nama_kelas":"XII BD 2","tingkat":"XII","program_keahlian":"Bisnis Digital","is_active":1},{"id":7,"nama_kelas":"XII MP 1","tingkat":"XII","program_keahlian":"Manajemen Perkantoran dan Layanan Bisnis","is_active":1},{"id":8,"nama_kelas":"XII MP 2","tingkat":"XII","program_keahlian":"Manajemen Perkantoran dan Layanan Bisnis","is_active":1},{"id":9,"nama_kelas":"XII LPB","tingkat":"XII","program_keahlian":"Layanan Perbankan","is_active":1},{"id":10,"nama_kelas":"XII AK","tingkat":"XII","program_keahlian":"Akuntansi dan Keuangan Lembaga","is_active":1},{"id":11,"nama_kelas":"XII TSM","tingkat":"XII","program_keahlian":"Teknik Sepeda Motor","is_active":1}];
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  for (var c = 0; c < classesData.length; c++) {
    var cls = classesData[c];
    sheetKelas.appendRow([cls.id, cls.nama_kelas, cls.tingkat || 'XII', cls.program_keahlian || '', 1, now, now]);
  }

  // 3. Sheet Siswa
  var sheetSiswa = getSheet(SHEET_NAMES.STUDENTS);
  sheetSiswa.clear();
  var siswaHeaders = ['id', 'class_id', 'nama_kelas', 'nis', 'nisn', 'nama', 'program_keahlian', 'aktif', 'created_at', 'updated_at'];
  sheetSiswa.appendRow(siswaHeaders);
  sheetSiswa.getRange(1, 1, 1, siswaHeaders.length).setFontWeight('bold');
  var studentsData = [{"id":1,"class_id":1,"nis":"13561","nama":"Agustinus Poka Mete"},{"id":2,"class_id":1,"nis":"13562","nama":"Akbar Alfiansah"},{"id":3,"class_id":1,"nis":"13563","nama":"Dwi Retno Ayuningrum"},{"id":4,"class_id":1,"nis":"13565","nama":"I Gede Adtya Wedha Paramartha"},{"id":5,"class_id":1,"nis":"13566","nama":"I Gede Putra Sang Pajar"},{"id":6,"class_id":1,"nis":"13567","nama":"I Komang Giri Artawan"},{"id":7,"class_id":1,"nis":"13568","nama":"I Made Sugiarta"},{"id":8,"class_id":1,"nis":"13569","nama":"I Putu Adi Ari Endrawan"},{"id":9,"class_id":1,"nis":"13570","nama":"I Putu Agus Pratama Putra"},{"id":10,"class_id":1,"nis":"13571","nama":"I Putu Pasek Prawira Putra"},{"id":11,"class_id":1,"nis":"13572","nama":"I Wayan Kartika Adi Putra"},{"id":12,"class_id":1,"nis":"13573","nama":"Komang Jano Artha"},{"id":13,"class_id":1,"nis":"13574","nama":"M. Afgansyah Al-Maghfiroh"},{"id":14,"class_id":1,"nis":"13575","nama":"Made Pradnya Wahyu Radheya"},{"id":15,"class_id":1,"nis":"13576","nama":"Ni Ketut Sinta"},{"id":16,"class_id":1,"nis":"13577","nama":"Ni Komang Sila Triana Sari"},{"id":17,"class_id":1,"nis":"13578","nama":"Radit"},{"id":18,"class_id":1,"nis":"13579","nama":"Rizka Nurdiandari"},{"id":19,"class_id":1,"nis":"13580","nama":"Rizky Adib Irlan Syah"},{"id":20,"class_id":1,"nis":"13581","nama":"Rizqy Al Farraby"},{"id":21,"class_id":2,"nis":"13769","nama":"Anak Agung Gede Dika Pradipta"},{"id":22,"class_id":2,"nis":"13770","nama":"Gek Danaya Anindia"},{"id":23,"class_id":2,"nis":"13771","nama":"I Gede Ary Kesuma Suputra"},{"id":24,"class_id":2,"nis":"13772","nama":"I Gede Rian Primayoga"},{"id":25,"class_id":2,"nis":"13773","nama":"I Komang Raka Danaswara"},{"id":26,"class_id":2,"nis":"13774","nama":"I Made Dharma Mahardika"},{"id":27,"class_id":2,"nis":"13775","nama":"I Made Wahyu Adikusuma"},{"id":28,"class_id":2,"nis":"13776","nama":"I Putu Gede Eka Yogantara Pratmaja"},{"id":29,"class_id":2,"nis":"13777","nama":"I Putu Rendy Galang Permana"},{"id":30,"class_id":2,"nis":"13778","nama":"I Wayan Wira Pradnyana"},{"id":31,"class_id":2,"nis":"13779","nama":"Kadek Gita Anindita Kemulan"},{"id":32,"class_id":2,"nis":"13780","nama":"Komang Aditya"},{"id":33,"class_id":2,"nis":"13781","nama":"Ni Kadek Ayu Melani Ratna Dewi"},{"id":34,"class_id":2,"nis":"13782","nama":"Ni Kadek Ita Sutriani"},{"id":35,"class_id":2,"nis":"13783","nama":"Ni Kadek Ranita Dewi"},{"id":36,"class_id":2,"nis":"13784","nama":"Ni Luh Putu Sekar Darma Yanti"},{"id":37,"class_id":2,"nis":"13785","nama":"Ni Made Ayu Dwi Apriliani"},{"id":38,"class_id":2,"nis":"13786","nama":"Ni Putu Dian Cahyani"},{"id":39,"class_id":2,"nis":"13787","nama":"Ni Putu Ghina Anastasia Putri"},{"id":40,"class_id":2,"nis":"13788","nama":"Ni Putu Rismayani Darma Swari"},{"id":41,"class_id":2,"nis":"13789","nama":"Queena Bilqist Mulyadi Putri"},{"id":42,"class_id":2,"nis":"13790","nama":"Raditya Nugraha"},{"id":43,"class_id":2,"nis":"13791","nama":"Wayan Satya Dharma"},{"id":44,"class_id":3,"nis":"13582","nama":"Agus Billy Fedrico","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":45,"class_id":3,"nis":"13583","nama":"Agus Eka Widya Pradnyana","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":46,"class_id":3,"nis":"13584","nama":"Dewa Ayu Sri Widyastuti","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":47,"class_id":3,"nis":"13585","nama":"I Dewa Ayu Dwi Cahya Indrayani","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":48,"class_id":3,"nis":"13586","nama":"I Komang Edi Setiawan.","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":49,"class_id":3,"nis":"13587","nama":"Ida Ayu Putu Diah Kamiswari","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":50,"class_id":3,"nis":"13588","nama":"Luh Ade Galuh Pratiwi","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":51,"class_id":3,"nis":"13589","nama":"Munifa Inayatur Rohma","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":52,"class_id":3,"nis":"13590","nama":"Ni Kadek Ayu Arsani","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":53,"class_id":3,"nis":"13591","nama":"Ni Kadek Diah Dwi Adnyani","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":54,"class_id":3,"nis":"13592","nama":"Ni Kadek Dian Candra Pratiwi","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":55,"class_id":3,"nis":"13593","nama":"Ni Kadek Evinayanti","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":56,"class_id":3,"nis":"13595","nama":"Ni Komang Ayu Santika","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":57,"class_id":3,"nis":"13596","nama":"Ni Komang Widya Krista Yanti","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":58,"class_id":3,"nis":"13597","nama":"Ni Made Juniari","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":59,"class_id":3,"nis":"13598","nama":"Ni Made Shita Wulandari","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":60,"class_id":3,"nis":"13599","nama":"Ni Putu Intan Merliani Putri","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":61,"class_id":3,"nis":"13600","nama":"Ni Putu Novi Armatiana","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":62,"class_id":3,"nis":"13601","nama":"Ni Wayan Ani Arthayasih","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":63,"class_id":3,"nis":"13602","nama":"Ni Wayan Nanda Pradnya Suari","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":64,"class_id":3,"nis":"13603","nama":"Yoneda Yebleb","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":65,"class_id":4,"nis":"13604","nama":"Aisyah Dwi Agusthina"},{"id":66,"class_id":4,"nis":"13605","nama":"Elyska Kirana Putri"},{"id":67,"class_id":4,"nis":"14102","nama":"Gusti Ayu Putu Alita Bintang Lestari"},{"id":68,"class_id":4,"nis":"13606","nama":"I Gusti Ayu Indah Pertiwi"},{"id":69,"class_id":4,"nis":"13608","nama":"Mauli Diana Rahayu Putri"},{"id":70,"class_id":4,"nis":"13609","nama":"Ni Kadek Bintang Nopiani"},{"id":71,"class_id":4,"nis":"13611","nama":"Ni Kadek Winda Wulandewi"},{"id":72,"class_id":4,"nis":"13612","nama":"Ni Komang Anggraeni"},{"id":73,"class_id":4,"nis":"13613","nama":"Ni Komang Leges Aria Sentani"},{"id":74,"class_id":4,"nis":"13614","nama":"Ni Komang Sri Diah Lastari"},{"id":75,"class_id":4,"nis":"13615","nama":"Ni Komang Tri Maetarani"},{"id":76,"class_id":4,"nis":"13616","nama":"Ni Komang Trisna Dewi"},{"id":77,"class_id":4,"nis":"13617","nama":"Ni Luh Komang Divya Santhi"},{"id":78,"class_id":4,"nis":"13618","nama":"Ni Putu Galih Pratiwi Setiawan"},{"id":79,"class_id":4,"nis":"13619","nama":"Ni Putu Indah Muliarni"},{"id":80,"class_id":4,"nis":"13620","nama":"Ni Putu Martini Lestari"},{"id":81,"class_id":4,"nis":"13621","nama":"Ni Putu Widya Wulandari"},{"id":82,"class_id":4,"nis":"13622","nama":"Ni Wayan Novi Lestari"},{"id":83,"class_id":4,"nis":"13624","nama":"Rizqiana Ayudianingsih"},{"id":84,"class_id":5,"nis":"13625","nama":"Dewa Ayu Made Dwi Artika Darmayanti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":85,"class_id":5,"nis":"13626","nama":"I Gede Adi Putra","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":86,"class_id":5,"nis":"13627","nama":"I Gusti Ayu Wika Ariestari","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":87,"class_id":5,"nis":"13628","nama":"I Gusti Ngurah Wijana","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":88,"class_id":5,"nis":"13629","nama":"I Kadek Yogi Iswara","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":89,"class_id":5,"nis":"13630","nama":"I Nyoman Candra Paranarta","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":90,"class_id":5,"nis":"13631","nama":"Kadek Suki Oktami","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":91,"class_id":5,"nis":"13632","nama":"Luh Desiyani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":92,"class_id":5,"nis":"13633","nama":"Ni Kadek Ayu Dwipayani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":93,"class_id":5,"nis":"13634","nama":"Ni Kadek Sanjiani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":94,"class_id":5,"nis":"13635","nama":"Ni Kadek Widiantari","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":95,"class_id":5,"nis":"13636","nama":"Ni Komang Ayu Intan Pratiwi","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":96,"class_id":5,"nis":"13637","nama":"Ni Komang Henny Herdi Yani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":97,"class_id":5,"nis":"13638","nama":"Ni Komang Purnama Sari","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":98,"class_id":5,"nis":"13639","nama":"Ni Komang Sri Damayanti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":99,"class_id":5,"nis":"13640","nama":"Ni Komang Trisna Yuni Astari","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":100,"class_id":5,"nis":"13641","nama":"Ni Luh Putu Frema Sugi Maharani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":101,"class_id":5,"nis":"13642","nama":"Ni Made Sari Astini","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":102,"class_id":5,"nis":"13643","nama":"Ni Made Sukma Yanti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":103,"class_id":5,"nis":"13644","nama":"Ni Nyoman Manik Dalem Maharani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":104,"class_id":5,"nis":"13645","nama":"Ni Putu Eka Candra Dewi","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":105,"class_id":5,"nis":"13646","nama":"Ni Putu Sari Astuti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":106,"class_id":5,"nis":"13647","nama":"Ni Putu Sariasih","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":107,"class_id":5,"nis":"13648","nama":"Ni Putu Selpi","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":108,"class_id":5,"nis":"13649","nama":"Ni Putu Sinta Purnama Yanti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":109,"class_id":5,"nis":"13650","nama":"Putu Agus Mahendra","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":110,"class_id":5,"nis":"13651","nama":"Putu Aryadinata","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":111,"class_id":5,"nis":"13652","nama":"Putu Purnamawati","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":112,"class_id":5,"nis":"13653","nama":"Rizki Ananta Ramadhani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":113,"class_id":6,"nis":"13654","nama":"Anisa Safila"},{"id":114,"class_id":6,"nis":"13655","nama":"Dewa Ayu Raras Variati"},{"id":115,"class_id":6,"nis":"13794","nama":"Galang Damai Dinata"},{"id":116,"class_id":6,"nis":"13656","nama":"I Gede Sutawan"},{"id":117,"class_id":6,"nis":"13657","nama":"I Kadek Desta Prawira"},{"id":118,"class_id":6,"nis":"13658","nama":"I Kadek Purnawirawan"},{"id":119,"class_id":6,"nis":"13659","nama":"I Ketut Alit Rupawan"},{"id":120,"class_id":6,"nis":"13660","nama":"I Komang Sucitra"},{"id":121,"class_id":6,"nis":"13661","nama":"I Made Windya Arsana"},{"id":122,"class_id":6,"nis":"13662","nama":"I Putu Aditya Suputra"},{"id":123,"class_id":6,"nis":"13663","nama":"Kadek Agus Apriana Bajesti Putra"},{"id":124,"class_id":6,"nis":"13664","nama":"Luh Made Purnama Dewi"},{"id":125,"class_id":6,"nis":"13665","nama":"Ni Kadek Meta Febriantari"},{"id":126,"class_id":6,"nis":"13666","nama":"Ni Kadek Putri Jayanti"},{"id":127,"class_id":6,"nis":"13667","nama":"Ni Komang Ayu Septianingsih"},{"id":128,"class_id":6,"nis":"13668","nama":"Ni Luh Nova Sinta Riari"},{"id":129,"class_id":6,"nis":"13669","nama":"Ni Nengah Febriani"},{"id":130,"class_id":6,"nis":"13670","nama":"Ni Pande Wayan Yonika Damayani"},{"id":131,"class_id":6,"nis":"13671","nama":"Ni Putu Lia Trisnayanti"},{"id":132,"class_id":6,"nis":"13672","nama":"Putu Vera Agustin"},{"id":133,"class_id":7,"nis":"13673","nama":"Anak Agung Dewi Suryaningrat"},{"id":134,"class_id":7,"nis":"13674","nama":"Desak Nyoman Widya Sari"},{"id":135,"class_id":7,"nis":"13675","nama":"I Dewa Ayu Bulan Sriasih"},{"id":136,"class_id":7,"nis":"13676","nama":"I Gede Ary Sudiantara"},{"id":137,"class_id":7,"nis":"13677","nama":"I Gede Nesa Wira Arsana"},{"id":138,"class_id":7,"nis":"13678","nama":"I Gusti Ayu Diana Kristiani"},{"id":139,"class_id":7,"nis":"13679","nama":"I Gusti Ngurah Agus Januarta"},{"id":140,"class_id":7,"nis":"13680","nama":"Komang Ayu Seri Musthikarani"},{"id":141,"class_id":7,"nis":"13681","nama":"Made Nitarianti"},{"id":142,"class_id":7,"nis":"13682","nama":"Meisya Fazrina"},{"id":143,"class_id":7,"nis":"13683","nama":"Ni Kadek Aprilia Lestari"},{"id":144,"class_id":7,"nis":"13684","nama":"Ni Kadek Ayu Lestari"},{"id":145,"class_id":7,"nis":"13685","nama":"Ni Kadek Darma Yanti"},{"id":146,"class_id":7,"nis":"13686","nama":"Ni Kadek Ika Pradevi"},{"id":147,"class_id":7,"nis":"13687","nama":"Ni Kadek Risna Kumala Dewi"},{"id":148,"class_id":7,"nis":"13688","nama":"Ni Kadek Sintia Wati"},{"id":149,"class_id":7,"nis":"13689","nama":"Ni Ketut Melia Purnama Sari"},{"id":150,"class_id":7,"nis":"13690","nama":"Ni Komang Ayu Widiantari"},{"id":151,"class_id":7,"nis":"13691","nama":"Ni Komang Diah Anandita Permata"},{"id":152,"class_id":7,"nis":"13692","nama":"Ni Komang Rini Cahyani"},{"id":153,"class_id":7,"nis":"13693","nama":"Ni Luh Ayu Purnama Dewi"},{"id":154,"class_id":7,"nis":"13694","nama":"Ni Luh Lisna Diantari"},{"id":155,"class_id":7,"nis":"13695","nama":"Ni Luh Sri Nadi"},{"id":156,"class_id":7,"nis":"13696","nama":"Ni Nengah Septia Dewi"},{"id":157,"class_id":7,"nis":"13697","nama":"Ni Putu Eka Pramita Sari"},{"id":158,"class_id":7,"nis":"13698","nama":"Pande Ni Putu Adisty Kusuma Jati"},{"id":159,"class_id":7,"nis":"13699","nama":"Tiara Yuliyanti"},{"id":160,"class_id":8,"nis":"13700","nama":"Anak Agung Istri Amira Vebriani"},{"id":161,"class_id":8,"nis":"13701","nama":"I Dewa Ayu Juniantari"},{"id":162,"class_id":8,"nis":"13702","nama":"I Gede Tri Jaya Winnata"},{"id":163,"class_id":8,"nis":"13703","nama":"Ida Bagus Yuda Pratama"},{"id":164,"class_id":8,"nis":"13704","nama":"Irsyad Adiba Hafas Zidansyah"},{"id":165,"class_id":8,"nis":"13705","nama":"Ni Kadek Ayu Aprilia Dewi"},{"id":166,"class_id":8,"nis":"13706","nama":"Ni Kadek Ayu Larasati"},{"id":167,"class_id":8,"nis":"13707","nama":"Ni Kadek Puspa Aryanti"},{"id":168,"class_id":8,"nis":"13708","nama":"Ni Kadek Sriyanti"},{"id":169,"class_id":8,"nis":"13709","nama":"Ni Komang Adelia Putri"},{"id":170,"class_id":8,"nis":"13710","nama":"Ni Komang Indah Jesika Dewi"},{"id":171,"class_id":8,"nis":"13711","nama":"Ni Komang Listia Dewi"},{"id":172,"class_id":8,"nis":"13712","nama":"Ni Komang Padmawati"},{"id":173,"class_id":8,"nis":"13713","nama":"Ni Komang Sutri Prantini"},{"id":174,"class_id":8,"nis":"13714","nama":"Ni Komang Triana Pusparani"},{"id":175,"class_id":8,"nis":"13715","nama":"Ni Luh Vika Widyawati"},{"id":176,"class_id":8,"nis":"13716","nama":"Ni Made Suci Manik Astari"},{"id":177,"class_id":8,"nis":"13717","nama":"Ni Putu Ayu Bintang"},{"id":178,"class_id":8,"nis":"13718","nama":"Ni Putu Diah Arthasari"},{"id":179,"class_id":8,"nis":"13719","nama":"Ni Putu Eka Semara Putri"},{"id":180,"class_id":8,"nis":"13720","nama":"Ni Putu Eka Widiantari"},{"id":181,"class_id":8,"nis":"13721","nama":"Ni Putu Mei Wulandari"},{"id":182,"class_id":8,"nis":"13722","nama":"Ni Putu Puspawati"},{"id":183,"class_id":8,"nis":"13723","nama":"Ni Putu Tia Dewi"},{"id":184,"class_id":8,"nis":"13724","nama":"Pande Putu Galuh Risanti Indira Yunika"},{"id":185,"class_id":8,"nis":"13725","nama":"Putu Juli Ayu Antari"},{"id":186,"class_id":8,"nis":"13726","nama":"Sang Made Arta Mahendra"},{"id":187,"class_id":9,"nis":"13727","nama":"Afrilia"},{"id":188,"class_id":9,"nis":"13728","nama":"Anak Agung Istri Prima Pebrianti"},{"id":189,"class_id":9,"nis":"13729","nama":"Gede Risky Adi Permana"},{"id":190,"class_id":9,"nis":"13730","nama":"I Gusti Ayu Putu Candra Widiantari"},{"id":191,"class_id":9,"nis":"13731","nama":"I Gusti Made Diah Purnama Sari"},{"id":192,"class_id":9,"nis":"13732","nama":"Ida Ayu Indah Gangga Swari"},{"id":193,"class_id":9,"nis":"13733","nama":"Ida Ayu Nyoman Reditya Oktaviani"},{"id":194,"class_id":9,"nis":"13734","nama":"Ida Ayu Sinta Dewi"},{"id":195,"class_id":9,"nis":"13736","nama":"Nabila Tusak Diah"},{"id":196,"class_id":9,"nis":"13737","nama":"Ni Kadek Intan Satrya Wati"},{"id":197,"class_id":9,"nis":"13738","nama":"Ni Made Ari Diana Sari"},{"id":198,"class_id":9,"nis":"13739","nama":"Rina Agustina"},{"id":199,"class_id":10,"nis":"13741","nama":"I Desak Ketut Patniki Astuti"},{"id":200,"class_id":10,"nis":"13742","nama":"I Dewa Ayu Awidiya Sari"},{"id":201,"class_id":10,"nis":"13743","nama":"I Dewa Ayu Meira Dianra Sari"},{"id":202,"class_id":10,"nis":"13744","nama":"I Putu Juniarta"},{"id":203,"class_id":10,"nis":"13745","nama":"I Wayan Agus Septiadi"},{"id":204,"class_id":10,"nis":"13746","nama":"Ketut Ananta Wardana"},{"id":205,"class_id":10,"nis":"13747","nama":"Ni Kadek Anggun Putri Pramesti"},{"id":206,"class_id":10,"nis":"13748","nama":"Ni Kadek Ratih Sancikadewi"},{"id":207,"class_id":10,"nis":"13749","nama":"Ni Kadek Santiasih"},{"id":208,"class_id":10,"nis":"13750","nama":"Ni Kadek Sinta Widyantini"},{"id":209,"class_id":10,"nis":"13751","nama":"Ni Kadek Suadnyani Megeng"},{"id":210,"class_id":10,"nis":"13752","nama":"Ni Ketut Catur Rahayu"},{"id":211,"class_id":10,"nis":"13753","nama":"Ni Komang Bintang Triasih"},{"id":212,"class_id":10,"nis":"13754","nama":"Ni Luh Nyoman Tri Githa Pramesti"},{"id":213,"class_id":10,"nis":"13755","nama":"Ni Luh Putu Candra Cahyani"},{"id":214,"class_id":10,"nis":"13756","nama":"Ni Putu Anggik Deswandari"},{"id":215,"class_id":10,"nis":"13757","nama":"Ni Putu Ayu Krisna Candra Dewi"},{"id":216,"class_id":10,"nis":"13758","nama":"Ni Putu Dewik"},{"id":217,"class_id":10,"nis":"13759","nama":"Ni Putu Diah Darmayanti"},{"id":218,"class_id":10,"nis":"13760","nama":"Ni Putu Dian Ambarwati"},{"id":219,"class_id":10,"nis":"13761","nama":"Ni Putu Dian Maharani"},{"id":220,"class_id":10,"nis":"13762","nama":"Ni Putu Echa Setyawati"},{"id":221,"class_id":10,"nis":"13763","nama":"Ni Putu Eka Pandewi"},{"id":222,"class_id":10,"nis":"13764","nama":"Ni Putu Stefany Devita Putri"},{"id":223,"class_id":10,"nis":"13765","nama":"Ni Putu Wita Sinta Pradnyani"},{"id":224,"class_id":10,"nis":"13766","nama":"Ni Wayan Chandra Rusita Devi"},{"id":225,"class_id":10,"nis":"13767","nama":"Pande Made Shasmita Aurellia Putri"},{"id":226,"class_id":10,"nis":"13768","nama":"Yenny Febri Yanthy Ningsih"},{"id":227,"class_id":11,"nis":"13526","nama":"Aldo Valentino"},{"id":228,"class_id":11,"nis":"13527","nama":"ARKANANTA MAULANA PUTRA APRILIANSYAH"},{"id":229,"class_id":11,"nis":"13528","nama":"I Gede Ari Widnyana"},{"id":230,"class_id":11,"nis":"13529","nama":"I Gede Candra Wiguna"},{"id":231,"class_id":11,"nis":"13530","nama":"I Gede Resa Pradnya Andika"},{"id":232,"class_id":11,"nis":"13531","nama":"I GUSTI NGURAH SATHYA DANANJAYA"},{"id":233,"class_id":11,"nis":"13532","nama":"I Kadek Angga Aditya Putra"},{"id":234,"class_id":11,"nis":"13533","nama":"I Kadek Dodik Ramayoga"},{"id":235,"class_id":11,"nis":"13534","nama":"I Kadek Dwi Adi Darma Yudhi"},{"id":236,"class_id":11,"nis":"13535","nama":"I Kadek Ipan Junata"},{"id":237,"class_id":11,"nis":"13536","nama":"I KADEK KUSUMA CAHYADI"},{"id":238,"class_id":11,"nis":"13537","nama":"I Ketut Catur Yoga Saputra"},{"id":239,"class_id":11,"nis":"13540","nama":"I Komang Bayu Septi Permana"},{"id":240,"class_id":11,"nis":"13541","nama":"I Komang Pebri Andika Saputra"},{"id":241,"class_id":11,"nis":"13542","nama":"I Made Agus Bayu Widi"},{"id":242,"class_id":11,"nis":"13543","nama":"I Made Div Aditya Pramana"},{"id":243,"class_id":11,"nis":"13544","nama":"I Ngurah Komang Ari Artana"},{"id":244,"class_id":11,"nis":"13545","nama":"I Putu Bayu Saputra"},{"id":245,"class_id":11,"nis":"13547","nama":"I Putu Pande Sedaya Tana"},{"id":246,"class_id":11,"nis":"13548","nama":"I Wayan Surya Nanta"},{"id":247,"class_id":11,"nis":"13550","nama":"JULIANTARA PUTRA"},{"id":248,"class_id":11,"nis":"13551","nama":"Kadek Angga Trisnawan"},{"id":249,"class_id":11,"nis":"13552","nama":"Ketut Mahardika"},{"id":250,"class_id":11,"nis":"13538","nama":"Ketut Rianta"},{"id":251,"class_id":11,"nis":"13553","nama":"Lorensius Kaka Lalo"},{"id":252,"class_id":11,"nis":"13554","nama":"Made Adi Mahardika"},{"id":253,"class_id":11,"nis":"13555","nama":"MUHAMMAD AZIZUL HAKIM"},{"id":254,"class_id":11,"nis":"13556","nama":"Nyoman Yudhi Triananda Wibawa"},{"id":255,"class_id":11,"nis":"13558","nama":"REDNO FEDRIANZAH"},{"id":256,"class_id":11,"nis":"13795","nama":"ROBERTO CHRISTIANO"},{"id":257,"class_id":11,"nis":"13559","nama":"WIRANTO SANJAYA"},{"id":258,"class_id":11,"nis":"13560","nama":"YUSUF ARDIANSYAH"}];
  for (var s = 0; s < studentsData.length; s++) {
    var st = studentsData[s];
    sheetSiswa.appendRow([st.id, st.class_id, st.nama_kelas || '', st.nis || '', st.nisn || '', st.nama || '', st.program_keahlian || '', 1, now, now]);
  }

  // 4. Sheet Guru
  var sheetGuru = getSheet(SHEET_NAMES.TEACHERS);
  sheetGuru.clear();
  var guruHeaders = ['id', 'nama', 'nip', 'jabatan', 'aktif', 'created_at', 'updated_at'];
  sheetGuru.appendRow(guruHeaders);
  sheetGuru.getRange(1, 1, 1, guruHeaders.length).setFontWeight('bold');
  var teachersData = [{"id":1,"nama":"I Wayan Sukadana, S.Pd.","nip":"19820514 200801 1 012","mapel":"Teknik Jaringan Komputer","jabatan":"Guru Madya / Pengawas"},{"id":2,"nama":"Ni Made Rai Artini, S.Kom.","nip":"19870921 201101 2 008","mapel":"Desain Komunikasi Visual","jabatan":"Guru Muda / Pengawas"},{"id":3,"nama":"Drs. I Ketut Suardana, M.Pd.","nip":"19680315 199412 1 002","mapel":"Bahasa Indonesia","jabatan":"Guru Pembina / Pengawas"},{"id":4,"nama":"Ni Luh Putu Dewi Lestari, S.Pd.","nip":"19841120 200902 2 005","mapel":"Matematika","jabatan":"Guru Madya / Pengawas"},{"id":5,"nama":"I Made Agus Wira Pratama, S.T.","nip":"19890610 201503 1 004","mapel":"Teknik Sepeda Motor","jabatan":"Guru Muda / Pengawas"},{"id":6,"nama":"Ni Kadek Sri Wahyuni, S.Farm., Apt.","nip":"19910425 201903 2 011","mapel":"Layanan Penunjang Kefarmasian","jabatan":"Guru Pertama / Pengawas"},{"id":7,"nama":"I Gusti Ngurah Agung Putra, S.E.","nip":"19780814 200604 1 009","mapel":"Akuntansi dan Keuangan","jabatan":"Guru Madya / Pengawas"},{"id":8,"nama":"Ni Putu Eka Yuliani, S.Pd.","nip":"19860112 201001 2 018","mapel":"Manajemen Perkantoran","jabatan":"Guru Muda / Pengawas"},{"id":9,"nama":"I Komang Yudi Antara, S.Kom.","nip":"19920818 202012 1 007","mapel":"Bisnis Digital","jabatan":"Guru Pertama / Pengawas"},{"id":10,"nama":"Ida Bagus Made Ananda, S.Pd.","nip":"19800722 200501 1 006","mapel":"Bahasa Inggris","jabatan":"Guru Madya / Pengawas"}];
  for (var t = 0; t < teachersData.length; t++) {
    var tch = teachersData[t];
    sheetGuru.appendRow([tch.id, tch.nama, tch.nip || '-', tch.jabatan || 'Guru / Pengawas', 1, now, now]);
  }

  // 5. Sheet Mapel
  var sheetMapel = getSheet(SHEET_NAMES.MAPEL);
  sheetMapel.clear();
  var mapelHeaders = ['id', 'kode_mapel', 'nama_mapel', 'kelompok', 'aktif', 'created_at', 'updated_at'];
  sheetMapel.appendRow(mapelHeaders);
  sheetMapel.getRange(1, 1, 1, mapelHeaders.length).setFontWeight('bold');
  var mapelsData = [{"id":1,"kode_mapel":"MP-001","nama_mapel":"Desain Komunikasi Visual","kelompok":"Kejuruan","aktif":1},{"id":2,"kode_mapel":"MP-002","nama_mapel":"Teknik Komputer dan Jaringan","kelompok":"Kejuruan","aktif":1},{"id":3,"kode_mapel":"MP-003","nama_mapel":"Teknik Sepeda Motor","kelompok":"Kejuruan","aktif":1},{"id":4,"kode_mapel":"MP-004","nama_mapel":"Layanan Penunjang Kefarmasian Klinis dan Komunitas","kelompok":"Kejuruan","aktif":1},{"id":5,"kode_mapel":"MP-005","nama_mapel":"Bisnis Digital","kelompok":"Kejuruan","aktif":1},{"id":6,"kode_mapel":"MP-006","nama_mapel":"Manajemen Perkantoran","kelompok":"Kejuruan","aktif":1},{"id":7,"kode_mapel":"MP-007","nama_mapel":"Akuntansi dan Keuangan Lembaga","kelompok":"Kejuruan","aktif":1},{"id":8,"kode_mapel":"MP-008","nama_mapel":"Matematika","kelompok":"Umum","aktif":1},{"id":9,"kode_mapel":"MP-009","nama_mapel":"Bahasa Indonesia","kelompok":"Umum","aktif":1},{"id":10,"kode_mapel":"MP-010","nama_mapel":"Bahasa Inggris","kelompok":"Umum","aktif":1},{"id":11,"kode_mapel":"MP-011","nama_mapel":"Pendidikan Agama Hindu dan Budi Pekerti","kelompok":"Umum","aktif":1},{"id":12,"kode_mapel":"MP-012","nama_mapel":"Pendidikan Pancasila","kelompok":"Umum","aktif":1},{"id":13,"kode_mapel":"MP-013","nama_mapel":"Sejarah","kelompok":"Umum","aktif":1},{"id":14,"kode_mapel":"MP-014","nama_mapel":"Informatika","kelompok":"Umum","aktif":1},{"id":15,"kode_mapel":"MP-015","nama_mapel":"Projek IPAS","kelompok":"Umum","aktif":1},{"id":16,"kode_mapel":"MP-016","nama_mapel":"Mapel Pilihan","kelompok":"Kejuruan","aktif":1},{"id":17,"kode_mapel":"MP-017","nama_mapel":"Seni Budaya","kelompok":"Muatan Lokal","aktif":1},{"id":18,"kode_mapel":"MP-018","nama_mapel":"Kreativitas, Inovasi dan Kewirausahaan","kelompok":"Kejuruan","aktif":1}];
  for (var m = 0; m < mapelsData.length; m++) {
    var mp = mapelsData[m];
    sheetMapel.appendRow([mp.id, mp.kode_mapel, mp.nama_mapel, mp.kelompok, 1, now, now]);
  }

  // 6. Sheet TemplateUjian
  var sheetTpl = getSheet(SHEET_NAMES.TEMPLATES);
  sheetTpl.clear();
  var tplHeaders = ['id', 'nama_ujian', 'tahun_ajaran', 'judul_berita_acara', 'redaksi_isi', 'redaksi_pembuka', 'redaksi_poin_1', 'redaksi_poin_2', 'label_catatan', 'aktif', 'created_at', 'updated_at'];
  sheetTpl.appendRow(tplHeaders);
  sheetTpl.getRange(1, 1, 1, tplHeaders.length).setFontWeight('bold');
  var defaultTpl = {
    id: 1,
    nama_ujian: 'Sumatif Akhir Semester (SAS) Ganjil',
    tahun_ajaran: '2026/2027',
    judul_berita_acara: 'BERITA ACARA \r\nPENYELENGGARAAN SUMATIF AKHIR SEMESTER (SAS) GANJIL\r\nTAHUN AJARAN [tahun_ajaran]',
    redaksi_isi: '<p>Pada hari ini&nbsp;<strong>[hari]</strong>, tanggal&nbsp;<strong>[tanggal]</strong>&nbsp;(<strong><i>[tanggal_teks]</i></strong>) bulan&nbsp;<strong>[bulan]</strong>&nbsp;tahun&nbsp;<strong>[tahun]</strong>&nbsp;(<strong><i>[tahun_teks]</i></strong>):</p><ol style="margin-top: 6px; margin-bottom: 12px;"><li style="margin-bottom: 8px;">Telah diselenggarakan&nbsp;<strong>[nama_ujian]</strong>&nbsp;Tahun Ajaran&nbsp;<strong>[tahun_ajaran]</strong>&nbsp;dari pukul&nbsp;<strong>[jam_mulai]</strong>&nbsp;sampai dengan pukul&nbsp;<strong>[jam_selesai]</strong>&nbsp;WITA.<ul style="margin-bottom: 6px; margin-left: 20px; list-style-type: disc;"><li>Pada Sekolah:&nbsp;<strong>[sekolah]</strong></li><li>Kelas:&nbsp;<strong>[kelas]</strong></li><li>Mata Pelajaran:&nbsp;<strong>[mata_pelajaran]</strong></li><li>Ruang:&nbsp;<strong>[ruang]</strong></li><li>Jumlah Peserta Seharusnya:&nbsp;<strong>[peserta_seharusnya]</strong>&nbsp;orang</li><li>Jumlah Peserta yang Tidak Hadir:&nbsp;<strong>[peserta_tidak_hadir]</strong>&nbsp;orang</li><li>Jumlah Peserta yang Hadir:&nbsp;<strong>[peserta_hadir]</strong>&nbsp;orang</li></ul></li><li style="margin-bottom: 8px;">Telah mengisi&nbsp;lembar blangko berita acara sebanyak&nbsp;<strong>[blangko_berita_acara]</strong>&nbsp;eksemplar dan blangko daftar hadir sebanyak&nbsp;<strong>[blangko_daftar_hadir]</strong>&nbsp;eksemplar, untuk Mata Pelajaran&nbsp;<strong>[mata_pelajaran]</strong>&nbsp;di ruang&nbsp;<strong>[ruang]</strong>&nbsp;dan kelas&nbsp;<strong>[kelas]</strong>&nbsp;dengan disaksikan oleh para peserta.</li><li style="margin-bottom: 8px;">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):<br><em>[catatan_pelaksanaan]</em></li></ol><p style="margin-top: 15px;">Demikian Berita Acara ini dibuat dengan sesungguhnya.</p><p style="text-align: center; margin-top: 15px;">Yang membuat berita acara :</p>',
    redaksi_pembuka: 'Pada hari ini [hari], tanggal [tanggal] bulan [bulan] tahun [tahun].',
    redaksi_poin_1: 'Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran].',
    redaksi_poin_2: 'Telah mengisi blangko berita acara dan daftar hadir.',
    label_catatan: 'Catatan selama pelaksanaan ujian:',
    aktif: 1
  };
  sheetTpl.appendRow([defaultTpl.id, defaultTpl.nama_ujian, defaultTpl.tahun_ajaran, defaultTpl.judul_berita_acara, defaultTpl.redaksi_isi, defaultTpl.redaksi_pembuka, defaultTpl.redaksi_poin_1, defaultTpl.redaksi_poin_2, defaultTpl.label_catatan, 1, now, now]);

  // 7. Sheet Absensi
  var sheetAbs = getSheet(SHEET_NAMES.ABSENSI);
  sheetAbs.clear();
  var absHeaders = ['id', 'nama_ujian', 'tahun_ajaran', 'semester', 'class_id', 'nama_kelas', 'tingkat', 'mata_pelajaran', 'sesi', 'ruang', 'tanggal_ujian', 'jam_mulai', 'jam_selesai', 'peserta_hadir', 'peserta_dispensasi', 'peserta_izin', 'peserta_sakit', 'peserta_tidak_hadir', 'total_peserta', 'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2', 'signature_mode', 'ttd_pengawas_1', 'ttd_pengawas_2', 'data_siswa', 'created_at', 'updated_at'];
  sheetAbs.appendRow(absHeaders);
  sheetAbs.getRange(1, 1, 1, absHeaders.length).setFontWeight('bold');

  // 8. Sheet BeritaAcara
  var sheetBA = getSheet(SHEET_NAMES.BERITA_ACARA);
  sheetBA.clear();
  var baHeaders = ['id', 'template_id', 'nama_ujian', 'tahun_ajaran', 'semester', 'class_id', 'nama_kelas', 'tingkat', 'mata_pelajaran', 'tanggal_ujian', 'jam_mulai', 'jam_selesai', 'ruang', 'peserta_seharusnya', 'peserta_hadir', 'peserta_tidak_hadir', 'blangko_berita_acara', 'blangko_daftar_hadir', 'catatan_pelaksanaan', 'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2', 'signature_mode', 'ttd_pengawas_1', 'ttd_pengawas_2', 'foto_dokumentasi', 'created_at', 'updated_at'];
  sheetBA.appendRow(baHeaders);
  sheetBA.getRange(1, 1, 1, baHeaders.length).setFontWeight('bold');

  // 9. Sheet Users
  var sheetUsers = getSheet(SHEET_NAMES.USERS);
  sheetUsers.clear();
  var userHeaders = ['id', 'username', 'password', 'password_plain', 'nama_lengkap', 'role', 'foto', 'created_at', 'updated_at'];
  sheetUsers.appendRow(userHeaders);
  sheetUsers.getRange(1, 1, 1, userHeaders.length).setFontWeight('bold');
  sheetUsers.appendRow([1, 'admin', 'admin123', 'admin123', 'Administrator SAS SMK', 'admin', '', now, now]);
  sheetUsers.appendRow([2, 'operator', 'operator123', 'operator123', 'Operator SAS SMK', 'operator', '', now, now]);

  // 10. Sheet ActivityLogs
  var sheetLogs = getSheet(SHEET_NAMES.LOGS);
  sheetLogs.clear();
  var logHeaders = ['id', 'waktu', 'aktivitas', 'keterangan', 'ip_address'];
  sheetLogs.appendRow(logHeaders);
  sheetLogs.getRange(1, 1, 1, logHeaders.length).setFontWeight('bold');
  sheetLogs.appendRow([1, now, 'SYSTEM_INIT', 'Inisialisasi basis data 10 tabel relasional berhasil', 'System']);

  invalidateCaches();
  Logger.log('Inisialisasi Database Berhasil Selesai!');
}

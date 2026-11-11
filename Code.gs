/**
 * ==============================================================================
 * SISTEM ADMINISTRASI UJIAN (SAS) - SMK NEGERI FYJ CHANNEL
 * Generator Absensi & Berita Acara Ujian Resmi Format A4 PDF & Excel (.xls)
 * Platform: Google Apps Script & Google Sheets Database Relasional
 * ==============================================================================
 */

var TARGET_SPREADSHEET_ID = '1IA6B5Mgt6kIYeV9c8ZdR9RliccV0U2OTlGJhsD30c2Y';
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

function getScriptCacheJson(key) {
  try {
    var raw = CacheService.getScriptCache().get(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    Logger.log('Cache read error (' + key + '): ' + e);
  }
  return null;
}

function putScriptCacheJson(key, data, optTtl) {
  try {
    var str = JSON.stringify(data);
    if (str && str.length < 100000) {
      CacheService.getScriptCache().put(key, str, optTtl || 1800);
    }
  } catch (e) {
    Logger.log('Cache write error (' + key + '): ' + e);
  }
}

/**
 * Large Cache Handler (Chunking up to 500KB+ across 90KB parts)
 */
function putLargeScriptCacheJson(key, data, optTtl) {
  try {
    var str = JSON.stringify(data);
    var ttl = optTtl || 1800;
    var cache = CacheService.getScriptCache();
    var CHUNK_SIZE = 90000;
    if (str.length < CHUNK_SIZE) {
      cache.put(key, str, ttl);
      cache.remove(key + '_chunks');
    } else {
      var numChunks = Math.ceil(str.length / CHUNK_SIZE);
      var chunkMap = {};
      chunkMap[key + '_chunks'] = String(numChunks);
      for (var c = 0; c < numChunks; c++) {
        chunkMap[key + '_' + c] = str.substr(c * CHUNK_SIZE, CHUNK_SIZE);
      }
      cache.putAll(chunkMap, ttl);
      cache.remove(key);
    }
  } catch (e) {
    Logger.log('putLargeScriptCacheJson error (' + key + '): ' + e);
  }
}

function getLargeScriptCacheJson(key) {
  try {
    var cache = CacheService.getScriptCache();
    var numChunksStr = cache.get(key + '_chunks');
    if (numChunksStr) {
      var numChunks = parseInt(numChunksStr, 10);
      var keys = [];
      for (var c = 0; c < numChunks; c++) {
        keys.push(key + '_' + c);
      }
      var map = cache.getAll(keys);
      var fullStr = '';
      for (var i = 0; i < numChunks; i++) {
        var part = map[key + '_' + i];
        if (!part) return null; // Missing chunk, cache miss
        fullStr += part;
      }
      return JSON.parse(fullStr);
    }
    var raw = cache.get(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    Logger.log('getLargeScriptCacheJson error (' + key + '): ' + e);
  }
  return null;
}

function ensureAllMasterSheetsSeeded() {
  // 1. Fast Check via ScriptProperties (<0.5ms)
  try {
    var seededProp = PropertiesService.getScriptProperties().getProperty('sas_db_seeded');
    if (seededProp === '1') return;
  } catch (eProp) {}

  // 2. Fallback check via ScriptCache
  try {
    var isSeeded = getScriptCacheJson('sas_seeded_flag');
    if (isSeeded === true) return;
  } catch (e) {}

  try {
    var cls = readTable(SHEET_NAMES.CLASSES);
    if (!cls || cls.length === 0) seedDefaultClasses();
  } catch (e1) {
    Logger.log('ensureAllMasterSheetsSeeded classes error: ' + e1.message);
  }

  try {
    var st = readTable(SHEET_NAMES.STUDENTS);
    if (!st || st.length === 0) seedDefaultStudents();
  } catch (e2) {
    Logger.log('ensureAllMasterSheetsSeeded students error: ' + e2.message);
  }

  try {
    var tch = readTable(SHEET_NAMES.TEACHERS);
    if (!tch || tch.length === 0) seedDefaultTeachers();
  } catch (e3) {
    Logger.log('ensureAllMasterSheetsSeeded teachers error: ' + e3.message);
  }

  try {
    var mp = readTable(SHEET_NAMES.MAPEL);
    // Auto-repair if Mapel has shifted columns (empty aktif cell with 1 in created_at)
    if (mp && mp.length > 0 && (mp[0].aktif === 0 || mp[0].aktif === '') && (mp[0].created_at === 1 || mp[0].created_at === '1')) {
      seedDefaultMapel();
      delete _requestTableCache[SHEET_NAMES.MAPEL];
      mp = readTable(SHEET_NAMES.MAPEL);
    }
    if (!mp || mp.length === 0) seedDefaultMapel();
  } catch (e4) {
    Logger.log('ensureAllMasterSheetsSeeded mapel error: ' + e4.message);
  }

  try {
    var tpl = readTable(SHEET_NAMES.TEMPLATES);
    if (!tpl || tpl.length === 0) seedDefaultTemplate();
  } catch (e5) {
    Logger.log('ensureAllMasterSheetsSeeded templates error: ' + e5.message);
  }

  try {
    var usr = readTable(SHEET_NAMES.USERS);
    if (!usr || usr.length === 0) seedDefaultUsers();
  } catch (e6) {
    Logger.log('ensureAllMasterSheetsSeeded users error: ' + e6.message);
  }

  try {
    PropertiesService.getScriptProperties().setProperty('sas_db_seeded', '1');
    putScriptCacheJson('sas_seeded_flag', true, 21600);
  } catch (e7) {}
}

function doGet(e) {
  try {
    var page = (e && e.parameter && e.parameter.page) || 'index';
    _activePage = page;
    _activeParams = e && e.parameter ? e.parameter : {};

    // Auto-ensure all master tables exist and have data
    ensureAllMasterSheetsSeeded();

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
      // Backward Compatibility & Full Aliases
      'admin-arsip': 'AdminArsipAbsensi',
      'admin-kelas': 'AdminKelas',
      'admin-siswa': 'AdminSiswa',
      'admin-guru': 'AdminGuru',
      'admin-mapel': 'AdminMapel',
      'admin-import': 'AdminImport',
      'admin-users': 'AdminUsers',
      'admin-profil': 'AdminProfil',
      'admin-pengaturan': 'AdminPengaturan',
      'admin-template': 'AdminTemplate',
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
    var customAppUrl = settings ? (settings.web_app_url || settings.app_url) : null;
    if (customAppUrl && customAppUrl.indexOf('/macros/s/') !== -1) {
      return customAppUrl;
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
  
  try {
    var ss = getSpreadsheet();
    template.spreadsheetUrl = ss ? ss.getUrl() : '';
    template.spreadsheetName = ss ? ss.getName() : 'Database SAS';
    var pSheet = ss ? ss.getSheetByName(SHEET_NAMES.SETTINGS) : null;
    template.settingsSheetUrl = template.spreadsheetUrl + (pSheet ? ('#gid=' + pSheet.getSheetId()) : '');
  } catch (eSs) {
    template.spreadsheetUrl = '';
    template.spreadsheetName = 'Database SAS';
    template.settingsSheetUrl = '';
  }
  
  // Attach initial data directly to template for instant client-side rendering
  try {
    if (filename === 'AdminPengaturan') {
      // AdminPengaturan requires 100% fresh settings directly from the sheet
      invalidateCaches();
      template.settings = getSettingsMap();
      template.schoolSettings = template.settings;
      template.serverData = { success: true, settings: template.settings };
    } else {
      template.serverData = apiGetInitialData();
    }
  } catch (e) {
    template.serverData = null;
  }

  return template.evaluate()
    .setTitle('Generator Absensi & Berita Acara - ' + ((template.settings && template.settings.nama_sekolah) ? template.settings.nama_sekolah : 'SMK NEGERI FYJ Channel'))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * In-Memory Request Cache & Database Helpers
 */
var _cachedSpreadsheet = null;
var _cachedSheetsMap = {};
var _requestTableCache = {};
var _cachedSettingsMap = null;

function getSpreadsheet() {
  if (!_cachedSpreadsheet) {
    if (TARGET_SPREADSHEET_ID) {
      try {
        _cachedSpreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
      } catch (e) {
        _cachedSpreadsheet = null;
      }
    }
    if (!_cachedSpreadsheet) {
      try {
        _cachedSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      } catch (e) {
        _cachedSpreadsheet = null;
      }
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
    }
    if (!_cachedSpreadsheet) {
      try {
        _cachedSpreadsheet = SpreadsheetApp.create('Database SAS - SMK NEGERI FYJ CHANNEL');
        PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', _cachedSpreadsheet.getId());
      } catch (err) {
        throw new Error('Gagal mengakses Spreadsheet database ' + TARGET_SPREADSHEET_ID + ': ' + err.message);
      }
    }
  }
  return _cachedSpreadsheet;
}

function getSheet(sheetName) {
  if (_cachedSheetsMap[sheetName]) {
    return _cachedSheetsMap[sheetName];
  }
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    var aliases = {
      'Mapel': ['MataPelajaran', 'Mata Pelajaran', 'mapel'],
      'TemplateUjian': ['Template', 'Templates', 'Template Ujian'],
      'ActivityLogs': ['Logs', 'Log', 'ActivityLog'],
      'Kelas': ['Classes', 'DataKelas'],
      'Siswa': ['Students', 'DataSiswa'],
      'Guru': ['Teachers', 'DataGuru'],
      'Absensi': ['ArsipAbsensi', 'DaftarHadir'],
      'BeritaAcara': ['ArsipBeritaAcara']
    };
    if (aliases[sheetName]) {
      for (var a = 0; a < aliases[sheetName].length; a++) {
        sheet = ss.getSheetByName(aliases[sheetName][a]);
        if (sheet) break;
      }
    }
  }
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    ensureSheetHasInitialData(sheetName, sheet);
  }
  _cachedSheetsMap[sheetName] = sheet;
  return sheet;
}

function ensureSheetDimensions(sheet, requiredRows, requiredCols) {
  if (!sheet) return;
  try {
    var maxRows = sheet.getMaxRows();
    if (maxRows < requiredRows) {
      sheet.insertRowsAfter(maxRows, requiredRows - maxRows);
    }
  } catch (e) {
    Logger.log('ensureSheetDimensions rows error: ' + e);
  }
  try {
    var maxCols = sheet.getMaxColumns();
    if (maxCols < requiredCols) {
      sheet.insertColumnsAfter(maxCols, requiredCols - maxCols);
    }
  } catch (e) {
    Logger.log('ensureSheetDimensions cols error: ' + e);
  }
}

function invalidateCaches() {
  _requestTableCache = {};
  _cachedSettingsMap = null;
  _cachedSheetsMap = {};
  try {
    SpreadsheetApp.flush();
  } catch (e) {}
  try {
    var keys = [
      'sas_settings_map',
      'sas_seeded_flag',
      'sas_initial_data_bundle',
      'sas_initial_data_bundle_chunks',
      'sas_initial_data_bundle_0',
      'sas_initial_data_bundle_1',
      'sas_initial_data_bundle_2',
      'sas_initial_data_bundle_3',
      'sas_initial_data_bundle_4',
      'sas_tbl_' + SHEET_NAMES.SETTINGS,
      'sas_tbl_' + SHEET_NAMES.CLASSES,
      'sas_tbl_' + SHEET_NAMES.STUDENTS,
      'sas_tbl_' + SHEET_NAMES.TEACHERS,
      'sas_tbl_' + SHEET_NAMES.MAPEL,
      'sas_tbl_' + SHEET_NAMES.TEMPLATES,
      'sas_tbl_' + SHEET_NAMES.USERS,
      'sas_tbl_' + SHEET_NAMES.ABSENSI,
      'sas_tbl_' + SHEET_NAMES.BERITA_ACARA,
      'sas_tbl_' + SHEET_NAMES.LOGS
    ];
    CacheService.getScriptCache().removeAll(keys);
  } catch (e) {}
}

function apiClearCache() {
  invalidateCaches();
  return { success: true };
}

function getFieldWithSynonyms(obj, headerName) {
  if (!obj || typeof obj !== 'object') return undefined;
  var h = String(headerName).trim();
  if (obj[h] !== undefined) return obj[h];
  var lower = h.toLowerCase();

  if (lower === 'aktif' || lower === 'is_active') {
    if (obj.aktif !== undefined) return (obj.aktif === 1 || obj.aktif === '1' || obj.aktif === true || String(obj.aktif).toLowerCase() === 'aktif') ? 1 : 0;
    if (obj.is_active !== undefined) return (obj.is_active === 1 || obj.is_active === '1' || obj.is_active === true || String(obj.is_active).toLowerCase() === 'aktif') ? 1 : 0;
    if (obj.status !== undefined) return (obj.status === 1 || obj.status === '1' || obj.status === true || String(obj.status).toLowerCase() === 'aktif') ? 1 : 0;
  }
  if (lower === 'status') {
    if (obj.status !== undefined) return obj.status;
    if (obj.aktif !== undefined) return (obj.aktif === 1 || obj.aktif === '1' || obj.aktif === true || String(obj.aktif).toLowerCase() === 'aktif') ? 'Aktif' : 'Nonaktif';
    if (obj.is_active !== undefined) return (obj.is_active === 1 || obj.is_active === '1' || obj.is_active === true || String(obj.is_active).toLowerCase() === 'aktif') ? 'Aktif' : 'Nonaktif';
  }
  if (lower === 'nama' || lower === 'nama_lengkap') {
    if (obj.nama_lengkap !== undefined) return obj.nama_lengkap;
    if (obj.nama !== undefined) return obj.nama;
  }
  if (lower === 'nama_kelas' || lower === 'kelas') {
    if (obj.nama_kelas !== undefined) return obj.nama_kelas;
    if (obj.kelas !== undefined) return obj.kelas;
  }
  if (lower === 'nama_mapel' || lower === 'mapel') {
    if (obj.nama_mapel !== undefined) return obj.nama_mapel;
    if (obj.mapel !== undefined) return obj.mapel;
  }
  if (lower === 'program_keahlian' || lower === 'jurusan') {
    if (obj.program_keahlian !== undefined) return obj.program_keahlian;
    if (obj.jurusan !== undefined) return obj.jurusan;
  }
  return undefined;
}

/**
 * Generic Sheet Table Reader & Writer with Synonym Support
 */
function readTable(sheetName) {
  if (_requestTableCache[sheetName]) {
    return _requestTableCache[sheetName];
  }

  // Check distributed ScriptCache (sub-5ms retrieval)
  var cachedRows = getScriptCacheJson('sas_tbl_' + sheetName);
  if (cachedRows && Array.isArray(cachedRows)) {
    _requestTableCache[sheetName] = cachedRows;
    return cachedRows;
  }

  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    _requestTableCache[sheetName] = [];
    putScriptCacheJson('sas_tbl_' + sheetName, [], 1800);
    return [];
  }
  var range = sheet.getRange(1, 1, lastRow, lastCol);
  var values = range.getValues();
  var displayValues = range.getDisplayValues();
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var rowObj = { _row: i + 1 };
    var isEmpty = true;
    for (var j = 0; j < headers.length; j++) {
      var rawKey = String(headers[j]).trim();
      if (!rawKey) continue;
      var lowerKey = rawKey.toLowerCase();
      var val = values[i][j];
      var dispVal = displayValues[i][j];
      
      // JSON Serialization Safety: Convert Date/Time objects to formatted string
      if (val instanceof Date) {
        // If it's a Time cell in Sheets (year <= 1900) or if column is a time field (jam_mulai, jam_selesai, waktu)
        if (val.getFullYear() <= 1900 || lowerKey.indexOf('jam') !== -1 || lowerKey.indexOf('waktu') !== -1) {
          var timeStr = String(dispVal || '').trim();
          var timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            val = (timeMatch[1].length === 1 ? '0' + timeMatch[1] : timeMatch[1]) + ':' + timeMatch[2];
          } else {
            val = timeStr;
          }
        } else {
          var h = val.getHours();
          var mi = val.getMinutes();
          var s = val.getSeconds();
          if (h === 0 && mi === 0 && s === 0) {
            val = Utilities.formatDate(val, 'Asia/Makassar', 'yyyy-MM-dd');
          } else {
            val = Utilities.formatDate(val, 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
          }
        }
      } else if (typeof val === 'string' && (lowerKey.indexOf('jam') !== -1 || lowerKey.indexOf('waktu') !== -1)) {
        var timeMatch2 = val.trim().match(/^(\d{1,2}):(\d{2})/);
        if (timeMatch2) {
          val = (timeMatch2[1].length === 1 ? '0' + timeMatch2[1] : timeMatch2[1]) + ':' + timeMatch2[2];
        }
      } else if (val === null || val === undefined) {
        val = '';
      }

      if (val !== '') isEmpty = false;
      rowObj[rawKey] = val;
      if (rawKey !== lowerKey) {
        rowObj[lowerKey] = val;
      }
    }
    if (!isEmpty) {
      // Auto-correct Mapel if column E (aktif) is blank and column F contains 1
      if (sheetName === SHEET_NAMES.MAPEL && (rowObj.aktif === '' || rowObj.aktif === undefined) && (rowObj.created_at === 1 || rowObj.created_at === '1')) {
        rowObj.aktif = 1;
      }

      // Robust multi-synonym status normalization
      var rawStatus = (rowObj.aktif !== undefined && rowObj.aktif !== '') ? rowObj.aktif : 
                     ((rowObj.is_active !== undefined && rowObj.is_active !== '') ? rowObj.is_active : rowObj.status);
      var isAct = (rawStatus === 1 || rawStatus === '1' || rawStatus === true || String(rawStatus).toLowerCase() === 'aktif' || String(rawStatus).toLowerCase() === 'active');
      rowObj.aktif = isAct ? 1 : 0;
      rowObj.is_active = isAct ? 1 : 0;
      rowObj.status = isAct ? 'Aktif' : 'Nonaktif';

      // Name & Class synonyms
      if (rowObj.nama_siswa !== undefined && rowObj.nama === undefined) rowObj.nama = rowObj.nama_siswa;
      if (rowObj.nama !== undefined && rowObj.nama_siswa === undefined) rowObj.nama_siswa = rowObj.nama;
      if (rowObj.nama !== undefined && rowObj.nama_lengkap === undefined) rowObj.nama_lengkap = rowObj.nama;
      if (rowObj.nama_lengkap !== undefined && rowObj.nama === undefined) rowObj.nama = rowObj.nama_lengkap;
      if (rowObj.nama_kelas !== undefined && rowObj.kelas === undefined) rowObj.kelas = rowObj.nama_kelas;
      if (rowObj.kelas !== undefined && rowObj.nama_kelas === undefined) rowObj.nama_kelas = rowObj.kelas;
      if (rowObj.nama_mapel !== undefined && rowObj.mapel === undefined) rowObj.mapel = rowObj.nama_mapel;
      if (rowObj.mapel !== undefined && rowObj.nama_mapel === undefined) rowObj.nama_mapel = rowObj.mapel;
      if (rowObj.program_keahlian !== undefined && rowObj.jurusan === undefined) rowObj.jurusan = rowObj.program_keahlian;
      if (rowObj.jurusan !== undefined && rowObj.program_keahlian === undefined) rowObj.program_keahlian = rowObj.jurusan;

      rows.push(rowObj);
    }
  }
  _requestTableCache[sheetName] = rows;
  putScriptCacheJson('sas_tbl_' + sheetName, rows, 1800);
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


function insertRows(sheetName, objList) {
  if (!objList || objList.length === 0) return 0;
  var sheet = getSheet(sheetName);
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return 0;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var nextId = getNextId(sheetName);
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');

  var rowsData = [];
  for (var i = 0; i < objList.length; i++) {
    var obj = objList[i];
    if (!obj.id) {
      obj.id = nextId++;
    }
    if (!obj.created_at) obj.created_at = now;
    obj.updated_at = now;

    var row = [];
    for (var j = 0; j < headers.length; j++) {
      var h = String(headers[j]).trim();
      var val = getFieldWithSynonyms(obj, h);
      row.push(val !== undefined ? val : '');
    }
    rowsData.push(row);
  }

  var startRow = sheet.getLastRow() + 1;
  ensureSheetDimensions(sheet, startRow + rowsData.length + 5, headers.length + 2);
  sheet.getRange(startRow, 1, rowsData.length, headers.length).setValues(rowsData);
  invalidateCaches();
  return rowsData.length;
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
    var val = getFieldWithSynonyms(obj, h);
    rowData.push(val !== undefined ? val : '');
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
    var val = getFieldWithSynonyms(updates, h);
    if (val !== undefined) {
      sheet.getRange(rowIdx, j + 1).setValue(val);
    }
  }
  SpreadsheetApp.flush();
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

function seedDefaultClasses(optSheet) {
  var sheet = optSheet || getSheet(SHEET_NAMES.CLASSES);
  sheet.clear();
  var headers = ['id', 'nama_kelas', 'tingkat', 'program_keahlian', 'aktif', 'created_at', 'updated_at'];
  ensureSheetDimensions(sheet, 25, headers.length + 2);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  var classesData = [
    {"id":1,"nama_kelas":"XII TKJ","tingkat":"XII","program_keahlian":"Teknik Komputer dan Jaringan","is_active":1},
    {"id":2,"nama_kelas":"XII DKV","tingkat":"XII","program_keahlian":"Desain Komunikasi Visual","is_active":1},
    {"id":3,"nama_kelas":"XII LPKKK 1","tingkat":"XII","program_keahlian":"LPKKK","is_active":1},
    {"id":4,"nama_kelas":"XII LPKKK 2","tingkat":"XII","program_keahlian":"Layanan Penunjang Kefarmasian Klinis dan Komunitas","is_active":1},
    {"id":5,"nama_kelas":"XII BD 1","tingkat":"XII","program_keahlian":"BD","is_active":1},
    {"id":6,"nama_kelas":"XII BD 2","tingkat":"XII","program_keahlian":"Bisnis Digital","is_active":1},
    {"id":7,"nama_kelas":"XII MP 1","tingkat":"XII","program_keahlian":"Manajemen Perkantoran dan Layanan Bisnis","is_active":1},
    {"id":8,"nama_kelas":"XII MP 2","tingkat":"XII","program_keahlian":"Manajemen Perkantoran dan Layanan Bisnis","is_active":1},
    {"id":9,"nama_kelas":"XII LPB","tingkat":"XII","program_keahlian":"Layanan Perbankan","is_active":1},
    {"id":10,"nama_kelas":"XII AK","tingkat":"XII","program_keahlian":"Akuntansi dan Keuangan Lembaga","is_active":1},
    {"id":11,"nama_kelas":"XII TSM","tingkat":"XII","program_keahlian":"Teknik Sepeda Motor","is_active":1}
  ];
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  var rows = [];
  for (var c = 0; c < classesData.length; c++) {
    var cls = classesData[c];
    rows.push([cls.id, cls.nama_kelas, cls.tingkat || 'XII', cls.program_keahlian || '', 1, now, now]);
  }
  if (rows.length > 0) {
    ensureSheetDimensions(sheet, rows.length + 5, headers.length + 2);
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  invalidateCaches();
}

function seedDefaultStudents(optSheet) {
  var sheet = optSheet || getSheet(SHEET_NAMES.STUDENTS);
  sheet.clear();
  var headers = ['id', 'class_id', 'nama_kelas', 'nis', 'nisn', 'nama', 'program_keahlian', 'aktif', 'created_at', 'updated_at'];
  ensureSheetDimensions(sheet, 25, headers.length + 2);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  var classMap = {
    1: 'XII TKJ', 2: 'XII DKV', 3: 'XII LPKKK 1', 4: 'XII LPKKK 2',
    5: 'XII BD 1', 6: 'XII BD 2', 7: 'XII MP 1', 8: 'XII MP 2',
    9: 'XII LPB', 10: 'XII AK', 11: 'XII TSM'
  };
  var jurMap = {
    1: 'Teknik Komputer dan Jaringan', 2: 'Desain Komunikasi Visual',
    3: 'LPKKK', 4: 'Layanan Penunjang Kefarmasian Klinis dan Komunitas',
    5: 'BD', 6: 'Bisnis Digital',
    7: 'Manajemen Perkantoran dan Layanan Bisnis', 8: 'Manajemen Perkantoran dan Layanan Bisnis',
    9: 'Layanan Perbankan', 10: 'Akuntansi dan Keuangan Lembaga',
    11: 'Teknik Sepeda Motor'
  };

  var studentsData = [
    {"id":1,"class_id":1,"nis":"13561","nama":"Agustinus Poka Mete"},
    {"id":2,"class_id":1,"nis":"13562","nama":"Akbar Alfiansah"},
    {"id":3,"class_id":1,"nis":"13563","nama":"Dwi Retno Ayuningrum"},
    {"id":4,"class_id":1,"nis":"13565","nama":"I Gede Adtya Wedha Paramartha"},
    {"id":5,"class_id":1,"nis":"13566","nama":"I Gede Putra Sang Pajar"},
    {"id":6,"class_id":2,"nis":"13769","nama":"Anak Agung Gede Dika Pradipta"},
    {"id":7,"class_id":2,"nis":"13770","nama":"Gek Danaya Anindia"},
    {"id":8,"class_id":2,"nis":"13771","nama":"I Gede Ary Kesuma Suputra"},
    {"id":9,"class_id":2,"nis":"13772","nama":"I Gede Rian Primayoga"},
    {"id":10,"class_id":2,"nis":"13773","nama":"I Komang Raka Danaswara"}
  ];

  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  var rows = [];
  for (var s = 0; s < studentsData.length; s++) {
    var st = studentsData[s];
    var cName = st.nama_kelas || classMap[st.class_id] || '';
    var jur = st.program_keahlian || jurMap[st.class_id] || '';
    rows.push([st.id, st.class_id, cName, st.nis || '', st.nisn || '', st.nama || '', jur, 1, now, now]);
  }
  if (rows.length > 0) {
    ensureSheetDimensions(sheet, rows.length + 5, headers.length + 2);
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  invalidateCaches();
}

function seedDefaultTeachers(optSheet) {
  var sheet = optSheet || getSheet(SHEET_NAMES.TEACHERS);
  sheet.clear();
  var headers = ['id', 'nama', 'nip', 'jabatan', 'aktif', 'created_at', 'updated_at'];
  ensureSheetDimensions(sheet, 25, headers.length + 2);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  var teachersData = [
    {"id":1,"nama":"I Wayan Sukadana, S.Pd.","nip":"19820514 200801 1 012","mapel":"Teknik Jaringan Komputer","jabatan":"Guru Madya / Pengawas"},
    {"id":2,"nama":"Ni Made Rai Artini, S.Kom.","nip":"19870921 201101 2 008","mapel":"Desain Komunikasi Visual","jabatan":"Guru Muda / Pengawas"},
    {"id":3,"nama":"Drs. I Ketut Suardana, M.Pd.","nip":"19680315 199412 1 002","mapel":"Bahasa Indonesia","jabatan":"Guru Pembina / Pengawas"},
    {"id":4,"nama":"Ni Luh Putu Dewi Lestari, S.Pd.","nip":"19841120 200902 2 005","mapel":"Matematika","jabatan":"Guru Madya / Pengawas"},
    {"id":5,"nama":"I Made Agus Wira Pratama, S.T.","nip":"19890610 201503 1 004","mapel":"Teknik Sepeda Motor","jabatan":"Guru Muda / Pengawas"},
    {"id":6,"nama":"Ni Kadek Sri Wahyuni, S.Farm., Apt.","nip":"19910425 201903 2 011","mapel":"Layanan Penunjang Kefarmasian","jabatan":"Guru Pertama / Pengawas"},
    {"id":7,"nama":"I Gusti Ngurah Agung Putra, S.E.","nip":"19780814 200604 1 009","mapel":"Akuntansi dan Keuangan","jabatan":"Guru Madya / Pengawas"},
    {"id":8,"nama":"Ni Putu Eka Yuliani, S.Pd.","nip":"19860112 201001 2 018","mapel":"Manajemen Perkantoran","jabatan":"Guru Muda / Pengawas"},
    {"id":9,"nama":"I Komang Yudi Antara, S.Kom.","nip":"19920818 202012 1 007","mapel":"Bisnis Digital","jabatan":"Guru Pertama / Pengawas"},
    {"id":10,"nama":"Ida Bagus Made Ananda, S.Pd.","nip":"19800722 200501 1 006","mapel":"Bahasa Inggris","jabatan":"Guru Madya / Pengawas"}
  ];
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  var rows = [];
  for (var t = 0; t < teachersData.length; t++) {
    var tch = teachersData[t];
    rows.push([tch.id, tch.nama, tch.nip || '-', tch.jabatan || 'Guru / Pengawas', 1, now, now]);
  }
  if (rows.length > 0) {
    ensureSheetDimensions(sheet, rows.length + 5, headers.length + 2);
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  invalidateCaches();
}

function seedDefaultMapel(optSheet) {
  var sheet = optSheet || getSheet(SHEET_NAMES.MAPEL);
  sheet.clear();
  var headers = ['id', 'kode_mapel', 'nama_mapel', 'kelompok', 'aktif', 'created_at', 'updated_at'];
  ensureSheetDimensions(sheet, 25, headers.length + 2);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  var mapelsData = [
    {"id":1,"kode_mapel":"MP-001","nama_mapel":"Desain Komunikasi Visual","kelompok":"Kejuruan","aktif":1},
    {"id":2,"kode_mapel":"MP-002","nama_mapel":"Teknik Komputer dan Jaringan","kelompok":"Kejuruan","aktif":1},
    {"id":3,"kode_mapel":"MP-003","nama_mapel":"Teknik Sepeda Motor","kelompok":"Kejuruan","aktif":1},
    {"id":4,"kode_mapel":"MP-004","nama_mapel":"Layanan Penunjang Kefarmasian Klinis dan Komunitas","kelompok":"Kejuruan","aktif":1},
    {"id":5,"kode_mapel":"MP-005","nama_mapel":"Bisnis Digital","kelompok":"Kejuruan","aktif":1},
    {"id":6,"kode_mapel":"MP-006","nama_mapel":"Manajemen Perkantoran","kelompok":"Kejuruan","aktif":1},
    {"id":7,"kode_mapel":"MP-007","nama_mapel":"Akuntansi dan Keuangan Lembaga","kelompok":"Kejuruan","aktif":1},
    {"id":8,"kode_mapel":"MP-008","nama_mapel":"Matematika","kelompok":"Umum","aktif":1},
    {"id":9,"kode_mapel":"MP-009","nama_mapel":"Bahasa Indonesia","kelompok":"Umum","aktif":1},
    {"id":10,"kode_mapel":"MP-010","nama_mapel":"Bahasa Inggris","kelompok":"Umum","aktif":1}
  ];
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  var rows = [];
  for (var m = 0; m < mapelsData.length; m++) {
    var mp = mapelsData[m];
    rows.push([mp.id, mp.kode_mapel, mp.nama_mapel, mp.kelompok || 'Kejuruan', 1, now, now]);
  }
  if (rows.length > 0) {
    ensureSheetDimensions(sheet, rows.length + 5, headers.length + 2);
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  invalidateCaches();
}

function seedDefaultTemplate(optSheet) {
  var sheet = optSheet || getSheet(SHEET_NAMES.TEMPLATES);
  sheet.clear();
  var headers = ['id', 'nama_ujian', 'tahun_ajaran', 'judul_berita_acara', 'redaksi_isi', 'redaksi_pembuka', 'redaksi_poin_1', 'redaksi_poin_2', 'label_catatan', 'aktif', 'created_at', 'updated_at'];
  ensureSheetDimensions(sheet, 10, headers.length + 2);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  var defaultTpl = {
    id: 1,
    nama_ujian: 'Sumatif Akhir Semester (SAS) Ganjil',
    tahun_ajaran: '2026/2027',
    judul_berita_acara: 'BERITA ACARA \r\nPENYELENGGARAAN SUMATIF AKHIR SEMESTER (SAS) GANJIL\r\nTAHUN AJARAN [tahun_ajaran]',
    redaksi_isi: '<p>Pada hari ini&nbsp;<strong>[hari]</strong>, tanggal&nbsp;<strong>[tanggal]</strong> bulan&nbsp;<strong>[bulan]</strong>&nbsp;tahun&nbsp;<strong>[tahun]</strong>:</p><ol style="margin-top: 6px; margin-bottom: 12px;"><li style="margin-bottom: 8px;">Telah diselenggarakan&nbsp;<strong>[nama_ujian]</strong>&nbsp;Tahun Ajaran&nbsp;<strong>[tahun_ajaran]</strong>&nbsp;dari pukul&nbsp;<strong>[jam_mulai]</strong>&nbsp;sampai dengan pukul&nbsp;<strong>[jam_selesai]</strong>&nbsp;WITA.<ul style="margin-bottom: 6px; margin-left: 20px; list-style-type: disc;"><li>Pada Sekolah:&nbsp;<strong>[sekolah]</strong></li><li>Kelas:&nbsp;<strong>[kelas]</strong></li><li>Mata Pelajaran:&nbsp;<strong>[mata_pelajaran]</strong></li><li>Ruang:&nbsp;<strong>[ruang]</strong></li><li>Jumlah Peserta Seharusnya:&nbsp;<strong>[peserta_seharusnya]</strong>&nbsp;orang</li><li>Jumlah Peserta yang Tidak Hadir:&nbsp;<strong>[peserta_tidak_hadir]</strong>&nbsp;orang</li><li>Jumlah Peserta yang Hadir:&nbsp;<strong>[peserta_hadir]</strong>&nbsp;orang</li></ul></li><li style="margin-bottom: 8px;">Telah mengisi&nbsp;lembar blangko berita acara sebanyak&nbsp;<strong>[blangko_berita_acara]</strong>&nbsp;eksemplar dan blangko daftar hadir sebanyak&nbsp;<strong>[blangko_daftar_hadir]</strong>&nbsp;eksemplar, untuk Mata Pelajaran&nbsp;<strong>[mata_pelajaran]</strong>&nbsp;di ruang&nbsp;<strong>[ruang]</strong>&nbsp;dan kelas&nbsp;<strong>[kelas]</strong>&nbsp;dengan disaksikan oleh para peserta.</li><li style="margin-bottom: 8px;">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):<br><em>[catatan_pelaksanaan]</em></li></ol><p style="margin-top: 15px;">Demikian Berita Acara ini dibuat dengan sesungguhnya.</p>',
    redaksi_pembuka: 'Pada hari ini [hari], tanggal [tanggal] bulan [bulan] tahun [tahun].',
    redaksi_poin_1: 'Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran].',
    redaksi_poin_2: 'Telah mengisi blangko berita acara dan daftar hadir.',
    label_catatan: 'Catatan selama pelaksanaan ujian:',
    aktif: 1
  };
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  var row = [defaultTpl.id, defaultTpl.nama_ujian, defaultTpl.tahun_ajaran, defaultTpl.judul_berita_acara, defaultTpl.redaksi_isi, defaultTpl.redaksi_pembuka, defaultTpl.redaksi_poin_1, defaultTpl.redaksi_poin_2, defaultTpl.label_catatan, 1, now, now];
  ensureSheetDimensions(sheet, 5, headers.length + 2);
  sheet.getRange(2, 1, 1, headers.length).setValues([row]);
  invalidateCaches();
}

function seedDefaultUsers(optSheet) {
  var sheet = optSheet || getSheet(SHEET_NAMES.USERS);
  sheet.clear();
  var headers = ['id', 'username', 'password', 'password_plain', 'nama_lengkap', 'role', 'foto', 'created_at', 'updated_at'];
  ensureSheetDimensions(sheet, 10, headers.length + 2);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
  var rows = [
    [1, 'admin', 'admin123', 'admin123', 'Administrator SAS SMK', 'admin', '', now, now],
    [2, 'operator', 'operator123', 'operator123', 'Operator SAS SMK', 'operator', '', now, now]
  ];
  ensureSheetDimensions(sheet, rows.length + 5, headers.length + 2);
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  invalidateCaches();
}

function ensureSheetHasInitialData(sheetName, sheet) {
  try {
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var val = sheet.getRange(2, 1).getValue();
      if (val !== '' && val !== null && val !== undefined) return; // Sudah memiliki data valid
    }

    if (sheetName === SHEET_NAMES.SETTINGS) {
      seedDefaultSettings(sheet);
    } else if (sheetName === SHEET_NAMES.CLASSES) {
      seedDefaultClasses(sheet);
    } else if (sheetName === SHEET_NAMES.STUDENTS) {
      seedDefaultStudents(sheet);
    } else if (sheetName === SHEET_NAMES.TEACHERS) {
      seedDefaultTeachers(sheet);
    } else if (sheetName === SHEET_NAMES.MAPEL) {
      seedDefaultMapel(sheet);
    } else if (sheetName === SHEET_NAMES.TEMPLATES) {
      seedDefaultTemplate(sheet);
    } else if (sheetName === SHEET_NAMES.USERS) {
      seedDefaultUsers(sheet);
    } else if (sheetName === SHEET_NAMES.ABSENSI) {
      var absHeaders = ['id', 'nama_ujian', 'tahun_ajaran', 'semester', 'class_id', 'nama_kelas', 'tingkat', 'mata_pelajaran', 'sesi', 'ruang', 'tanggal_ujian', 'jam_mulai', 'jam_selesai', 'peserta_hadir', 'peserta_dispensasi', 'peserta_izin', 'peserta_sakit', 'peserta_tidak_hadir', 'total_peserta', 'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2', 'signature_mode', 'ttd_pengawas_1', 'ttd_pengawas_2', 'data_siswa', 'created_at', 'updated_at'];
      sheet.clear();
      sheet.getRange(1, 1, 1, absHeaders.length).setValues([absHeaders]);
      sheet.getRange(1, 1, 1, absHeaders.length).setFontWeight('bold');
    } else if (sheetName === SHEET_NAMES.BERITA_ACARA) {
      var baHeaders = ['id', 'template_id', 'nama_ujian', 'tahun_ajaran', 'semester', 'class_id', 'nama_kelas', 'tingkat', 'mata_pelajaran', 'tanggal_ujian', 'jam_mulai', 'jam_selesai', 'ruang', 'peserta_seharusnya', 'peserta_hadir', 'peserta_tidak_hadir', 'blangko_berita_acara', 'blangko_daftar_hadir', 'catatan_pelaksanaan', 'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2', 'signature_mode', 'ttd_pengawas_1', 'ttd_pengawas_2', 'foto_dokumentasi', 'created_at', 'updated_at'];
      sheet.clear();
      sheet.getRange(1, 1, 1, baHeaders.length).setValues([baHeaders]);
      sheet.getRange(1, 1, 1, baHeaders.length).setFontWeight('bold');
    } else if (sheetName === SHEET_NAMES.LOGS) {
      var logHeaders = ['id', 'waktu', 'aktivitas', 'keterangan', 'ip_address'];
      sheet.clear();
      sheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);
      sheet.getRange(1, 1, 1, logHeaders.length).setFontWeight('bold');
      var now = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(2, 1, 1, logHeaders.length).setValues([[1, now, 'SYSTEM_INIT', 'Inisialisasi basis data SAS berhasil', 'System']]);
    }
  } catch(e) {
    Logger.log('Error ensureSheetHasInitialData: ' + e);
  }
}


/**
 * Settings Table Helper & Drive URL Utility
 */
var PROTECTED_DEFAULT_ASSET_IDS = [
  '1QXtnYwIrCc-pihDUoidjkRW5UVWykOn-', // Default sample banner kop
  '1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI'  // Default sample school logo
];

function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  url = url.trim();
  if (url.indexOf('/folders/') !== -1) return null;
  var match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  var matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1] && (url.indexOf('drive.google.com') !== -1 || url.indexOf('docs.google.com') !== -1)) {
    return matchId[1];
  }
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(url)) {
    return url;
  }
  return null;
}

function safelyDeleteOldDriveAsset(oldUrlOrId, newFileId) {
  try {
    var oldId = extractDriveFileId(oldUrlOrId);
    if (!oldId) return;
    if (newFileId && oldId === newFileId) return;
    if (PROTECTED_DEFAULT_ASSET_IDS.indexOf(oldId) !== -1) return;

    var file = DriveApp.getFileById(oldId);
    if (file) {
      file.setTrashed(true);
      Logger.log('Old Drive asset successfully trashed: ' + oldId);
    }
  } catch (e) {
    Logger.log('Notice: safelyDeleteOldDriveAsset unable to trash ' + oldUrlOrId + ': ' + e.message);
  }
}

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

function getDefaultSettingsRows() {
  return [
    // 1. Kop Surat Dokumen Resmi A4
    ['kop_mode', 'image'],
    ['kop_header', 'https://drive.google.com/thumbnail?id=1QXtnYwIrCc-pihDUoidjkRW5UVWykOn-&sz=w1600'],
    ['kop_baris_1', 'PEMERINTAH PROVINSI FYJ'],
    ['kop_baris_2', 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA'],
    ['kop_baris_3', 'SMK NEGERI FYJ CHANNEL'],
    ['kop_telepon', 'Telp. (0300) 2002 | Email: smkn@yahoo.com'],
    ['kop_website', 'Website: smkn.sch.id'],

    // 2. Logo Sekolah
    ['school_logo', 'https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI&sz=w1600'],

    // 3. Identitas Sekolah & Penyimpanan Google Drive
    ['nama_sekolah', 'SMK NEGERI FYJ CHANNEL'],
    ['alamat_sekolah', 'Jl. Merpati No. 1'],
    ['google_drive_folder_url', 'https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR'],

    // 4. Master Tahun Ajaran & Semester
    ['tahun_ajaran_aktif', '2026/2027'],
    ['semester_aktif', 'Ganjil'],
    ['daftar_tahun_ajaran', JSON.stringify(['2026/2027', '2027/2028'])],

    // 5. Pejabat Penandatangan Dokumen Resmi
    ['kepala_sekolah', 'Drs. I Ketut Suardana, M.Pd.'],
    ['nip_kepala_sekolah', '19680315 199412 1 002'],
    ['tempat_cetak', 'Denpasar'],
    ['format_tanggal_cetak', 'd MMMM yyyy']
  ];
}

function bersihkanDuplikatPengaturan() {
  try {
    var sheet = getSheet(SHEET_NAMES.SETTINGS);
    var rows = readTable(SHEET_NAMES.SETTINGS);
    var map = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var k = String(r.setting_key || r.key || r.kunci || '').trim();
      if (!k) continue;
      var v = (r.setting_value !== undefined) ? r.setting_value : ((r.value !== undefined) ? r.value : r.nilai);
      if (v === undefined || v === null) v = '';
      map[k] = v;
    }

    var canonicalRows = [
      ['kop_mode', map.kop_mode || 'image'],
      ['kop_header', convertDriveUrlToThumbnail(map.kop_header || map.kop_image_path || 'https://drive.google.com/thumbnail?id=1QXtnYwIrCc-pihDUoidjkRW5UVWykOn-&sz=w1600')],
      ['kop_baris_1', map.kop_baris_1 || 'PEMERINTAH PROVINSI FYJ'],
      ['kop_baris_2', map.kop_baris_2 || 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA'],
      ['kop_baris_3', map.kop_baris_3 || 'SMK NEGERI FYJ CHANNEL'],
      ['kop_telepon', map.kop_telepon || 'Telp. (0300) 2002 | Email: smkn@yahoo.com'],
      ['kop_website', map.kop_website || 'Website: smkn.sch.id'],
      ['school_logo', convertDriveUrlToThumbnail(map.school_logo || map.logo_path || 'https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI&sz=w1600')],
      ['nama_sekolah', map.nama_sekolah || map.school_name || 'SMK NEGERI FYJ CHANNEL'],
      ['alamat_sekolah', map.alamat_sekolah || 'Jl. Merpati No. 1'],
      ['google_drive_folder_url', map.google_drive_folder_url || map.drive_folder_url || 'https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR'],
      ['tahun_ajaran_aktif', map.tahun_ajaran_aktif || map.academic_year || '2026/2027'],
      ['semester_aktif', map.semester_aktif || map.default_semester || 'Ganjil'],
      ['daftar_tahun_ajaran', typeof map.daftar_tahun_ajaran === 'string' ? map.daftar_tahun_ajaran : JSON.stringify(map.daftar_tahun_ajaran || ['2026/2027', '2027/2028'])],
      ['kepala_sekolah', map.kepala_sekolah || 'Drs. I Ketut Suardana, M.Pd.'],
      ['nip_kepala_sekolah', map.nip_kepala_sekolah || '19680315 199412 1 002'],
      ['tempat_cetak', map.tempat_cetak || 'Denpasar'],
      ['format_tanggal_cetak', map.format_tanggal_cetak || 'd MMMM yyyy']
    ];

    sheet.clear();
    sheet.appendRow(['setting_key', 'setting_value']);
    ensureSheetDimensions(sheet, canonicalRows.length + 5, 5);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 2).setBackground('#f1f5f9');
    sheet.getRange(2, 1, canonicalRows.length, 2).setValues(canonicalRows);
    sheet.setColumnWidth(1, 220);
    sheet.setColumnWidth(2, 600);
    invalidateCaches();
    return { success: true, count: canonicalRows.length };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function seedDefaultSettings(optSheet) {
  var sheet = optSheet || getSheet(SHEET_NAMES.SETTINGS);
  sheet.clear();
  sheet.appendRow(['setting_key', 'setting_value']);
  var rows = getDefaultSettingsRows();
  if (rows && rows.length > 0) {
    ensureSheetDimensions(sheet, rows.length + 5, 5);
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  try {
    sheet.getRange(1, 1, 1, 2).setBackground('#f1f5f9');
    sheet.setColumnWidth(1, 220);
    sheet.setColumnWidth(2, 600);
  } catch (e) {}
  invalidateCaches();
  return rows;
}

function isiOtomatisPengaturan() {
  var res = bersihkanDuplikatPengaturan();
  invalidateCaches();
  return 'Berhasil merapikan dan mengisi data Pengaturan ke Google Sheets! Jumlah: ' + (res.count || 18);
}

function apiResetDefaultPengaturan() {
  try {
    var res = bersihkanDuplikatPengaturan();
    invalidateCaches();
    return {
      success: true,
      message: 'Sheet Pengaturan berhasil dirapikan dan diisi dengan data resmi SMK NEGERI FYJ CHANNEL (tanpa duplikat)!'
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function apiGetFreshSettings() {
  invalidateCaches();
  var settings = getSettingsMap();
  return {
    success: true,
    settings: settings
  };
}

function getSettingsMap() {
  if (_cachedSettingsMap) return _cachedSettingsMap;

  // 1. Check high-speed ScriptCache (<5ms)
  var cached = getScriptCacheJson('sas_settings_map');
  if (cached && typeof cached === 'object' && cached.nama_sekolah) {
    _cachedSettingsMap = cached;
    return cached;
  }

  try {
    var sheet = getSheet(SHEET_NAMES.SETTINGS);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    // Auto-seed sheet Pengaturan jika kosong atau belum ada baris data
    if (lastRow < 2 || lastCol < 2) {
      seedDefaultSettings(sheet);
      if (_requestTableCache[SHEET_NAMES.SETTINGS]) {
        delete _requestTableCache[SHEET_NAMES.SETTINGS];
      }
    }

    var rows = readTable(SHEET_NAMES.SETTINGS);
    if (!rows || rows.length === 0) {
      seedDefaultSettings(sheet);
      if (_requestTableCache[SHEET_NAMES.SETTINGS]) {
        delete _requestTableCache[SHEET_NAMES.SETTINGS];
      }
      rows = readTable(SHEET_NAMES.SETTINGS);
    }

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

    // Otomatis rapikan jika ada baris duplikat alias di sheet
    if (map.kop_image_path !== undefined || map.logo_path !== undefined || map.school_name !== undefined || map.drive_folder_url !== undefined || map.academic_year !== undefined || map.default_semester !== undefined) {
      bersihkanDuplikatPengaturan();
      delete _requestTableCache[SHEET_NAMES.SETTINGS];
      rows = readTable(SHEET_NAMES.SETTINGS);
      map = {};
      for (var d = 0; d < rows.length; d++) {
        var dr = rows[d];
        var dk = String(dr.setting_key || dr.key || dr.kunci || '').trim();
        if (!dk) continue;
        var dv = (dr.setting_value !== undefined) ? dr.setting_value : ((dr.value !== undefined) ? dr.value : dr.nilai);
        if (dv === undefined || dv === null) dv = '';
        map[dk] = dv;
      }
    }

    // Map synonyms/aliases between English & Indonesian
    if (!map.nama_sekolah && map.school_name) map.nama_sekolah = map.school_name;
    if (!map.school_name && map.nama_sekolah) map.school_name = map.nama_sekolah;
    if (!map.nama_sekolah) map.nama_sekolah = 'SMK NEGERI FYJ CHANNEL';

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
    if (!map.google_drive_folder_url) map.google_drive_folder_url = 'https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR';

    // Synchronize kop_header and kop_image_path synonyms & format Drive URL
    var kopImg = map.kop_header || map.kop_image_path || 'https://drive.google.com/thumbnail?id=1QXtnYwIrCc-pihDUoidjkRW5UVWykOn-&sz=w1600';
    kopImg = convertDriveUrlToThumbnail(kopImg);
    map.kop_header = kopImg;
    map.kop_image_path = kopImg;

    // Synchronize school_logo and logo_path synonyms & format Drive URL
    var logoImg = map.school_logo || map.logo_path || 'https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI&sz=w1600';
    logoImg = convertDriveUrlToThumbnail(logoImg);
    map.school_logo = logoImg;
    map.logo_path = logoImg;

    // Academic years parsing
    var defaultYears = ['2026/2027', '2027/2028'];
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

    if (!map.kepala_sekolah) map.kepala_sekolah = 'Drs. I Ketut Suardana, M.Pd.';
    if (!map.nip_kepala_sekolah) map.nip_kepala_sekolah = '19680315 199412 1 002';
    if (!map.tempat_cetak) map.tempat_cetak = 'Denpasar';
    if (!map.format_tanggal_cetak) map.format_tanggal_cetak = 'd MMMM yyyy';

    _cachedSettingsMap = map;
    putScriptCacheJson('sas_settings_map', map, 21600);
    return map;
  } catch (e) {
    return {
      nama_sekolah: 'SMK NEGERI FYJ CHANNEL',
      alamat_sekolah: 'Jl. Merpati No. 1',
      tahun_ajaran_aktif: '2026/2027',
      semester_aktif: 'Ganjil',
      daftar_tahun_ajaran: ['2026/2027', '2027/2028'],
      kop_mode: 'image',
      kop_header: 'https://drive.google.com/thumbnail?id=1QXtnYwIrCc-pihDUoidjkRW5UVWykOn-&sz=w1600',
      kop_image_path: 'https://drive.google.com/thumbnail?id=1QXtnYwIrCc-pihDUoidjkRW5UVWykOn-&sz=w1600',
      school_logo: 'https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI&sz=w1600',
      logo_path: 'https://drive.google.com/thumbnail?id=1GUfUommgYjV-cnhU0tTB8kRJy8iXagkI&sz=w1600',
      google_drive_folder_url: 'https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR',
      drive_folder_url: 'https://drive.google.com/drive/folders/19fGt2rXhNLL_N-vCLUXC_CmSiwi7UzGR',
      kop_baris_1: 'PEMERINTAH PROVINSI FYJ',
      kop_baris_2: 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA',
      kop_baris_3: 'SMK NEGERI FYJ CHANNEL',
      kop_telepon: 'Telp. (0300) 2002 | Email: smkn@yahoo.com',
      kop_website: 'Website: smkn.sch.id',
      kepala_sekolah: 'Drs. I Ketut Suardana, M.Pd.',
      nip_kepala_sekolah: '19680315 199412 1 002',
      tempat_cetak: 'Denpasar',
      format_tanggal_cetak: 'd MMMM yyyy'
    };
  }
}

/**
 * Single-Trip RPC: Load Entire Initial Master Data (<1s)
 */
function apiGetInitialData() {
  try {
    // 1. Check ScriptCache for the assembled bundle (<10ms)
    var cached = getLargeScriptCacheJson('sas_initial_data_bundle');
    if (cached && typeof cached === 'object' && cached.classes && cached.classes.length > 0) {
      return cached;
    }

    ensureAllMasterSheetsSeeded();

    var settings = getSettingsMap();
    var classes = [];
    var students = [];
    var teachers = [];
    var mapels = [];
    var templates = [];
    var users = [];
    var absensi = [];
    var beritaAcara = [];
    var logs = [];

    // 1. Classes
    try {
      classes = readTable(SHEET_NAMES.CLASSES);
      if (!classes || classes.length === 0) {
        seedDefaultClasses();
        delete _requestTableCache[SHEET_NAMES.CLASSES];
        classes = readTable(SHEET_NAMES.CLASSES);
      }
    } catch (e) { Logger.log('Error reading classes: ' + e); }

    // 2. Students
    try {
      students = readTable(SHEET_NAMES.STUDENTS);
      if (!students || students.length === 0) {
        seedDefaultStudents();
        delete _requestTableCache[SHEET_NAMES.STUDENTS];
        students = readTable(SHEET_NAMES.STUDENTS);
      }
    } catch (e) { Logger.log('Error reading students: ' + e); }

    // Auto-sync master classes from student data if students have classes
    try {
      var syncRes = syncClassesFromStudents();
      if (syncRes && syncRes.added > 0) {
        delete _requestTableCache[SHEET_NAMES.CLASSES];
        classes = readTable(SHEET_NAMES.CLASSES);
      }
    } catch (eSync) { Logger.log('Auto sync classes error: ' + eSync); }

    // 3. Teachers & Proctors
    try {
      teachers = readTable(SHEET_NAMES.TEACHERS);
      if (!teachers || teachers.length === 0) {
        seedDefaultTeachers();
        delete _requestTableCache[SHEET_NAMES.TEACHERS];
        teachers = readTable(SHEET_NAMES.TEACHERS);
      }
    } catch (e) { Logger.log('Error reading teachers: ' + e); }

    // 4. Subjects (Mapel)
    try {
      mapels = readTable(SHEET_NAMES.MAPEL);
      if (!mapels || mapels.length === 0) {
        seedDefaultMapel();
        delete _requestTableCache[SHEET_NAMES.MAPEL];
        mapels = readTable(SHEET_NAMES.MAPEL);
      }
    } catch (e) { Logger.log('Error reading mapels: ' + e); }

    // 5. Exam Templates
    try {
      templates = readTable(SHEET_NAMES.TEMPLATES);
      if (!templates || templates.length === 0) {
        seedDefaultTemplate();
        delete _requestTableCache[SHEET_NAMES.TEMPLATES];
        templates = readTable(SHEET_NAMES.TEMPLATES);
      }
      if (templates && templates.length > 0) {
        templates.forEach(function(t) {
          if (t.redaksi_isi) {
            t.redaksi_isi = String(t.redaksi_isi)
              .replace(/<p[^>]*>\s*Yang membuat berita acara\s*:\s*<\/p>/gi, '')
              .replace(/\s*\([^)]*\[tanggal_teks\][^)]*\)/gi, '')
              .replace(/\s*\([^)]*\[tahun_teks\][^)]*\)/gi, '')
              .replace(/&nbsp;\s*:/g, ':')
              .replace(/&nbsp;\s+bulan/g, ' bulan')
              .trim();
          }
        });
      }
    } catch (e) { Logger.log('Error reading templates: ' + e); }

    // 6. Users (Admin & Operator)
    try {
      users = readTable(SHEET_NAMES.USERS);
      if (!users || users.length === 0) {
        seedDefaultUsers();
        delete _requestTableCache[SHEET_NAMES.USERS];
        users = readTable(SHEET_NAMES.USERS);
      }
    } catch (e) { Logger.log('Error reading users: ' + e); }

    // 7. Absensi, Berita Acara, Logs
    try { absensi = readTable(SHEET_NAMES.ABSENSI); } catch (e) { Logger.log('Error reading absensi: ' + e); }
    try { beritaAcara = readTable(SHEET_NAMES.BERITA_ACARA); } catch (e) { Logger.log('Error reading beritaAcara: ' + e); }
    try { logs = readTable(SHEET_NAMES.LOGS); } catch (e) { Logger.log('Error reading logs: ' + e); }

    var sanitizedUsers = (users || []).map(function(u) {
      return {
        id: u.id,
        username: u.username,
        nama_lengkap: u.nama_lengkap || u.nama || '',
        role: u.role,
        password_plain: u.password_plain || u.password || '',
        foto: u.foto || null
      };
    });

    var safeStudents = (students || []).map(function(s) {
      return {
        id: s.id,
        class_id: s.class_id,
        nama_kelas: s.nama_kelas || '',
        nis: s.nis || '',
        nama: s.nama || '',
        jenis_kelamin: s.jenis_kelamin || 'L',
        no_peserta: s.no_peserta || '',
        ruang: s.ruang || '',
        aktif: (s.aktif !== undefined) ? s.aktif : 1
      };
    });

    // Strip heavy student data from list bundle while preserving signatures & headers
    var safeAbsensi = (absensi || []).map(function(a) {
      return {
        id: a.id,
        nama_ujian: a.nama_ujian || '',
        tahun_ajaran: a.tahun_ajaran || '',
        semester: a.semester || '',
        class_id: a.class_id || '',
        nama_kelas: a.nama_kelas || '',
        tingkat: a.tingkat || '',
        mata_pelajaran: a.mata_pelajaran || '',
        sesi: a.sesi || '1',
        ruang: a.ruang || '',
        tanggal_ujian: a.tanggal_ujian || '',
        jam_mulai: a.jam_mulai || '',
        jam_selesai: a.jam_selesai || '',
        peserta_hadir: a.peserta_hadir || 0,
        peserta_dispensasi: a.peserta_dispensasi || 0,
        peserta_izin: a.peserta_izin || 0,
        peserta_sakit: a.peserta_sakit || 0,
        peserta_tidak_hadir: a.peserta_tidak_hadir || 0,
        total_peserta: a.total_peserta || 0,
        nama_pengawas_1: a.nama_pengawas_1 || '',
        nip_pengawas_1: a.nip_pengawas_1 || '',
        nama_pengawas_2: a.nama_pengawas_2 || '',
        nip_pengawas_2: a.nip_pengawas_2 || '',
        signature_mode: a.signature_mode || 'digital',
        ttd_pengawas_1: a.ttd_pengawas_1 || '',
        ttd_pengawas_2: a.ttd_pengawas_2 || '',
        has_ttd_1: !!a.ttd_pengawas_1,
        has_ttd_2: !!a.ttd_pengawas_2,
        data_siswa: a.data_siswa || '',
        created_at: a.created_at || ''
      };
    });

    // Strip heavy photo base64 strings from general list bundle
    var safeBeritaAcara = (beritaAcara || []).map(function(b) {
      return {
        id: b.id,
        template_id: b.template_id || '',
        nama_ujian: b.nama_ujian || '',
        tahun_ajaran: b.tahun_ajaran || '',
        semester: b.semester || '',
        class_id: b.class_id || '',
        nama_kelas: b.nama_kelas || '',
        tingkat: b.tingkat || '',
        mata_pelajaran: b.mata_pelajaran || '',
        tanggal_ujian: b.tanggal_ujian || '',
        jam_mulai: b.jam_mulai || '',
        jam_selesai: b.jam_selesai || '',
        ruang: b.ruang || '',
        peserta_seharusnya: b.peserta_seharusnya || 0,
        peserta_hadir: b.peserta_hadir || 0,
        peserta_tidak_hadir: b.peserta_tidak_hadir || 0,
        blangko_berita_acara: b.blangko_berita_acara || 1,
        blangko_daftar_hadir: b.blangko_daftar_hadir || 1,
        catatan_pelaksanaan: b.catatan_pelaksanaan || '',
        nama_pengawas_1: b.nama_pengawas_1 || '',
        nip_pengawas_1: b.nip_pengawas_1 || '',
        nama_pengawas_2: b.nama_pengawas_2 || '',
        nip_pengawas_2: b.nip_pengawas_2 || '',
        signature_mode: b.signature_mode || 'digital',
        ttd_pengawas_1: b.ttd_pengawas_1 || '',
        ttd_pengawas_2: b.ttd_pengawas_2 || '',
        has_photos: !!(b.foto_dokumentasi && b.foto_dokumentasi !== '[]'),
        created_at: b.created_at || ''
      };
    });

    var safeLogs = (Array.isArray(logs) ? logs : []).slice(-20);

    var result = {
      success: true,
      settings: settings,
      classes: classes || [],
      students: safeStudents,
      teachers: teachers || [],
      mapels: mapels || [],
      templates: templates || [],
      users: sanitizedUsers || [],
      absensi: safeAbsensi,
      berita_acara: safeBeritaAcara,
      logs: safeLogs,
      stats: {
        classesCount: (classes || []).length,
        studentsCount: (safeStudents || []).length,
        teachersCount: (teachers || []).length,
        mapelsCount: (mapels || []).length,
        usersCount: (sanitizedUsers || []).length
      }
    };

    putLargeScriptCacheJson('sas_initial_data_bundle', result, 1800);
    return result;
  } catch (err) {
    Logger.log('Critical error in apiGetInitialData: ' + err.message);
    return {
      success: false,
      error: err.message,
      settings: getSettingsMap(),
      classes: [],
      students: [],
      teachers: [],
      mapels: [],
      templates: [],
      users: [],
      absensi: [],
      berita_acara: [],
      logs: []
    };
  }
}

/**
 * Fast Dedicated Document Detail RPC (Loads full document + photos/signatures on-demand)
 */
function apiGetDocumentDetail(type, id) {
  try {
    var tbl = (type === 'absensi') ? SHEET_NAMES.ABSENSI : SHEET_NAMES.BERITA_ACARA;
    var rows = readTable(tbl);
    var found = null;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].id) === String(id)) {
        found = rows[i];
        break;
      }
    }
    return {
      success: true,
      type: type,
      id: id,
      document: found,
      settings: getSettingsMap(),
      templates: readTable(SHEET_NAMES.TEMPLATES)
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
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

function apiClearActivityLogs() {
  try {
    var sheet = getSheet(SHEET_NAMES.LOGS);
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    delete _requestTableCache[SHEET_NAMES.LOGS];
    logActivity('CLEAR_LOGS', 'Membersihkan seluruh catatan log aktivitas sistem');
    return { success: true, message: 'Seluruh catatan aktivitas sistem berhasil dibersihkan.' };
  } catch (e) {
    return { success: false, message: 'Gagal membersihkan log: ' + e.message };
  }
}

function apiDeleteActivityLog(id) {
  try {
    deleteRowById(SHEET_NAMES.LOGS, id);
    delete _requestTableCache[SHEET_NAMES.LOGS];
    return { success: true, message: 'Catatan log berhasil dihapus.' };
  } catch (e) {
    return { success: false, message: 'Gagal menghapus log: ' + e.message };
  }
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
  try {
    syncClassesFromStudents();
  } catch (eSync) {
    Logger.log('syncClassesFromStudents in apiSaveSiswa error: ' + eSync.message);
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
  var count = insertRows(SHEET_NAMES.STUDENTS, students);
  logActivity('IMPORT_SISWA', 'Mengimpor ' + count + ' data siswa dari Excel');
  try {
    syncClassesFromStudents();
  } catch (eSync) {
    Logger.log('syncClassesFromStudents in apiImportSiswa error: ' + eSync.message);
  }
  return { success: true, count: count };
}

/**
 * Sinkronisasi Master Data Kelas dari Data Siswa.
 * Jika siswa memiliki nama_kelas yang belum ada di master kelas, kelas baru akan ditambahkan otomatis.
 * Sekaligus merapikan class_id, tingkat, dan program_keahlian yang bersesuaian.
 */
function syncClassesFromStudents() {
  var classes = readTable(SHEET_NAMES.CLASSES) || [];
  var students = readTable(SHEET_NAMES.STUDENTS) || [];

  if (!students || students.length === 0) {
    return { success: true, added: 0, classes: classes };
  }

  // 1. Map existing classes by normalized uppercase name
  var classMap = {};
  var maxId = 0;
  for (var i = 0; i < classes.length; i++) {
    var c = classes[i];
    var cId = parseInt(c.id, 10);
    if (!isNaN(cId) && cId > maxId) maxId = cId;
    if (c.nama_kelas) {
      classMap[String(c.nama_kelas).trim().toUpperCase()] = c;
    }
  }

  // 2. Scan students to discover any new classes or adjustments
  var newClassesToAdd = [];
  var newClassMap = {};

  for (var s = 0; s < students.length; s++) {
    var st = students[s];
    var rawKelas = (st.nama_kelas || st.kelas || '').trim();
    if (!rawKelas) continue;
    var normKey = rawKelas.toUpperCase();

    if (!classMap[normKey] && !newClassMap[normKey]) {
      maxId++;
      // Determine tingkat: X, XI, XII
      var tingkat = 'XII';
      if (/^X[\s\.\-_]/i.test(rawKelas) || normKey === 'X') tingkat = 'X';
      else if (/^XI[\s\.\-_]/i.test(rawKelas) || normKey === 'XI') tingkat = 'XI';
      else if (/^XII[\s\.\-_]/i.test(rawKelas) || normKey === 'XII') tingkat = 'XII';

      // Determine program_keahlian
      var prog = (st.program_keahlian || st.jurusan || '').trim();
      if (!prog || prog === '-') {
        if (/TKJ/i.test(rawKelas)) prog = 'Teknik Komputer dan Jaringan';
        else if (/DKV/i.test(rawKelas)) prog = 'Desain Komunikasi Visual';
        else if (/TSM/i.test(rawKelas)) prog = 'Teknik Sepeda Motor';
        else if (/LPKKK/i.test(rawKelas)) prog = 'Layanan Penunjang Kefarmasian Klinis dan Komunitas';
        else if (/BD/i.test(rawKelas)) prog = 'Bisnis Digital';
        else if (/MP/i.test(rawKelas)) prog = 'Manajemen Perkantoran dan Layanan Bisnis';
        else if (/LPB/i.test(rawKelas)) prog = 'Layanan Perbankan';
        else if (/AK/i.test(rawKelas)) prog = 'Akuntansi dan Keuangan Lembaga';
        else if (/RPL/i.test(rawKelas)) prog = 'Rekayasa Perangkat Lunak';
        else prog = '-';
      }

      var newCls = {
        id: maxId,
        nama_kelas: rawKelas,
        tingkat: tingkat,
        program_keahlian: prog,
        aktif: 1
      };
      newClassesToAdd.push(newCls);
      newClassMap[normKey] = newCls;
      classMap[normKey] = newCls;
    }
  }

  // 3. If there are new classes to add, insert into SHEET_NAMES.CLASSES
  if (newClassesToAdd.length > 0) {
    insertRows(SHEET_NAMES.CLASSES, newClassesToAdd);
    delete _requestTableCache[SHEET_NAMES.CLASSES];
    classes = readTable(SHEET_NAMES.CLASSES);
    logActivity('SYNC_KELAS', 'Menambahkan otomatis ' + newClassesToAdd.length + ' kelas baru dari data siswa');
  }

  // 4. Update student class_id and nama_kelas to align with master classes
  var studentUpdatesNeeded = false;
  for (var s2 = 0; s2 < students.length; s2++) {
    var stud = students[s2];
    var sClassName = (stud.nama_kelas || stud.kelas || '').trim();
    if (sClassName) {
      var matchedCls = classMap[sClassName.toUpperCase()];
      if (matchedCls) {
        if (String(stud.class_id) !== String(matchedCls.id)) {
          stud.class_id = matchedCls.id;
          studentUpdatesNeeded = true;
        }
        if (!stud.nama_kelas || stud.nama_kelas !== matchedCls.nama_kelas) {
          stud.nama_kelas = matchedCls.nama_kelas;
          studentUpdatesNeeded = true;
        }
        if ((!stud.program_keahlian || stud.program_keahlian === '-') && matchedCls.program_keahlian && matchedCls.program_keahlian !== '-') {
          stud.program_keahlian = matchedCls.program_keahlian;
          studentUpdatesNeeded = true;
        }
      }
    }
  }

  if (studentUpdatesNeeded) {
    var studentSheet = getSheet(SHEET_NAMES.STUDENTS);
    var lastCol = studentSheet.getLastColumn();
    if (lastCol > 0 && students.length > 0) {
      var headers = studentSheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var nowStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
      var updatedData = [];
      for (var r = 0; r < students.length; r++) {
        var rowObj = students[r];
        rowObj.updated_at = nowStr;
        var rowArr = [];
        for (var cIdx = 0; cIdx < headers.length; cIdx++) {
          var hName = String(headers[cIdx]).trim();
          var v = getFieldWithSynonyms(rowObj, hName);
          rowArr.push(v !== undefined ? v : '');
        }
        updatedData.push(rowArr);
      }
      studentSheet.getRange(2, 1, updatedData.length, headers.length).setValues(updatedData);
      delete _requestTableCache[SHEET_NAMES.STUDENTS];
      invalidateCaches();
    }
  }

  return { success: true, added: newClassesToAdd.length, classes: classes };
}

function apiSyncClassesFromStudents() {
  try {
    var res = syncClassesFromStudents();
    return {
      success: true,
      added: res.added,
      classes: res.classes,
      message: res.added > 0 
        ? ('Berhasil menyinkronkan data. ' + res.added + ' kelas baru berhasil ditambahkan otomatis dari data siswa.')
        : 'Data kelas sudah sinkron dengan data siswa.'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
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
  var count = insertRows(SHEET_NAMES.TEACHERS, teachers);
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
  var count = insertRows(SHEET_NAMES.MAPEL, mapels);
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
    ensureSheetDimensions(sheet, 25, 5);
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

  var currentSettings = getSettingsMap();
  var prevKop = currentSettings.kop_header || currentSettings.kop_image_path || '';
  var prevLogo = currentSettings.school_logo || currentSettings.logo_path || '';

  // Auto-convert Google Drive URLs to direct thumbnail URLs
  var kopUrl = payload.kop_header !== undefined ? payload.kop_header : (payload.kop_image_path !== undefined ? payload.kop_image_path : prevKop);
  if (kopUrl) kopUrl = convertDriveUrlToThumbnail(kopUrl);

  var logoUrl = payload.school_logo !== undefined ? payload.school_logo : (payload.logo_path !== undefined ? payload.logo_path : prevLogo);
  if (logoUrl) logoUrl = convertDriveUrlToThumbnail(logoUrl);

  // If Kop or Logo changed to a new file or new direct link, safely trash the old Drive asset
  if ((payload.kop_header !== undefined || payload.kop_image_path !== undefined) && kopUrl !== prevKop && prevKop) {
    var newKopId = extractDriveFileId(kopUrl);
    safelyDeleteOldDriveAsset(prevKop, newKopId);
  }

  if ((payload.school_logo !== undefined || payload.logo_path !== undefined) && logoUrl !== prevLogo && prevLogo) {
    var newLogoId = extractDriveFileId(logoUrl);
    safelyDeleteOldDriveAsset(prevLogo, newLogoId);
  }

  var schoolName = payload.nama_sekolah || payload.school_name || currentSettings.nama_sekolah || currentSettings.school_name || 'SMK NEGERI FYJ CHANNEL';
  var driveFolderUrl = payload.google_drive_folder_url || payload.drive_folder_url || currentSettings.google_drive_folder_url || currentSettings.drive_folder_url || '';
  var tahunAktif = payload.tahun_ajaran_aktif || payload.academic_year || currentSettings.tahun_ajaran_aktif || currentSettings.academic_year || '2026/2027';
  var semAktif = payload.semester_aktif || payload.default_semester || currentSettings.semester_aktif || currentSettings.default_semester || 'Ganjil';
  var listTh = payload.daftar_tahun_ajaran !== undefined ? payload.daftar_tahun_ajaran : (currentSettings.daftar_tahun_ajaran || ['2026/2027', '2027/2028']);
  if (listTh && Array.isArray(listTh)) listTh = JSON.stringify(listTh);

  // Canonical keys only - NO DUPLICATES in spreadsheet!
  var cleanPayload = {
    'kop_mode': payload.kop_mode !== undefined ? payload.kop_mode : (currentSettings.kop_mode || 'image'),
    'kop_header': kopUrl,
    'kop_baris_1': payload.kop_baris_1 !== undefined ? payload.kop_baris_1 : (currentSettings.kop_baris_1 || 'PEMERINTAH PROVINSI FYJ'),
    'kop_baris_2': payload.kop_baris_2 !== undefined ? payload.kop_baris_2 : (currentSettings.kop_baris_2 || 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA'),
    'kop_baris_3': payload.kop_baris_3 !== undefined ? payload.kop_baris_3 : (currentSettings.kop_baris_3 || schoolName),
    'kop_telepon': payload.kop_telepon !== undefined ? payload.kop_telepon : (currentSettings.kop_telepon || ''),
    'kop_website': payload.kop_website !== undefined ? payload.kop_website : (currentSettings.kop_website || ''),
    'school_logo': logoUrl,
    'nama_sekolah': schoolName,
    'alamat_sekolah': payload.alamat_sekolah !== undefined ? payload.alamat_sekolah : (currentSettings.alamat_sekolah || ''),
    'google_drive_folder_url': driveFolderUrl,
    'tahun_ajaran_aktif': tahunAktif,
    'semester_aktif': semAktif,
    'daftar_tahun_ajaran': listTh || JSON.stringify(['2026/2027', '2027/2028']),
    'kepala_sekolah': payload.kepala_sekolah !== undefined ? payload.kepala_sekolah : (currentSettings.kepala_sekolah || 'Drs. I Ketut Suardana, M.Pd.'),
    'nip_kepala_sekolah': payload.nip_kepala_sekolah !== undefined ? payload.nip_kepala_sekolah : (currentSettings.nip_kepala_sekolah || '19680315 199412 1 002'),
    'tempat_cetak': payload.tempat_cetak !== undefined ? payload.tempat_cetak : (currentSettings.tempat_cetak || 'Denpasar'),
    'format_tanggal_cetak': payload.format_tanggal_cetak !== undefined ? payload.format_tanggal_cetak : (currentSettings.format_tanggal_cetak || 'd MMMM yyyy')
  };

  for (var key in cleanPayload) {
    var val = cleanPayload[key];
    if (existingMap[key]) {
      sheet.getRange(existingMap[key], 2).setValue(val);
    } else {
      sheet.appendRow([key, val]);
      existingMap[key] = sheet.getLastRow();
    }
  }

  // Remove any redundant alias rows that might still exist
  var redundantAliases = ['kop_image_path', 'logo_path', 'school_name', 'drive_folder_url', 'academic_year', 'default_semester'];
  var currentRows = readTable(SHEET_NAMES.SETTINGS);
  for (var i = currentRows.length - 1; i >= 0; i--) {
    var rowKey = String(currentRows[i][keyColName] || currentRows[i].setting_key || '').trim();
    if (redundantAliases.indexOf(rowKey) !== -1) {
      sheet.deleteRow(currentRows[i]._row);
    }
  }

  invalidateCaches();
  logActivity('UPDATE_SETTINGS', 'Memperbarui pengaturan sekolah resmi (format tunggal tanpa duplikasi)');
  return { success: true, settings: getSettingsMap() };
}

/**
 * Bulk Toggle Master Status (Kelas, Siswa, Guru, Mapel)
 */
function apiToggleAllMasterStatus(tableType, newStatus) {
  try {
    var sheetNameMap = {
      'kelas': SHEET_NAMES.CLASSES,
      'siswa': SHEET_NAMES.STUDENTS,
      'guru': SHEET_NAMES.TEACHERS,
      'mapel': SHEET_NAMES.MAPEL,
      'users': SHEET_NAMES.USERS
    };
    var sheetName = sheetNameMap[tableType];
    if (!sheetName) return { success: false, message: 'Tabel tidak dikenali: ' + tableType };

    var sheet = getSheet(sheetName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2) return { success: true, count: 0, status: newStatus, data: [] };

    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var colIndices = [];
    var updatedCol = -1;
    for (var j = 0; j < headers.length; j++) {
      var h = String(headers[j]).trim().toLowerCase();
      if (h === 'aktif' || h === 'is_active' || h === 'status') {
        colIndices.push({ col: j + 1, header: h });
      }
      if (h === 'updated_at') {
        updatedCol = j + 1;
      }
    }
    // Fallback for Mapel if column 5 is aktif
    if (sheetName === SHEET_NAMES.MAPEL && colIndices.length === 0 && lastCol >= 5) {
      colIndices.push({ col: 5, header: 'aktif' });
    }
    if (colIndices.length === 0) return { success: false, message: 'Kolom status aktif tidak ditemukan pada tabel ' + tableType };

    var numRows = lastRow - 1;
    var targetValNum = (newStatus === 1 || newStatus === '1') ? 1 : 0;
    var targetValText = targetValNum === 1 ? 'Aktif' : 'Nonaktif';

    colIndices.forEach(function(colInfo) {
      var val = (colInfo.header === 'status') ? targetValText : targetValNum;
      var statusValues = [];
      for (var r = 0; r < numRows; r++) {
        statusValues.push([val]);
      }
      sheet.getRange(2, colInfo.col, numRows, 1).setValues(statusValues);
    });

    if (updatedCol > 0) {
      var nowStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
      var updatedValues = [];
      for (var u = 0; u < numRows; u++) {
        updatedValues.push([nowStr]);
      }
      sheet.getRange(2, updatedCol, numRows, 1).setValues(updatedValues);
    }

    SpreadsheetApp.flush();
    invalidateCaches();
    var freshRows = readTable(sheetName);
    logActivity('BULK_STATUS_' + String(tableType).toUpperCase(), 'Mengubah status semua data ' + tableType + ' (' + numRows + ' data) menjadi ' + (targetValNum === 1 ? 'Aktif' : 'Nonaktif'));
    return { success: true, count: numRows, status: targetValNum, data: freshRows };
  } catch (err) {
    Logger.log('apiToggleAllMasterStatus error: ' + err);
    return { success: false, message: 'Gagal memperbarui status massal: ' + (err.message || err) };
  }
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

  var prevSettings = getSettingsMap();
  var oldAssetUrl = (type === 'logo') ? 
    (prevSettings.school_logo || prevSettings.logo_path || '') : 
    (prevSettings.kop_header || prevSettings.kop_image_path || '');

  var fileId = file.getId();
  var driveViewUrl = file.getUrl();
  var directImageUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600';

  // Safely trash the old Drive file (if present and not the same / not protected default template)
  if (oldAssetUrl) {
    safelyDeleteOldDriveAsset(oldAssetUrl, fileId);
  }

  var updates = {};
  if (type === 'logo') {
    updates.school_logo = directImageUrl;
  } else {
    updates.kop_header = directImageUrl;
  }

  apiSavePengaturan(updates);
  logActivity('UPLOAD_ASSET', 'Mengunggah ' + (type === 'logo' ? 'Logo Sekolah' : 'Banner Kop Surat') + ' ke Google Drive Arsip: ' + filename + ' (menggantikan file/link lama)');

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
  var count = insertRows(SHEET_NAMES.CLASSES, classes);
  logActivity('IMPORT_KELAS', 'Mengimpor ' + count + ' data kelas dari Excel');
  return { success: true, count: count };
}

function apiImportUsers(users) {
  for (var i = 0; i < (users || []).length; i++) {
    var u = users[i];
    if (u.password && !u.password_plain) u.password_plain = u.password;
    if (u.password_plain && !u.password) u.password = u.password_plain;
  }
  var count = insertRows(SHEET_NAMES.USERS, users);
  logActivity('IMPORT_USERS', 'Mengimpor ' + count + ' akun pengguna dari Excel');
  return { success: true, count: count };
}

/**
 * Universal Quick Toggle Status (Aktif <-> Nonaktif)
 */
function apiToggleMasterStatus(tableType, id, newStatus) {
  try {
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

    invalidateCaches();
    var rows = readTable(sheetName);
    var target = null;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].id) === String(id)) {
        target = rows[i];
        break;
      }
    }
    if (!target) return { success: false, message: 'Data ID #' + id + ' tidak ditemukan di sheet ' + sheetName };

    var statusVal;
    if (newStatus !== undefined && newStatus !== null) {
      statusVal = (newStatus === 1 || newStatus === '1' || newStatus === true || newStatus === 'true') ? 1 : 0;
    } else {
      var cur = parseInt(target.aktif, 10);
      statusVal = (cur === 1) ? 0 : 1;
    }

    var ok = updateRowById(sheetName, id, {
      aktif: statusVal,
      is_active: statusVal,
      status: (statusVal === 1 ? 'Aktif' : 'Nonaktif')
    });

    if (!ok) {
      return { success: false, message: 'Gagal memperbarui baris #' + id + ' di sheet ' + sheetName };
    }

    // Direct write guard for Mapel
    if (sheetName === SHEET_NAMES.MAPEL && target._row) {
      try {
        var sheet = getSheet(sheetName);
        sheet.getRange(target._row, 5).setValue(statusVal);
      } catch (eM) {}
    }

    SpreadsheetApp.flush();
    invalidateCaches();
    logActivity('TOGGLE_STATUS', 'Mengubah status ' + tableType + ' #' + id + ' menjadi ' + (statusVal === 1 ? 'Aktif' : 'Nonaktif'));
    return { success: true, newStatus: statusVal, id: id };
  } catch (err) {
    Logger.log('apiToggleMasterStatus error: ' + err);
    return { success: false, message: 'Gagal update status: ' + (err.message || err) };
  }
}

function apiSaveTemplate(payload) {
  var savedId = null;
  if (payload.id && parseInt(payload.id, 10) > 0) {
    updateRowById(SHEET_NAMES.TEMPLATES, payload.id, payload);
    logActivity('UPDATE_TEMPLATE', 'Memperbarui template ujian ID #' + payload.id);
    savedId = payload.id;
  } else {
    var saved = insertRow(SHEET_NAMES.TEMPLATES, payload);
    logActivity('CREATE_TEMPLATE', 'Menambahkan template ujian baru ' + payload.nama_ujian);
    savedId = saved ? saved.id : null;
  }
  delete _requestTableCache[SHEET_NAMES.TEMPLATES];
  return { success: true, id: savedId };
}

function apiDeleteTemplate(id) {
  try {
    deleteRowById(SHEET_NAMES.TEMPLATES, id);
    delete _requestTableCache[SHEET_NAMES.TEMPLATES];
    logActivity('DELETE_TEMPLATE', 'Menghapus template ujian ID #' + id);
    return { success: true, message: 'Template ujian berhasil dihapus.' };
  } catch (e) {
    return { success: false, message: 'Gagal menghapus template: ' + e.message };
  }
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
    var rawFoto = payload.foto;
    if (rawFoto && (rawFoto.indexOf(';base64,') !== -1 || rawFoto.indexOf('data:image/') === 0)) {
      // Simpan foto profil ke Google Drive Arsip agar tidak melebihi batas 50000 karakter per sel Spreadsheet
      var folder = getDriveFolderArsip();
      if (!folder) throw new Error('Folder Google Drive Arsip tidak dapat diakses.');

      // Bersihkan avatar lama di Drive jika ada
      if (target.foto) {
        safelyDeleteOldDriveAsset(target.foto);
      }

      var parts = rawFoto.split(';base64,');
      var mimeType = 'image/jpeg';
      if (parts[0] && parts[0].indexOf(':') !== -1) {
        mimeType = parts[0].split(':')[1];
      }
      var ext = (mimeType.indexOf('png') !== -1) ? 'png' : 'jpg';
      var cleanBase64 = parts[1] || parts[0];
      var filename = 'avatar_' + (payload.username || target.username || 'user') + '_' + Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyyMMdd_HHmmss') + '.' + ext;
      var bytes = Utilities.base64Decode(cleanBase64);
      var blob = Utilities.newBlob(bytes, mimeType, filename);
      var file = folder.createFile(blob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {
        Logger.log('Set sharing avatar: ' + e.message);
      }
      var avatarDriveUrl = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w500';
      updates.foto = avatarDriveUrl;
    } else if (rawFoto === '' || rawFoto === null) {
      if (target.foto) {
        safelyDeleteOldDriveAsset(target.foto);
      }
      updates.foto = '';
    } else {
      var converted = convertDriveUrlToThumbnail(rawFoto);
      if (converted !== target.foto && target.foto) {
        var newId = extractDriveFileId(converted);
        safelyDeleteOldDriveAsset(target.foto, newId);
      }
      updates.foto = converted;
    }
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
    var pSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
    var settingsUrl = ss.getUrl() + (pSheet ? ('#gid=' + pSheet.getSheetId()) : '');
    var settings = getSettingsMap();
    return {
      success: true,
      id: ss.getId(),
      name: ss.getName(),
      url: settingsUrl,
      spreadsheetUrl: ss.getUrl(),
      driveUrl: (settings && (settings.google_drive_folder_url || settings.drive_folder_url)) || ''
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
  seedDefaultSettings(getSheet(SHEET_NAMES.SETTINGS));
  seedDefaultClasses(getSheet(SHEET_NAMES.CLASSES));
  seedDefaultStudents(getSheet(SHEET_NAMES.STUDENTS));
  seedDefaultTeachers(getSheet(SHEET_NAMES.TEACHERS));
  seedDefaultMapel(getSheet(SHEET_NAMES.MAPEL));
  seedDefaultTemplate(getSheet(SHEET_NAMES.TEMPLATES));
  seedDefaultUsers(getSheet(SHEET_NAMES.USERS));

  // Absensi & Berita Acara & Logs
  ensureSheetHasInitialData(SHEET_NAMES.ABSENSI, getSheet(SHEET_NAMES.ABSENSI));
  ensureSheetHasInitialData(SHEET_NAMES.BERITA_ACARA, getSheet(SHEET_NAMES.BERITA_ACARA));
  ensureSheetHasInitialData(SHEET_NAMES.LOGS, getSheet(SHEET_NAMES.LOGS));

  invalidateCaches();
  Logger.log('Inisialisasi Database Berhasil Selesai pada: ' + ss.getUrl());
}


function apiForceReseedAllMasterData() {
  try {
    try { PropertiesService.getScriptProperties().deleteProperty('sas_db_seeded'); } catch (eProp) {}
    seedDefaultSettings();
    seedDefaultClasses();
    seedDefaultStudents();
    seedDefaultTeachers();
    seedDefaultMapel();
    seedDefaultTemplate();
    seedDefaultUsers();
    try { PropertiesService.getScriptProperties().setProperty('sas_db_seeded', '1'); } catch (eProp2) {}
    invalidateCaches();
    logActivity('RESEED_DATABASE', 'Inisialisasi ulang seluruh data master ke spreadsheet database');
    return {
      success: true,
      message: 'Berhasil menginisialisasi dan menyinkronkan seluruh basis data master (Kelas, Siswa, Guru, Mapel, Template, Users, Pengaturan) ke Google Sheets!'
    };
  } catch (err) {
    return { success: false, message: 'Gagal inisialisasi master: ' + err.message };
  }
}

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
      'landing': 'Landing',
      'home': 'Landing',
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

    var pageFile = routeMap[page] || 'Landing';
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
    return ScriptApp.getService().getUrl();
  } catch (e) {
    return '';
  }
}

// ==============================================================================
// LAPISAN BASIS DATA: GOOGLE SPREADSHEET DAO / ORM
// ==============================================================================

/**
 * Mendapatkan instance Spreadsheet Database
 */
function getDbSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var configuredId = props.getProperty('SPREADSHEET_ID');
  
  if (configuredId) {
    try {
      return SpreadsheetApp.openById(configuredId);
    } catch (e) {
      console.warn('Gagal membuka spreadsheet dari SPREADSHEET_ID:', e);
    }
  }

  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  // Jika belum ada spreadsheet yang aktif, buat baru secara otomatis
  var newSs = SpreadsheetApp.create('DB_SAS_SMK_NEGERI_FYJ_CHANNEL');
  props.setProperty('SPREADSHEET_ID', newSs.getId());
  setupSpreadsheetDatabase(false, newSs);
  return newSs;
}

/**
 * Set manual SPREADSHEET_ID via fungsi admin
 */
function setSpreadsheetId(id) {
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
 * Membaca data tabel sheet menjadi Array of Objects
 */
function getTableData(sheetName) {
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
  return rows;
}

/**
 * Menambahkan 1 baris ke tabel sheet
 */
function appendTableRow(sheetName, obj, defaultHeaders) {
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

var SEED_DATA = {"classes":[{"id":1,"nama_kelas":"XII TKJ","tingkat":"XII","program_keahlian":"Teknik Komputer dan Jaringan","is_active":1},{"id":2,"nama_kelas":"XII DKV","tingkat":"XII","program_keahlian":"Desain Komunikasi Visual","is_active":1},{"id":3,"nama_kelas":"XII LPKKK 1","tingkat":"XII","program_keahlian":"LPKKK","is_active":1},{"id":4,"nama_kelas":"XII LPKKK 2","tingkat":"XII","program_keahlian":"Layanan Penunjang Kefarmasian Klinis dan Komunitas","is_active":1},{"id":5,"nama_kelas":"XII BD 1","tingkat":"XII","program_keahlian":"BD","is_active":1},{"id":6,"nama_kelas":"XII BD 2","tingkat":"XII","program_keahlian":"Bisnis Digital","is_active":1},{"id":7,"nama_kelas":"XII MP 1","tingkat":"XII","program_keahlian":"Manajemen Perkantoran dan Layanan Bisnis","is_active":1},{"id":8,"nama_kelas":"XII MP 2","tingkat":"XII","program_keahlian":"Manajemen Perkantoran dan Layanan Bisnis","is_active":1},{"id":9,"nama_kelas":"XII LPB","tingkat":"XII","program_keahlian":"Layanan Perbankan","is_active":1},{"id":10,"nama_kelas":"XII AK","tingkat":"XII","program_keahlian":"Akuntansi dan Keuangan Lembaga","is_active":1},{"id":11,"nama_kelas":"XII TSM","tingkat":"XII","program_keahlian":"Teknik Sepeda Motor","is_active":1}],"students":[{"id":1,"class_id":1,"nis":"13561","nama":"Agustinus Poka Mete"},{"id":2,"class_id":1,"nis":"13562","nama":"Akbar Alfiansah"},{"id":3,"class_id":1,"nis":"13563","nama":"Dwi Retno Ayuningrum"},{"id":4,"class_id":1,"nis":"13565","nama":"I Gede Adtya Wedha Paramartha"},{"id":5,"class_id":1,"nis":"13566","nama":"I Gede Putra Sang Pajar"},{"id":6,"class_id":1,"nis":"13567","nama":"I Komang Giri Artawan"},{"id":7,"class_id":1,"nis":"13568","nama":"I Made Sugiarta"},{"id":8,"class_id":1,"nis":"13569","nama":"I Putu Adi Ari Endrawan"},{"id":9,"class_id":1,"nis":"13570","nama":"I Putu Agus Pratama Putra"},{"id":10,"class_id":1,"nis":"13571","nama":"I Putu Pasek Prawira Putra"},{"id":11,"class_id":1,"nis":"13572","nama":"I Wayan Kartika Adi Putra"},{"id":12,"class_id":1,"nis":"13573","nama":"Komang Jano Artha"},{"id":13,"class_id":1,"nis":"13574","nama":"M. Afgansyah Al-Maghfiroh"},{"id":14,"class_id":1,"nis":"13575","nama":"Made Pradnya Wahyu Radheya"},{"id":15,"class_id":1,"nis":"13576","nama":"Ni Ketut Sinta"},{"id":16,"class_id":1,"nis":"13577","nama":"Ni Komang Sila Triana Sari"},{"id":17,"class_id":1,"nis":"13578","nama":"Radit"},{"id":18,"class_id":1,"nis":"13579","nama":"Rizka Nurdiandari"},{"id":19,"class_id":1,"nis":"13580","nama":"Rizky Adib Irlan Syah"},{"id":20,"class_id":1,"nis":"13581","nama":"Rizqy Al Farraby"},{"id":21,"class_id":2,"nis":"13769","nama":"Anak Agung Gede Dika Pradipta"},{"id":22,"class_id":2,"nis":"13770","nama":"Gek Danaya Anindia"},{"id":23,"class_id":2,"nis":"13771","nama":"I Gede Ary Kesuma Suputra"},{"id":24,"class_id":2,"nis":"13772","nama":"I Gede Rian Primayoga"},{"id":25,"class_id":2,"nis":"13773","nama":"I Komang Raka Danaswara"},{"id":26,"class_id":2,"nis":"13774","nama":"I Made Dharma Mahardika"},{"id":27,"class_id":2,"nis":"13775","nama":"I Made Wahyu Adikusuma"},{"id":28,"class_id":2,"nis":"13776","nama":"I Putu Gede Eka Yogantara Pratmaja"},{"id":29,"class_id":2,"nis":"13777","nama":"I Putu Rendy Galang Permana"},{"id":30,"class_id":2,"nis":"13778","nama":"I Wayan Wira Pradnyana"},{"id":31,"class_id":2,"nis":"13779","nama":"Kadek Gita Anindita Kemulan"},{"id":32,"class_id":2,"nis":"13780","nama":"Komang Aditya"},{"id":33,"class_id":2,"nis":"13781","nama":"Ni Kadek Ayu Melani Ratna Dewi"},{"id":34,"class_id":2,"nis":"13782","nama":"Ni Kadek Ita Sutriani"},{"id":35,"class_id":2,"nis":"13783","nama":"Ni Kadek Ranita Dewi"},{"id":36,"class_id":2,"nis":"13784","nama":"Ni Luh Putu Sekar Darma Yanti"},{"id":37,"class_id":2,"nis":"13785","nama":"Ni Made Ayu Dwi Apriliani"},{"id":38,"class_id":2,"nis":"13786","nama":"Ni Putu Dian Cahyani"},{"id":39,"class_id":2,"nis":"13787","nama":"Ni Putu Ghina Anastasia Putri"},{"id":40,"class_id":2,"nis":"13788","nama":"Ni Putu Rismayani Darma Swari"},{"id":41,"class_id":2,"nis":"13789","nama":"Queena Bilqist Mulyadi Putri"},{"id":42,"class_id":2,"nis":"13790","nama":"Raditya Nugraha"},{"id":43,"class_id":2,"nis":"13791","nama":"Wayan Satya Dharma"},{"id":44,"class_id":3,"nis":"13582","nama":"Agus Billy Fedrico","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":45,"class_id":3,"nis":"13583","nama":"Agus Eka Widya Pradnyana","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":46,"class_id":3,"nis":"13584","nama":"Dewa Ayu Sri Widyastuti","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":47,"class_id":3,"nis":"13585","nama":"I Dewa Ayu Dwi Cahya Indrayani","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":48,"class_id":3,"nis":"13586","nama":"I Komang Edi Setiawan.","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":49,"class_id":3,"nis":"13587","nama":"Ida Ayu Putu Diah Kamiswari","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":50,"class_id":3,"nis":"13588","nama":"Luh Ade Galuh Pratiwi","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":51,"class_id":3,"nis":"13589","nama":"Munifa Inayatur Rohma","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":52,"class_id":3,"nis":"13590","nama":"Ni Kadek Ayu Arsani","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":53,"class_id":3,"nis":"13591","nama":"Ni Kadek Diah Dwi Adnyani","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":54,"class_id":3,"nis":"13592","nama":"Ni Kadek Dian Candra Pratiwi","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":55,"class_id":3,"nis":"13593","nama":"Ni Kadek Evinayanti","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":56,"class_id":3,"nis":"13595","nama":"Ni Komang Ayu Santika","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":57,"class_id":3,"nis":"13596","nama":"Ni Komang Widya Krista Yanti","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":58,"class_id":3,"nis":"13597","nama":"Ni Made Juniari","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":59,"class_id":3,"nis":"13598","nama":"Ni Made Shita Wulandari","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":60,"class_id":3,"nis":"13599","nama":"Ni Putu Intan Merliani Putri","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":61,"class_id":3,"nis":"13600","nama":"Ni Putu Novi Armatiana","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":62,"class_id":3,"nis":"13601","nama":"Ni Wayan Ani Arthayasih","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":63,"class_id":3,"nis":"13602","nama":"Ni Wayan Nanda Pradnya Suari","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":64,"class_id":3,"nis":"13603","nama":"Yoneda Yebleb","kelas":"XII LPKKK 1","nama_kelas":"XII LPKKK 1"},{"id":65,"class_id":4,"nis":"13604","nama":"Aisyah Dwi Agusthina"},{"id":66,"class_id":4,"nis":"13605","nama":"Elyska Kirana Putri"},{"id":67,"class_id":4,"nis":"14102","nama":"Gusti Ayu Putu Alita Bintang Lestari"},{"id":68,"class_id":4,"nis":"13606","nama":"I Gusti Ayu Indah Pertiwi"},{"id":69,"class_id":4,"nis":"13608","nama":"Mauli Diana Rahayu Putri"},{"id":70,"class_id":4,"nis":"13609","nama":"Ni Kadek Bintang Nopiani"},{"id":71,"class_id":4,"nis":"13611","nama":"Ni Kadek Winda Wulandewi"},{"id":72,"class_id":4,"nis":"13612","nama":"Ni Komang Anggraeni"},{"id":73,"class_id":4,"nis":"13613","nama":"Ni Komang Leges Aria Sentani"},{"id":74,"class_id":4,"nis":"13614","nama":"Ni Komang Sri Diah Lastari"},{"id":75,"class_id":4,"nis":"13615","nama":"Ni Komang Tri Maetarani"},{"id":76,"class_id":4,"nis":"13616","nama":"Ni Komang Trisna Dewi"},{"id":77,"class_id":4,"nis":"13617","nama":"Ni Luh Komang Divya Santhi"},{"id":78,"class_id":4,"nis":"13618","nama":"Ni Putu Galih Pratiwi Setiawan"},{"id":79,"class_id":4,"nis":"13619","nama":"Ni Putu Indah Muliarni"},{"id":80,"class_id":4,"nis":"13620","nama":"Ni Putu Martini Lestari"},{"id":81,"class_id":4,"nis":"13621","nama":"Ni Putu Widya Wulandari"},{"id":82,"class_id":4,"nis":"13622","nama":"Ni Wayan Novi Lestari"},{"id":83,"class_id":4,"nis":"13624","nama":"Rizqiana Ayudianingsih"},{"id":84,"class_id":5,"nis":"13625","nama":"Dewa Ayu Made Dwi Artika Darmayanti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":85,"class_id":5,"nis":"13626","nama":"I Gede Adi Putra","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":86,"class_id":5,"nis":"13627","nama":"I Gusti Ayu Wika Ariestari","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":87,"class_id":5,"nis":"13628","nama":"I Gusti Ngurah Wijana","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":88,"class_id":5,"nis":"13629","nama":"I Kadek Yogi Iswara","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":89,"class_id":5,"nis":"13630","nama":"I Nyoman Candra Paranarta","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":90,"class_id":5,"nis":"13631","nama":"Kadek Suki Oktami","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":91,"class_id":5,"nis":"13632","nama":"Luh Desiyani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":92,"class_id":5,"nis":"13633","nama":"Ni Kadek Ayu Dwipayani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":93,"class_id":5,"nis":"13634","nama":"Ni Kadek Sanjiani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":94,"class_id":5,"nis":"13635","nama":"Ni Kadek Widiantari","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":95,"class_id":5,"nis":"13636","nama":"Ni Komang Ayu Intan Pratiwi","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":96,"class_id":5,"nis":"13637","nama":"Ni Komang Henny Herdi Yani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":97,"class_id":5,"nis":"13638","nama":"Ni Komang Purnama Sari","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":98,"class_id":5,"nis":"13639","nama":"Ni Komang Sri Damayanti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":99,"class_id":5,"nis":"13640","nama":"Ni Komang Trisna Yuni Astari","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":100,"class_id":5,"nis":"13641","nama":"Ni Luh Putu Frema Sugi Maharani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":101,"class_id":5,"nis":"13642","nama":"Ni Made Sari Astini","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":102,"class_id":5,"nis":"13643","nama":"Ni Made Sukma Yanti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":103,"class_id":5,"nis":"13644","nama":"Ni Nyoman Manik Dalem Maharani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":104,"class_id":5,"nis":"13645","nama":"Ni Putu Eka Candra Dewi","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":105,"class_id":5,"nis":"13646","nama":"Ni Putu Sari Astuti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":106,"class_id":5,"nis":"13647","nama":"Ni Putu Sariasih","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":107,"class_id":5,"nis":"13648","nama":"Ni Putu Selpi","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":108,"class_id":5,"nis":"13649","nama":"Ni Putu Sinta Purnama Yanti","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":109,"class_id":5,"nis":"13650","nama":"Putu Agus Mahendra","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":110,"class_id":5,"nis":"13651","nama":"Putu Aryadinata","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":111,"class_id":5,"nis":"13652","nama":"Putu Purnamawati","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":112,"class_id":5,"nis":"13653","nama":"Rizki Ananta Ramadhani","kelas":"XII BD 1","nama_kelas":"XII BD 1"},{"id":113,"class_id":6,"nis":"13654","nama":"Anisa Safila"},{"id":114,"class_id":6,"nis":"13655","nama":"Dewa Ayu Raras Variati"},{"id":115,"class_id":6,"nis":"13794","nama":"Galang Damai Dinata"},{"id":116,"class_id":6,"nis":"13656","nama":"I Gede Sutawan"},{"id":117,"class_id":6,"nis":"13657","nama":"I Kadek Desta Prawira"},{"id":118,"class_id":6,"nis":"13658","nama":"I Kadek Purnawirawan"},{"id":119,"class_id":6,"nis":"13659","nama":"I Ketut Alit Rupawan"},{"id":120,"class_id":6,"nis":"13660","nama":"I Komang Sucitra"},{"id":121,"class_id":6,"nis":"13661","nama":"I Made Windya Arsana"},{"id":122,"class_id":6,"nis":"13662","nama":"I Putu Aditya Suputra"},{"id":123,"class_id":6,"nis":"13663","nama":"Kadek Agus Apriana Bajesti Putra"},{"id":124,"class_id":6,"nis":"13664","nama":"Luh Made Purnama Dewi"},{"id":125,"class_id":6,"nis":"13665","nama":"Ni Kadek Meta Febriantari"},{"id":126,"class_id":6,"nis":"13666","nama":"Ni Kadek Putri Jayanti"},{"id":127,"class_id":6,"nis":"13667","nama":"Ni Komang Ayu Septianingsih"},{"id":128,"class_id":6,"nis":"13668","nama":"Ni Luh Nova Sinta Riari"},{"id":129,"class_id":6,"nis":"13669","nama":"Ni Nengah Febriani"},{"id":130,"class_id":6,"nis":"13670","nama":"Ni Pande Wayan Yonika Damayani"},{"id":131,"class_id":6,"nis":"13671","nama":"Ni Putu Lia Trisnayanti"},{"id":132,"class_id":6,"nis":"13672","nama":"Putu Vera Agustin"},{"id":133,"class_id":7,"nis":"13673","nama":"Anak Agung Dewi Suryaningrat"},{"id":134,"class_id":7,"nis":"13674","nama":"Desak Nyoman Widya Sari"},{"id":135,"class_id":7,"nis":"13675","nama":"I Dewa Ayu Bulan Sriasih"},{"id":136,"class_id":7,"nis":"13676","nama":"I Gede Ary Sudiantara"},{"id":137,"class_id":7,"nis":"13677","nama":"I Gede Nesa Wira Arsana"},{"id":138,"class_id":7,"nis":"13678","nama":"I Gusti Ayu Diana Kristiani"},{"id":139,"class_id":7,"nis":"13679","nama":"I Gusti Ngurah Agus Januarta"},{"id":140,"class_id":7,"nis":"13680","nama":"Komang Ayu Seri Musthikarani"},{"id":141,"class_id":7,"nis":"13681","nama":"Made Nitarianti"},{"id":142,"class_id":7,"nis":"13682","nama":"Meisya Fazrina"},{"id":143,"class_id":7,"nis":"13683","nama":"Ni Kadek Aprilia Lestari"},{"id":144,"class_id":7,"nis":"13684","nama":"Ni Kadek Ayu Lestari"},{"id":145,"class_id":7,"nis":"13685","nama":"Ni Kadek Darma Yanti"},{"id":146,"class_id":7,"nis":"13686","nama":"Ni Kadek Ika Pradevi"},{"id":147,"class_id":7,"nis":"13687","nama":"Ni Kadek Risna Kumala Dewi"},{"id":148,"class_id":7,"nis":"13688","nama":"Ni Kadek Sintia Wati"},{"id":149,"class_id":7,"nis":"13689","nama":"Ni Ketut Melia Purnama Sari"},{"id":150,"class_id":7,"nis":"13690","nama":"Ni Komang Ayu Widiantari"},{"id":151,"class_id":7,"nis":"13691","nama":"Ni Komang Diah Anandita Permata"},{"id":152,"class_id":7,"nis":"13692","nama":"Ni Komang Rini Cahyani"},{"id":153,"class_id":7,"nis":"13693","nama":"Ni Luh Ayu Purnama Dewi"},{"id":154,"class_id":7,"nis":"13694","nama":"Ni Luh Lisna Diantari"},{"id":155,"class_id":7,"nis":"13695","nama":"Ni Luh Sri Nadi"},{"id":156,"class_id":7,"nis":"13696","nama":"Ni Nengah Septia Dewi"},{"id":157,"class_id":7,"nis":"13697","nama":"Ni Putu Eka Pramita Sari"},{"id":158,"class_id":7,"nis":"13698","nama":"Pande Ni Putu Adisty Kusuma Jati"},{"id":159,"class_id":7,"nis":"13699","nama":"Tiara Yuliyanti"},{"id":160,"class_id":8,"nis":"13700","nama":"Anak Agung Istri Amira Vebriani"},{"id":161,"class_id":8,"nis":"13701","nama":"I Dewa Ayu Juniantari"},{"id":162,"class_id":8,"nis":"13702","nama":"I Gede Tri Jaya Winnata"},{"id":163,"class_id":8,"nis":"13703","nama":"Ida Bagus Yuda Pratama"},{"id":164,"class_id":8,"nis":"13704","nama":"Irsyad Adiba Hafas Zidansyah"},{"id":165,"class_id":8,"nis":"13705","nama":"Ni Kadek Ayu Aprilia Dewi"},{"id":166,"class_id":8,"nis":"13706","nama":"Ni Kadek Ayu Larasati"},{"id":167,"class_id":8,"nis":"13707","nama":"Ni Kadek Puspa Aryanti"},{"id":168,"class_id":8,"nis":"13708","nama":"Ni Kadek Sriyanti"},{"id":169,"class_id":8,"nis":"13709","nama":"Ni Komang Adelia Putri"},{"id":170,"class_id":8,"nis":"13710","nama":"Ni Komang Indah Jesika Dewi"},{"id":171,"class_id":8,"nis":"13711","nama":"Ni Komang Listia Dewi"},{"id":172,"class_id":8,"nis":"13712","nama":"Ni Komang Padmawati"},{"id":173,"class_id":8,"nis":"13713","nama":"Ni Komang Sutri Prantini"},{"id":174,"class_id":8,"nis":"13714","nama":"Ni Komang Triana Pusparani"},{"id":175,"class_id":8,"nis":"13715","nama":"Ni Luh Vika Widyawati"},{"id":176,"class_id":8,"nis":"13716","nama":"Ni Made Suci Manik Astari"},{"id":177,"class_id":8,"nis":"13717","nama":"Ni Putu Ayu Bintang"},{"id":178,"class_id":8,"nis":"13718","nama":"Ni Putu Diah Arthasari"},{"id":179,"class_id":8,"nis":"13719","nama":"Ni Putu Eka Semara Putri"},{"id":180,"class_id":8,"nis":"13720","nama":"Ni Putu Eka Widiantari"},{"id":181,"class_id":8,"nis":"13721","nama":"Ni Putu Mei Wulandari"},{"id":182,"class_id":8,"nis":"13722","nama":"Ni Putu Puspawati"},{"id":183,"class_id":8,"nis":"13723","nama":"Ni Putu Tia Dewi"},{"id":184,"class_id":8,"nis":"13724","nama":"Pande Putu Galuh Risanti Indira Yunika"},{"id":185,"class_id":8,"nis":"13725","nama":"Putu Juli Ayu Antari"},{"id":186,"class_id":8,"nis":"13726","nama":"Sang Made Arta Mahendra"},{"id":187,"class_id":9,"nis":"13727","nama":"Afrilia"},{"id":188,"class_id":9,"nis":"13728","nama":"Anak Agung Istri Prima Pebrianti"},{"id":189,"class_id":9,"nis":"13729","nama":"Gede Risky Adi Permana"},{"id":190,"class_id":9,"nis":"13730","nama":"I Gusti Ayu Putu Candra Widiantari"},{"id":191,"class_id":9,"nis":"13731","nama":"I Gusti Made Diah Purnama Sari"},{"id":192,"class_id":9,"nis":"13732","nama":"Ida Ayu Indah Gangga Swari"},{"id":193,"class_id":9,"nis":"13733","nama":"Ida Ayu Nyoman Reditya Oktaviani"},{"id":194,"class_id":9,"nis":"13734","nama":"Ida Ayu Sinta Dewi"},{"id":195,"class_id":9,"nis":"13736","nama":"Nabila Tusak Diah"},{"id":196,"class_id":9,"nis":"13737","nama":"Ni Kadek Intan Satrya Wati"},{"id":197,"class_id":9,"nis":"13738","nama":"Ni Made Ari Diana Sari"},{"id":198,"class_id":9,"nis":"13739","nama":"Rina Agustina"},{"id":199,"class_id":10,"nis":"13741","nama":"I Desak Ketut Patniki Astuti"},{"id":200,"class_id":10,"nis":"13742","nama":"I Dewa Ayu Awidiya Sari"},{"id":201,"class_id":10,"nis":"13743","nama":"I Dewa Ayu Meira Dianra Sari"},{"id":202,"class_id":10,"nis":"13744","nama":"I Putu Juniarta"},{"id":203,"class_id":10,"nis":"13745","nama":"I Wayan Agus Septiadi"},{"id":204,"class_id":10,"nis":"13746","nama":"Ketut Ananta Wardana"},{"id":205,"class_id":10,"nis":"13747","nama":"Ni Kadek Anggun Putri Pramesti"},{"id":206,"class_id":10,"nis":"13748","nama":"Ni Kadek Ratih Sancikadewi"},{"id":207,"class_id":10,"nis":"13749","nama":"Ni Kadek Santiasih"},{"id":208,"class_id":10,"nis":"13750","nama":"Ni Kadek Sinta Widyantini"},{"id":209,"class_id":10,"nis":"13751","nama":"Ni Kadek Suadnyani Megeng"},{"id":210,"class_id":10,"nis":"13752","nama":"Ni Ketut Catur Rahayu"},{"id":211,"class_id":10,"nis":"13753","nama":"Ni Komang Bintang Triasih"},{"id":212,"class_id":10,"nis":"13754","nama":"Ni Luh Nyoman Tri Githa Pramesti"},{"id":213,"class_id":10,"nis":"13755","nama":"Ni Luh Putu Candra Cahyani"},{"id":214,"class_id":10,"nis":"13756","nama":"Ni Putu Anggik Deswandari"},{"id":215,"class_id":10,"nis":"13757","nama":"Ni Putu Ayu Krisna Candra Dewi"},{"id":216,"class_id":10,"nis":"13758","nama":"Ni Putu Dewik"},{"id":217,"class_id":10,"nis":"13759","nama":"Ni Putu Diah Darmayanti"},{"id":218,"class_id":10,"nis":"13760","nama":"Ni Putu Dian Ambarwati"},{"id":219,"class_id":10,"nis":"13761","nama":"Ni Putu Dian Maharani"},{"id":220,"class_id":10,"nis":"13762","nama":"Ni Putu Echa Setyawati"},{"id":221,"class_id":10,"nis":"13763","nama":"Ni Putu Eka Pandewi"},{"id":222,"class_id":10,"nis":"13764","nama":"Ni Putu Stefany Devita Putri"},{"id":223,"class_id":10,"nis":"13765","nama":"Ni Putu Wita Sinta Pradnyani"},{"id":224,"class_id":10,"nis":"13766","nama":"Ni Wayan Chandra Rusita Devi"},{"id":225,"class_id":10,"nis":"13767","nama":"Pande Made Shasmita Aurellia Putri"},{"id":226,"class_id":10,"nis":"13768","nama":"Yenny Febri Yanthy Ningsih"},{"id":227,"class_id":11,"nis":"13526","nama":"Aldo Valentino"},{"id":228,"class_id":11,"nis":"13527","nama":"ARKANANTA MAULANA PUTRA APRILIANSYAH"},{"id":229,"class_id":11,"nis":"13528","nama":"I Gede Ari Widnyana"},{"id":230,"class_id":11,"nis":"13529","nama":"I Gede Candra Wiguna"},{"id":231,"class_id":11,"nis":"13530","nama":"I Gede Resa Pradnya Andika"},{"id":232,"class_id":11,"nis":"13531","nama":"I GUSTI NGURAH SATHYA DANANJAYA"},{"id":233,"class_id":11,"nis":"13532","nama":"I Kadek Angga Aditya Putra"},{"id":234,"class_id":11,"nis":"13533","nama":"I Kadek Dodik Ramayoga"},{"id":235,"class_id":11,"nis":"13534","nama":"I Kadek Dwi Adi Darma Yudhi"},{"id":236,"class_id":11,"nis":"13535","nama":"I Kadek Ipan Junata"},{"id":237,"class_id":11,"nis":"13536","nama":"I KADEK KUSUMA CAHYADI"},{"id":238,"class_id":11,"nis":"13537","nama":"I Ketut Catur Yoga Saputra"},{"id":239,"class_id":11,"nis":"13540","nama":"I Komang Bayu Septi Permana"},{"id":240,"class_id":11,"nis":"13541","nama":"I Komang Pebri Andika Saputra"},{"id":241,"class_id":11,"nis":"13542","nama":"I Made Agus Bayu Widi"},{"id":242,"class_id":11,"nis":"13543","nama":"I Made Div Aditya Pramana"},{"id":243,"class_id":11,"nis":"13544","nama":"I Ngurah Komang Ari Artana"},{"id":244,"class_id":11,"nis":"13545","nama":"I Putu Bayu Saputra"},{"id":245,"class_id":11,"nis":"13547","nama":"I Putu Pande Sedaya Tana"},{"id":246,"class_id":11,"nis":"13548","nama":"I Wayan Surya Nanta"},{"id":247,"class_id":11,"nis":"13550","nama":"JULIANTARA PUTRA"},{"id":248,"class_id":11,"nis":"13551","nama":"Kadek Angga Trisnawan"},{"id":249,"class_id":11,"nis":"13552","nama":"Ketut Mahardika"},{"id":250,"class_id":11,"nis":"13538","nama":"Ketut Rianta"},{"id":251,"class_id":11,"nis":"13553","nama":"Lorensius Kaka Lalo"},{"id":252,"class_id":11,"nis":"13554","nama":"Made Adi Mahardika"},{"id":253,"class_id":11,"nis":"13555","nama":"MUHAMMAD AZIZUL HAKIM"},{"id":254,"class_id":11,"nis":"13556","nama":"Nyoman Yudhi Triananda Wibawa"},{"id":255,"class_id":11,"nis":"13558","nama":"REDNO FEDRIANZAH"},{"id":256,"class_id":11,"nis":"13795","nama":"ROBERTO CHRISTIANO"},{"id":257,"class_id":11,"nis":"13559","nama":"WIRANTO SANJAYA"},{"id":258,"class_id":11,"nis":"13560","nama":"YUSUF ARDIANSYAH"}],"teachers":[{"id":1,"nama":"I Wayan Sukadana, S.Pd.","nip":"19820514 200801 1 012","mapel":"Teknik Jaringan Komputer","jabatan":"Guru Madya / Pengawas"},{"id":2,"nama":"Ni Made Rai Artini, S.Kom.","nip":"19870921 201101 2 008","mapel":"Desain Komunikasi Visual","jabatan":"Guru Muda / Pengawas"},{"id":3,"nama":"Drs. I Ketut Suardana, M.Pd.","nip":"19680315 199412 1 002","mapel":"Bahasa Indonesia","jabatan":"Guru Pembina / Pengawas"},{"id":4,"nama":"Ni Luh Putu Dewi Lestari, S.Pd.","nip":"19841120 200902 2 005","mapel":"Matematika","jabatan":"Guru Madya / Pengawas"},{"id":5,"nama":"I Made Agus Wira Pratama, S.T.","nip":"19890610 201503 1 004","mapel":"Teknik Sepeda Motor","jabatan":"Guru Muda / Pengawas"},{"id":6,"nama":"Ni Kadek Sri Wahyuni, S.Farm., Apt.","nip":"19910425 201903 2 011","mapel":"Layanan Penunjang Kefarmasian","jabatan":"Guru Pertama / Pengawas"},{"id":7,"nama":"I Gusti Ngurah Agung Putra, S.E.","nip":"19780814 200604 1 009","mapel":"Akuntansi dan Keuangan","jabatan":"Guru Madya / Pengawas"},{"id":8,"nama":"Ni Putu Eka Yuliani, S.Pd.","nip":"19860112 201001 2 018","mapel":"Manajemen Perkantoran","jabatan":"Guru Muda / Pengawas"},{"id":9,"nama":"I Komang Yudi Antara, S.Kom.","nip":"19920818 202012 1 007","mapel":"Bisnis Digital","jabatan":"Guru Pertama / Pengawas"},{"id":10,"nama":"Ida Bagus Made Ananda, S.Pd.","nip":"19800722 200501 1 006","mapel":"Bahasa Inggris","jabatan":"Guru Madya / Pengawas"}],"subjects":["Desain Komunikasi Visual","Teknik Komputer dan Jaringan","Teknik Sepeda Motor","Layanan Penunjang Kefarmasian Klinis dan Komunitas","Bisnis Digital","Manajemen Perkantoran","Akuntansi dan Keuangan Lembaga","Matematika","Bahasa Indonesia","Bahasa Inggris","Pendidikan Agama Hindu dan Budi Pekerti","Pendidikan Pancasila","Sejarah","Informatika","Projek IPAS","Mapel Pilihan","Seni Budaya","Kreativitas, Inovasi dan Kewirausahaan"],"academic_years":["2026/2027","2027/2028"],"templates":[{"id":1,"nama_ujian":"Sumatif Akhir Semester (SAS)","tahun_ajaran":"2026/2027","semester":"Ganjil","judul_berita_acara":"BERITA ACARA \nPENYELENGGARAAN SUMATIF AKHIR SEMESTER (SAS) GANJIL\nTAHUN AJARAN [tahun_ajaran]","redaksi_isi":"<p>Pada hari ini [hari], tanggal [tanggal] ([tanggal_teks]) bulan [bulan] tahun [tahun] ([tahun_teks]):</p>\n<ol style=\"margin-top: 6px; margin-bottom: 12px;\">\n<li style=\"margin-bottom: 8px;\">Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran] dari pukul [jam_mulai] sampai dengan pukul [jam_selesai] WITA.\n<ul style=\"margin-bottom: 6px; margin-left: 20px; list-style-type: disc;\">\n<li>Pada Sekolah:&nbsp;<strong>[sekolah]</strong></li>\n<li>Kelas:&nbsp;<strong>[kelas]</strong></li>\n<li>Mata Pelajaran:&nbsp;<strong>[mata_pelajaran]</strong></li>\n<li>Ruang:&nbsp;<strong>[ruang]</strong></li>\n<li>Jumlah Peserta Seharusnya:&nbsp;<strong>[peserta_seharusnya]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Tidak Hadir:&nbsp;<strong>[peserta_tidak_hadir]</strong>&nbsp;orang</li>\n<li>Jumlah Peserta yang Hadir:&nbsp;<strong>[peserta_hadir]</strong>&nbsp;orang</li>\n</ul>\n</li>\n<li style=\"margin-bottom: 8px;\">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):[catatan_pelaksanaan]</li>\n<li style=\"margin-bottom: 8px;\">Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):<br><em>[catatan_pelaksanaan]</em></li>\n</ol>\n<p style=\"margin-top: 15px;\">Demikian Berita Acara ini dibuat dengan sesungguhnya.</p>\n<p style=\"margin-top: 15px;\"><span style=\"font-size: 14.6667px;\"><br></span></p>\n<p style=\"text-align: center; margin-top: 15px;\"><span style=\"font-size: 14.6667px;\">Yang membuat berita acara :</span></p>","redaksi_pembuka":"Pada hari ini [hari], tanggal [tanggal] bulan [bulan] tahun [tahun].","redaksi_poin_1":"Telah diselenggarakan [nama_ujian] Tahun Ajaran [tahun_ajaran] dari pukul [jam_mulai] sampai dengan pukul [jam_selesai].\n- Pada Sekolah: SMK NEGERI FYJ CHANNEL\n- Mata Pelajaran: [mata_pelajaran]\n- Kelas: [kelas]\n- Ruang: [ruang]\n- Jumlah Peserta Seharusnya: [peserta_seharusnya] orang\n- Jumlah Peserta yang Tidak Hadir: [peserta_tidak_hadir] orang\n- Jumlah Peserta yang Hadir: [peserta_hadir] orang","redaksi_poin_2":"Telah dibagikan tautan soal ujian online untuk Mata Pelajaran [mata_pelajaran] di ruang [ruang] dengan disaksikan oleh para peserta, serta telah dibagikan lembar blangko berita acara sebanyak [blangko_berita_acara] eksemplar dan blangko daftar hadir sebanyak [blangko_daftar_hadir] eksemplar.","label_catatan":"Catatan selama pelaksanaan ujian (kendala teknis, kejadian khusus, atau keterangan lain):","aktif":1}],"settings":{"school_name":"SMK NEGERI FYJ CHANNEL","school_tagline":"Generator Administrasi Ujian","kop_header":"data:image/png;base64,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","school_logo":"data:image/png;base64,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","academic_year":"2026/2027","default_semester":"Ganjil","timezone":"WITA","academic_years":["2026/2027","2027/2028"],"subjects":["Desain Komunikasi Visual","Teknik Komputer dan Jaringan","Teknik Sepeda Motor","Layanan Penunjang Kefarmasian Klinis dan Komunitas","Bisnis Digital","Manajemen Perkantoran","Akuntansi dan Keuangan Lembaga","Matematika","Bahasa Indonesia","Bahasa Inggris","Pendidikan Agama Hindu dan Budi Pekerti","Pendidikan Pancasila","Sejarah","Informatika","Projek IPAS","Mapel Pilihan","Seni Budaya","Kreativitas, Inovasi dan Kewirausahaan"],"active_template_id":2},"users":[{"id":1,"username":"admin","password":"admin123","nama":"Administrator FYJ Channel","role":"admin"},{"id":2,"username":"guru","password":"guru123","nama":"Ni Made Rai Artini, S.Kom.","role":"operator","created_at":"2026-10-20T03:27:58.858Z"}]};

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
  if (!settings.school_logo) settings.school_logo = SEED_DATA.settings.school_logo;
  if (!settings.kop_header) settings.kop_header = SEED_DATA.settings.kop_header;
  if (!settings.academic_year) settings.academic_year = '2026/2027';
  if (!settings.default_semester) settings.default_semester = 'Ganjil';
  if (!settings.timezone) settings.timezone = 'WITA';

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

  return {
    success: true,
    settings: settings,
    classes: classes,
    templates: templates,
    subjects: subjects,
    academic_years: academicYears,
    teachers: teachers
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

    if (target) {
      var tClass = (target.nama_kelas || '').trim().toLowerCase();
      var tMapel = (target.mata_pelajaran || '').trim().toLowerCase();
      var tDate = (target.tanggal_ujian || '').trim();

      var remaining = archives.filter(function(a) {
        if (String(a.id) === String(archiveId)) {
          deletedCount++;
          return false;
        }
        // Hapus juga dokumen kembarannya jika sesi, tanggal, mapel, dan kelas sama persis
        var aClass = (a.nama_kelas || '').trim().toLowerCase();
        var aMapel = (a.mata_pelajaran || '').trim().toLowerCase();
        var aDate = (a.tanggal_ujian || '').trim();
        if (tDate && aDate === tDate && tMapel && aMapel === tMapel && tClass && aClass === tClass) {
          deletedCount++;
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
        deletedCount: deletedCount
      };
    } else {
      deleteTableRow(SHEET_NAMES.ARCHIVES, 'id', archiveId);
      return { success: true, message: 'Arsip dokumen berhasil dihapus.' };
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
    } else if (Array.isArray(payload.students)) {
      var sHeaders = ['id', 'class_id', 'nis', 'nama'];
      batchReplaceTable(SHEET_NAMES.STUDENTS, sHeaders, payload.students);
    }

    if (payload.delete_all_teachers === true) {
      var tHeaders = ['id', 'nama', 'nip', 'mapel', 'jabatan', 'is_active'];
      batchReplaceTable(SHEET_NAMES.TEACHERS, tHeaders, []);
    } else if (Array.isArray(payload.teachers)) {
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

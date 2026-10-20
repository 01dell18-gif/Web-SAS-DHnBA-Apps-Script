/**
 * Logika Formulir & Live Preview Berita Acara Ujian
 * Generator Absensi dan Berita Acara Ujian - SMK NEGERI FYJ CHANNEL
 */

document.addEventListener('DOMContentLoaded', function() {
    // 1. Inisialisasi Tanda Tangan Canvas
    const canvas1 = document.getElementById('canvas_ttd_pengawas_1');
    const canvas2 = document.getElementById('canvas_ttd_pengawas_2');
    const hiddenTtd1 = document.getElementById('ttd_pengawas_1_data');
    const hiddenTtd2 = document.getElementById('ttd_pengawas_2_data');
    const btnClear1 = document.getElementById('btnClearTtd1');
    const btnClear2 = document.getElementById('btnClearTtd2');
    const signatureModeRadios = document.querySelectorAll('input[name="signature_mode"]');
    const canvasContainer = document.getElementById('canvasContainer');
    const manualSignNotice = document.getElementById('manualSignNotice');

    // Set tanggal ujian hari ini jika kosong
    const inputTgl = document.getElementById('tanggal_ujian');
    if (inputTgl && !inputTgl.value) {
        const today = new Date().toISOString().split('T')[0];
        inputTgl.value = today;
    }

    let pad1 = null;
    let pad2 = null;

    if (canvas1 && typeof SimpleSignaturePad !== 'undefined') {
        pad1 = new SimpleSignaturePad(canvas1, {
            onChange: (dataUrl) => {
                if (hiddenTtd1) hiddenTtd1.value = dataUrl;
                updatePreviewSignature();
            }
        });
        if (btnClear1) btnClear1.addEventListener('click', () => pad1.clear());
    }

    if (canvas2 && typeof SimpleSignaturePad !== 'undefined') {
        pad2 = new SimpleSignaturePad(canvas2, {
            onChange: (dataUrl) => {
                if (hiddenTtd2) hiddenTtd2.value = dataUrl;
                updatePreviewSignature();
            }
        });
        if (btnClear2) btnClear2.addEventListener('click', () => pad2.clear());
    }

    signatureModeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'digital') {
                if (canvasContainer) canvasContainer.style.display = 'block';
                if (manualSignNotice) manualSignNotice.style.display = 'none';
            } else {
                if (canvasContainer) canvasContainer.style.display = 'none';
                if (manualSignNotice) manualSignNotice.style.display = 'block';
            }
            updatePreviewSignature();
        });
    });

    // 2. Mobile Tabs Switcher
    const tabBtns = document.querySelectorAll('.mobile-tab-btn');
    const panelForm = document.getElementById('panelForm');
    const panelPreview = document.getElementById('panelPreview');

    if (window.innerWidth <= 1023 && panelPreview) {
        panelPreview.style.display = 'none';
        if (panelForm) panelForm.style.display = 'block';
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const tab = this.getAttribute('data-tab');
            if (tab === 'form') {
                if (panelForm) panelForm.style.display = 'block';
                if (panelPreview) panelPreview.style.display = 'none';
            } else {
                if (panelForm) panelForm.style.display = 'none';
                if (panelPreview) {
                    panelPreview.style.display = 'block';
                    updateLivePreview();
                }
            }
        });
    });

    // 3. Pilihan Kelas -> Auto-set Jumlah Peserta
    const classSelect = document.getElementById('class_id');
    const inputSeharusnya = document.getElementById('peserta_seharusnya');
    const inputHadir = document.getElementById('peserta_hadir');
    const inputTidakHadir = document.getElementById('peserta_tidak_hadir');
    const validationAlert = document.getElementById('pesertaValidationAlert');

    let teachersList = [];

    function initDynamicClasses() {
        if (!classSelect) return;
        fetch('/api/classes?t=' + Date.now())
            .then(res => res.json())
            .then(classes => {
                if (Array.isArray(classes) && classes.length) {
                    const prevVal = classSelect.value;
                    classSelect.innerHTML = '<option value="">-- Pilih Kelas Aktif --</option>';
                    classes.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.id;
                        opt.setAttribute('data-nama', c.nama_kelas);
                        opt.textContent = `${c.nama_kelas} (${c.program_keahlian || c.tingkat || ''})`;
                        classSelect.appendChild(opt);
                    });

                    if (prevVal && classes.some(c => String(c.id) === String(prevVal))) {
                        classSelect.value = prevVal;
                    } else if (classes.some(c => String(c.id) === '7')) {
                        classSelect.value = '7'; // Default ke XII DKV
                    } else {
                        classSelect.value = classes[0].id;
                    }

                    // Trigger initial class student load
                    triggerClassChange(classSelect.value);
                } else {
                    classSelect.innerHTML = '<option value="">-- Belum Ada Kelas Terdaftar --</option>';
                    triggerClassChange('');
                }
            })
            .catch(err => console.warn('Gagal memuat kelas dinamis berita acara:', err));
    }

    function triggerClassChange(classId) {
        if (!classSelect) return;
        const opt = classSelect.options[classSelect.selectedIndex];
        const inputNamaKelas = document.getElementById('nama_kelas');
        if (opt && opt.value) {
            if (inputNamaKelas) {
                inputNamaKelas.value = opt.getAttribute('data-nama') || opt.text.split('(')[0].trim();
            }
        }
        if (!classId) {
            updateLivePreview();
            return;
        }

        fetch('/api/get-students.php?class_id=' + encodeURIComponent(classId))
            .then(res => res.json())
            .then(res => {
                if (res.success && res.count !== undefined) {
                    if (inputSeharusnya) inputSeharusnya.value = res.count;
                    if (inputHadir) inputHadir.value = res.count;
                    if (inputTidakHadir) inputTidakHadir.value = 0;
                    validatePeserta();
                    updateLivePreview();
                    // Cek apakah ada arsip daftar hadir spesifik untuk tanggal dan mapel ini
                    syncAttendanceRekap();
                }
            })
            .catch(() => {});
    }

    if (classSelect) {
        classSelect.addEventListener('change', function() {
            triggerClassChange(this.value);
        });
    }

    // Sinkronisasi otomatis Rekap Kehadiran dari arsip Daftar Hadir berdasarkan Tanggal Ujian dan Mata Pelajaran
    function syncAttendanceRekap() {
        const inputTgl = document.getElementById('tanggal_ujian');
        const inputMapel = document.getElementById('mata_pelajaran');
        const inputNamaKelas = document.getElementById('nama_kelas');
        const noticeEl = document.getElementById('attendanceSyncNotice');

        const tglVal = inputTgl ? inputTgl.value : '';
        const mapelVal = inputMapel ? inputMapel.value.trim() : '';
        const classIdVal = classSelect ? classSelect.value : '';
        const classNameVal = inputNamaKelas ? inputNamaKelas.value.trim() : '';

        if (!tglVal && !mapelVal) return;

        const url = `/api/get-attendance-rekap?class_id=${encodeURIComponent(classIdVal)}&kelas=${encodeURIComponent(classNameVal)}&tanggal_ujian=${encodeURIComponent(tglVal)}&mata_pelajaran=${encodeURIComponent(mapelVal)}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.found && data.rekap) {
                    const r = data.rekap;
                    if (inputSeharusnya) inputSeharusnya.value = r.peserta_seharusnya;
                    if (inputHadir) inputHadir.value = r.peserta_hadir;
                    if (inputTidakHadir) inputTidakHadir.value = r.peserta_tidak_hadir;

                    // Sinkronkan kelas jika belum dipilih spesifik
                    if (r.nama_kelas && inputNamaKelas) {
                        inputNamaKelas.value = r.nama_kelas;
                        if (classSelect && r.class_id) {
                            for (let i = 0; i < classSelect.options.length; i++) {
                                if (String(classSelect.options[i].value) === String(r.class_id) || classSelect.options[i].text.includes(r.nama_kelas)) {
                                    classSelect.selectedIndex = i;
                                    break;
                                }
                            }
                        }
                    }

                    // Sinkronkan ruang jika tersedia
                    const elRuang = document.getElementById('ruang');
                    if (elRuang && r.ruang && (!elRuang.value.trim() || elRuang.value === 'Ruang 01')) {
                        elRuang.value = r.ruang;
                    }

                    // Sinkronkan nama dan NIP pengawas 1 jika belum diisi manual
                    const elP1 = document.getElementById('nama_pengawas_1');
                    const elNip1 = document.getElementById('nip_pengawas_1');
                    if (elP1 && !elP1.value.trim() && r.nama_pengawas_1) {
                        elP1.value = r.nama_pengawas_1;
                        if (elNip1 && r.nip_pengawas_1) elNip1.value = r.nip_pengawas_1;
                    }

                    if (noticeEl) {
                        noticeEl.style.display = 'block';
                        noticeEl.style.background = '#ECFDF5';
                        noticeEl.style.border = '1px solid #6EE7B7';
                        noticeEl.style.color = '#065F46';
                        noticeEl.innerHTML = `<i class="bi bi-check-circle-fill" style="color: #059669; margin-right: 6px;"></i><strong>Sinkronisasi Daftar Hadir Ditemukan:</strong> Rekap peserta terisi otomatis dari Daftar Hadir kelas <strong>${r.nama_kelas || classNameVal}</strong> (${r.peserta_seharusnya} siswa: <strong>${r.peserta_hadir} Hadir</strong>, <strong>${r.peserta_tidak_hadir} Tidak Hadir</strong>).`;
                    }

                    validatePeserta();
                    updateLivePreview();
                } else {
                    if (noticeEl) {
                        noticeEl.style.display = 'none';
                    }
                }
            })
            .catch(err => {
                console.warn('Gagal cek sinkronisasi daftar hadir:', err);
            });
    }

    // Hubungkan event tanggal dan mata pelajaran ke syncAttendanceRekap
    const inputTglUjian = document.getElementById('tanggal_ujian');
    const inputMapelUjian = document.getElementById('mata_pelajaran');
    const inputKelasUjian = document.getElementById('nama_kelas');

    if (inputTglUjian) {
        inputTglUjian.addEventListener('change', syncAttendanceRekap);
    }
    if (inputMapelUjian) {
        inputMapelUjian.addEventListener('change', syncAttendanceRekap);
        inputMapelUjian.addEventListener('blur', syncAttendanceRekap);
    }
    if (inputKelasUjian) {
        inputKelasUjian.addEventListener('change', syncAttendanceRekap);
    }

    function initDynamicTeachers() {
        fetch('/api/teachers?t=' + Date.now())
            .then(res => res.json())
            .then(teachers => {
                teachersList = teachers || [];
                const dl = document.getElementById('datalist_pengawas_ba');
                if (dl) {
                    dl.innerHTML = '';
                    teachersList.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.nama;
                        opt.setAttribute('data-nip', t.nip || '');
                        opt.label = `${t.nama} (NIP: ${t.nip || '-'})`;
                        dl.appendChild(opt);
                    });
                }
            })
            .catch(err => console.warn('Gagal memuat guru:', err));
    }

    function setupProctorAutocomplete(inputNamaId, inputNipId) {
        const elNama = document.getElementById(inputNamaId);
        const elNip = document.getElementById(inputNipId);
        if (!elNama || !elNip) return;

        function matchTeacher() {
            const val = elNama.value.trim().toLowerCase();
            if (!val) {
                updateLivePreview();
                return;
            }
            const match = teachersList.find(t => t.nama.toLowerCase() === val || t.nama.toLowerCase().includes(val));
            if (match && match.nip && (!elNip.value || elNip.value.trim() === '')) {
                elNip.value = match.nip;
            } else if (match && match.nama.toLowerCase() === val && match.nip) {
                elNip.value = match.nip;
            }
            updateLivePreview();
        }

        elNama.addEventListener('input', matchTeacher);
        elNama.addEventListener('change', matchTeacher);
    }

    function initDynamicSettings() {
        fetch('/api/subjects?t=' + Date.now())
            .then(res => res.json())
            .then(subjects => {
                const dl = document.getElementById('datalist_subjects_ba');
                if (dl && Array.isArray(subjects)) {
                    dl.innerHTML = '';
                    subjects.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s;
                        dl.appendChild(opt);
                    });
                }
            })
            .catch(() => {});

        fetch('/api/academic-years?t=' + Date.now())
            .then(res => res.json())
            .then(years => {
                const dl = document.getElementById('datalist_academic_years_ba');
                if (dl && Array.isArray(years)) {
                    dl.innerHTML = '';
                    years.forEach(y => {
                        const opt = document.createElement('option');
                        opt.value = y;
                        dl.appendChild(opt);
                    });
                }
            })
            .catch(() => {});

        fetch('/api/settings?t=' + Date.now())
            .then(res => res.json())
            .then(set => {
                if (set.school_name) window.SCHOOL_NAME = set.school_name;
                if (set.kop_header) {
                    const kopImgs = document.querySelectorAll('.kop-surat img');
                    kopImgs.forEach(img => {
                        img.src = set.kop_header + '?t=' + Date.now();
                    });
                }
                updateLivePreview();
            })
            .catch(() => {});
    }

    function initDynamicTemplates() {
        fetch('/api/templates?t=' + Date.now())
            .then(res => res.json())
            .then(tpls => {
                if (Array.isArray(tpls) && tpls.length) {
                    window.EXAM_TEMPLATES = tpls;
                    const select = document.getElementById('selectTemplate');
                    if (select) {
                        const curVal = select.value;
                        select.innerHTML = '';
                        tpls.forEach(t => {
                            const opt = document.createElement('option');
                            opt.value = t.id;
                            opt.setAttribute('data-nama', t.nama_ujian || '');
                            opt.setAttribute('data-tahun', t.tahun_ajaran || '');
                            opt.setAttribute('data-semester', t.semester || 'Ganjil');
                            opt.textContent = `${t.nama_ujian} (${t.tahun_ajaran || ''}) - ${t.semester || 'Ganjil'}`;
                            select.appendChild(opt);
                        });
                        if (curVal && tpls.some(t => String(t.id) === String(curVal))) {
                            select.value = curVal;
                        } else {
                            select.value = tpls[0].id;
                        }
                    }
                    updateLivePreview();
                }
            })
            .catch(() => {});
    }

    window.applyExamTemplate = function(tplId) {
        const templates = window.EXAM_TEMPLATES || [];
        const tpl = templates.find(t => String(t.id) === String(tplId)) || templates[0];
        if (tpl) {
            const elTplId = document.getElementById('template_id');
            const elNamaUjian = document.getElementById('nama_ujian');
            const elTahun = document.getElementById('tahun_ajaran');
            const elSemester = document.getElementById('semester');
            if (elTplId) elTplId.value = tpl.id;
            if (elNamaUjian) elNamaUjian.value = tpl.nama_ujian || '';
            if (elTahun) elTahun.value = tpl.tahun_ajaran || '';
            if (elSemester && tpl.semester) elSemester.value = tpl.semester;
            updateLivePreview();
            syncAttendanceRekap();
        }
    };

    function validatePeserta() {
        if (!inputSeharusnya || !inputHadir || !inputTidakHadir || !validationAlert) return true;
        const seh = parseInt(inputSeharusnya.value, 10) || 0;
        const had = parseInt(inputHadir.value, 10) || 0;
        const thad = parseInt(inputTidakHadir.value, 10) || 0;

        if (had + thad !== seh) {
            validationAlert.style.display = 'block';
            validationAlert.textContent = `Perhatian: Jumlah Hadir (${had}) + Tidak Hadir (${thad}) = ${had + thad}, tidak sama dengan Peserta Seharusnya (${seh}).`;
            return false;
        } else {
            validationAlert.style.display = 'none';
            return true;
        }
    }

    [inputSeharusnya, inputHadir, inputTidakHadir].forEach(el => {
        if (el) {
            el.addEventListener('input', () => {
                validatePeserta();
                updateLivePreview();
            });
        }
    });

    // 4. Sinkronisasi Live Preview A4
    const watchedInputs = [
        'selectTemplate', 'nama_ujian', 'tahun_ajaran', 'semester', 'tanggal_ujian', 'jam_mulai', 'jam_selesai',
        'mata_pelajaran', 'ruang', 'class_id', 'nama_kelas', 'catatan_pelaksanaan',
        'blangko_berita_acara', 'blangko_daftar_hadir',
        'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2'
    ];

    watchedInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateLivePreview);
            el.addEventListener('change', updateLivePreview);
        }
    });

    function updateLivePreview() {
        const templateId = document.getElementById('template_id')?.value;
        const templates = window.EXAM_TEMPLATES || [];
        let tpl = templates.find(t => String(t.id) === String(templateId)) || templates[0] || {};

        const namaUjian = document.getElementById('nama_ujian')?.value.trim() || tpl.nama_ujian || 'SUMATIF AKHIR SEMESTER';
        const tahunAjaran = document.getElementById('tahun_ajaran')?.value.trim() || tpl.tahun_ajaran || '2026/2027';
        const semester = document.getElementById('semester')?.value.trim() || tpl.semester || 'Ganjil';
        const mapel = document.getElementById('mata_pelajaran')?.value.trim() || '-';
        const ruang = document.getElementById('ruang')?.value.trim() || '-';
        const jamMulai = document.getElementById('jam_mulai')?.value || '07:30';
        const jamSelesai = document.getElementById('jam_selesai')?.value || '09:30';
        const tglStr = document.getElementById('tanggal_ujian')?.value || '';

        const seh = document.getElementById('peserta_seharusnya')?.value || '0';
        const thad = document.getElementById('peserta_tidak_hadir')?.value || '0';
        const had = document.getElementById('peserta_hadir')?.value || '0';

        const blangkoBa = document.getElementById('blangko_berita_acara')?.value || '1';
        const blangkoDh = document.getElementById('blangko_daftar_hadir')?.value || '1';
        const catatan = document.getElementById('catatan_pelaksanaan')?.value.trim() || 'Pelaksanaan ujian berjalan tertib, aman, dan lancar.';

        const namaP1 = document.getElementById('nama_pengawas_1')?.value.trim() || '';
        const nipP1 = document.getElementById('nip_pengawas_1')?.value.trim() || '';
        const namaP2 = document.getElementById('nama_pengawas_2')?.value.trim() || '';
        const nipP2 = document.getElementById('nip_pengawas_2')?.value.trim() || '';

        const sekolah = window.SCHOOL_NAME || 'SMK NEGERI FYJ CHANNEL';

        const tglParts = parseDateIndo(tglStr);
        const tglTeks = terbilang(tglParts.tanggal);
        const tahunTeks = terbilang(tglParts.tahun);

        const inputNamaKelas = document.getElementById('nama_kelas');
        let kelasVal = inputNamaKelas ? inputNamaKelas.value.trim() : '';
        if (!kelasVal && classSelect && classSelect.selectedIndex > 0) {
            const opt = classSelect.options[classSelect.selectedIndex];
            kelasVal = opt.getAttribute('data-nama') || opt.text.split('(')[0].trim();
        }
        if (!kelasVal) kelasVal = '-';

        const vars = {
            nama_ujian: namaUjian,
            tahun_ajaran: tahunAjaran,
            semester: semester,
            Semester: semester,
            SEMESTER: semester.toUpperCase(),
            hari: tglParts.hari,
            tanggal: tglParts.tanggal,
            tanggal_teks: tglTeks,
            tanggal_terbilang: tglTeks,
            bulan: tglParts.bulan,
            tahun: tglParts.tahun,
            tahun_teks: tahunTeks,
            tahun_terbilang: tahunTeks,
            jam_mulai: jamMulai,
            jam_selesai: jamSelesai,
            mata_pelajaran: mapel,
            ruang: ruang,
            kelas: kelasVal,
            Kelas: kelasVal,
            peserta_seharusnya: seh,
            peserta_hadir: had,
            peserta_tidak_hadir: thad,
            blangko_berita_acara: blangkoBa,
            blangko_daftar_hadir: blangkoDh,
            sekolah: sekolah,
            catatan_pelaksanaan: catatan,
            catatan: catatan
        };

        // Judul Dokumen
        const pvDocTitle = document.getElementById('pvDocTitle');
        if (pvDocTitle) {
            const rawTitle = tpl.judul_berita_acara || 'BERITA ACARA\nPENYELENGGARAAN [nama_ujian]\nTAHUN AJARAN [tahun_ajaran]';
            let titleText = rawTitle;
            for (const [k, v] of Object.entries(vars)) {
                titleText = titleText.replace(new RegExp('\\[' + k + '\\]', 'gi'), v);
            }
            pvDocTitle.innerHTML = titleText.replace(/\r\n|\r|\n/g, '<br>');
        }

        // Konten Berita Acara WYSIWYG
        const pvContent = document.getElementById('pvBeritaAcaraContent');
        if (pvContent) {
            let fullRedaksi = tpl.redaksi_isi || '';
            pvContent.innerHTML = renderWysiwygHtml(fullRedaksi, vars);
        }

        // TTD Pengawas Halaman 1
        const col1 = document.getElementById('pvColPengawas1');
        const col2 = document.getElementById('pvColPengawas2');
        const pvNama1 = document.getElementById('pvNamaPengawas1');
        const pvNip1 = document.getElementById('pvNipPengawas1');
        const pvNama2 = document.getElementById('pvNamaPengawas2');
        const pvNip2 = document.getElementById('pvNipPengawas2');

        if (pvNama1) {
            pvNama1.textContent = namaP1 ? namaP1 : '....................................';
        }
        if (pvNip1) {
            pvNip1.textContent = nipP1 ? 'NIP. ' + nipP1 : 'NIP. .........................';
        }

        if (namaP2 && namaP2.trim() !== '') {
            if (col2) col2.style.display = 'table-cell';
            if (col1) col1.style.marginLeft = '0';
            if (pvNama2) pvNama2.textContent = namaP2;
            if (pvNip2) pvNip2.textContent = nipP2 ? 'NIP. ' + nipP2 : 'NIP. .........................';
        } else {
            if (col2) col2.style.display = 'none';
            if (col1) col1.style.marginLeft = 'auto';
        }

        updatePreviewSignature();
        updatePage2Metadata(vars);
    }

    function renderWysiwygHtml(htmlTemplate, vars) {
        if (!htmlTemplate) return '';
        let result = htmlTemplate;
        for (const [k, v] of Object.entries(vars)) {
            const regex = new RegExp('\\[' + k + '\\]', 'gi');
            result = result.replace(regex, v);
        }
        return result;
    }

    function updatePreviewSignature() {
        const checkedRadio = document.querySelector('input[name="signature_mode"]:checked');
        const isDigital = checkedRadio ? checkedRadio.value === 'digital' : true;
        const imgP1 = document.getElementById('pvSignImg1');
        const imgP2 = document.getElementById('pvSignImg2');
        const imgP1_P2 = document.getElementById('pvSignImg1_Page2');
        const imgP2_P2 = document.getElementById('pvSignImg2_Page2');
        const namaP2 = document.getElementById('nama_pengawas_2')?.value.trim() || '';

        if (isDigital) {
            if (hiddenTtd1 && hiddenTtd1.value) {
                if (imgP1) { imgP1.src = hiddenTtd1.value; imgP1.style.display = 'block'; }
                if (imgP1_P2) { imgP1_P2.src = hiddenTtd1.value; imgP1_P2.style.display = 'block'; }
            } else {
                if (imgP1) imgP1.style.display = 'none';
                if (imgP1_P2) imgP1_P2.style.display = 'none';
            }

            if (namaP2 && hiddenTtd2 && hiddenTtd2.value) {
                if (imgP2) { imgP2.src = hiddenTtd2.value; imgP2.style.display = 'block'; }
                if (imgP2_P2) { imgP2_P2.src = hiddenTtd2.value; imgP2_P2.style.display = 'block'; }
            } else {
                if (imgP2) imgP2.style.display = 'none';
                if (imgP2_P2) imgP2_P2.style.display = 'none';
            }
        } else {
            if (imgP1) imgP1.style.display = 'none';
            if (imgP2) imgP2.style.display = 'none';
            if (imgP1_P2) imgP1_P2.style.display = 'none';
            if (imgP2_P2) imgP2_P2.style.display = 'none';
        }
    }

    function updatePage2Metadata(vars) {
        if (!vars) return;
        if (document.getElementById('pvLpNamaUjian')) document.getElementById('pvLpNamaUjian').textContent = (vars.nama_ujian || '-').toUpperCase();
        if (document.getElementById('pvLpMapel')) document.getElementById('pvLpMapel').textContent = vars.mata_pelajaran || '-';
        if (document.getElementById('pvLpKelas')) document.getElementById('pvLpKelas').textContent = vars.kelas || '-';
        if (document.getElementById('pvLpRuang')) document.getElementById('pvLpRuang').textContent = vars.ruang || '-';
        if (document.getElementById('pvLpTanggal')) document.getElementById('pvLpTanggal').textContent = `${vars.hari}, ${vars.tanggal} ${vars.bulan} ${vars.tahun}`;

        // TTD Page 2
        const namaP1 = document.getElementById('nama_pengawas_1')?.value.trim() || '';
        const nipP1 = document.getElementById('nip_pengawas_1')?.value.trim() || '';
        const namaP2 = document.getElementById('nama_pengawas_2')?.value.trim() || '';
        const nipP2 = document.getElementById('nip_pengawas_2')?.value.trim() || '';

        const col1_p2 = document.getElementById('pvColPengawas1_Page2');
        const col2_p2 = document.getElementById('pvColPengawas2_Page2');
        if (document.getElementById('pvNamaPengawas1_Page2')) {
            document.getElementById('pvNamaPengawas1_Page2').textContent = namaP1 ? namaP1 : '....................................';
        }
        if (document.getElementById('pvNipPengawas1_Page2')) {
            document.getElementById('pvNipPengawas1_Page2').textContent = nipP1 ? 'NIP. ' + nipP1 : 'NIP. .........................';
        }

        if (namaP2 && namaP2.trim() !== '') {
            if (col2_p2) col2_p2.style.display = 'table-cell';
            if (col1_p2) col1_p2.style.marginLeft = '0';
            if (document.getElementById('pvNamaPengawas2_Page2')) document.getElementById('pvNamaPengawas2_Page2').textContent = namaP2;
            if (document.getElementById('pvNipPengawas2_Page2')) document.getElementById('pvNipPengawas2_Page2').textContent = nipP2 ? 'NIP. ' + nipP2 : 'NIP. .........................';
        } else {
            if (col2_p2) col2_p2.style.display = 'none';
            if (col1_p2) col1_p2.style.marginLeft = 'auto';
        }
    }

    function terbilang(n) {
        n = Math.abs(parseInt(n, 10)) || 0;
        const huruf = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
        if (n < 12) return huruf[n];
        if (n < 20) return terbilang(n - 10) + " belas";
        if (n < 100) return terbilang(Math.floor(n / 10)) + " puluh" + (n % 10 !== 0 ? " " + terbilang(n % 10) : "");
        if (n < 200) return "seratus" + (n - 100 !== 0 ? " " + terbilang(n - 100) : "");
        if (n < 1000) return terbilang(Math.floor(n / 100)) + " ratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "");
        if (n < 2000) return "seribu" + (n - 1000 !== 0 ? " " + terbilang(n - 1000) : "");
        if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " ribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "");
        return String(n);
    }

    function parseDateIndo(dateStr) {
        if (!dateStr) return { hari: '.......', tanggal: '...', bulan: '.........', tahun: '20..' };
        const d = new Date(dateStr);
        const parts = dateStr.split('-');

        const hariArr = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const bulanArr = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        return {
            hari: hariArr[d.getDay()] || '',
            tanggal: parseInt(parts[2], 10) || '',
            bulan: bulanArr[parseInt(parts[1], 10)] || '',
            tahun: parts[0] || ''
        };
    }

    // 5. Penanganan Foto Bukti Kegiatan & Client-side Compression
    const inputFoto = document.getElementById('foto_kegiatan');
    const fotoPreviewBox = document.getElementById('fotoPreviewBox');
    const fotoThumbnailsList = document.getElementById('fotoThumbnailsList');
    const fotoCountEl = document.getElementById('fotoCount');
    const btnClearPhotos = document.getElementById('btnClearPhotos');
    const pvFotoGrid = document.getElementById('pvFotoGrid');
    const hiddenFotoBase64 = document.getElementById('fotoKegiatanBase64');

    let loadedPhotos = [];

    function compressImageFile(file, maxDimension = 1200, quality = 0.82) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    let w = img.width;
                    let h = img.height;
                    if (w > maxDimension || h > maxDimension) {
                        if (w > h) {
                            h = Math.round((h * maxDimension) / w);
                            w = maxDimension;
                        } else {
                            w = Math.round((w * maxDimension) / h);
                            h = maxDimension;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, w, h);
                    ctx.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve({
                        name: file.name,
                        dataUrl: dataUrl
                    });
                };
                img.onerror = function() {
                    resolve({ name: file.name, dataUrl: e.target.result });
                };
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    if (inputFoto) {
        inputFoto.addEventListener('change', async function() {
            const files = Array.from(this.files).slice(0, 4);
            if (files.length === 0) return;

            loadedPhotos = [];
            for (const file of files) {
                const compressed = await compressImageFile(file);
                if (compressed) loadedPhotos.push(compressed);
            }

            renderPhotoThumbnails();
            renderPhotoGridPreview();
        });
    }

    function renderPhotoThumbnails() {
        if (!fotoPreviewBox || !fotoThumbnailsList || !fotoCountEl) return;
        if (loadedPhotos.length === 0) {
            fotoPreviewBox.style.display = 'none';
            if (hiddenFotoBase64) hiddenFotoBase64.value = '';
            return;
        }

        fotoPreviewBox.style.display = 'block';
        fotoCountEl.textContent = loadedPhotos.length;
        if (hiddenFotoBase64) {
            hiddenFotoBase64.value = JSON.stringify(loadedPhotos.map(p => p.dataUrl));
        }

        let html = '';
        loadedPhotos.forEach((p, idx) => {
            html += `
                <div style="position:relative;border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;background:#fff;aspect-ratio:4/3;">
                    <img src="${p.dataUrl}" style="width:100%;height:100%;object-fit:cover;">
                    <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);color:#fff;font-size:0.65rem;text-align:center;padding:2px 0;">Foto ${idx+1}</div>
                </div>
            `;
        });
        fotoThumbnailsList.innerHTML = html;
    }

    function renderPhotoGridPreview() {
        if (!pvFotoGrid) return;
        if (loadedPhotos.length === 0) {
            pvFotoGrid.innerHTML = `
                <div style="border: 1px dashed #cbd5e1; border-radius: 6px; padding: 25px 15px; text-align: center; color: #64748b; font-size: 9pt; background: #f8fafc;">
                    <i class="bi bi-camera" style="font-size: 1.8rem; display: block; margin-bottom: 6px; opacity: 0.5;"></i>
                    Dokumentasi Foto 1<br>(Silakan unggah foto di formulir)
                </div>
                <div style="border: 1px dashed #cbd5e1; border-radius: 6px; padding: 25px 15px; text-align: center; color: #64748b; font-size: 9pt; background: #f8fafc;">
                    <i class="bi bi-camera" style="font-size: 1.8rem; display: block; margin-bottom: 6px; opacity: 0.5;"></i>
                    Dokumentasi Foto 2<br>(Opsional)
                </div>
            `;
            return;
        }

        let html = '';
        loadedPhotos.forEach((p, idx) => {
            html += `
                <div style="border: 1px solid #94a3b8; border-radius: 4px; overflow: hidden; background: #fff; text-align: center; padding: 4px;">
                    <img src="${p.dataUrl}" alt="Bukti Pelaksanaan ${idx+1}" style="width: 100%; height: 160px; object-fit: cover; display: block; border-radius: 2px;">
                    <div style="font-size: 8.5pt; font-family: 'Times New Roman', serif; margin-top: 4px; color: #000; font-weight: bold;">
                        Foto ${idx + 1}: Suasana Pelaksanaan Ujian
                    </div>
                </div>
            `;
        });
        pvFotoGrid.innerHTML = html;
    }

    if (btnClearPhotos) {
        btnClearPhotos.addEventListener('click', function() {
            loadedPhotos = [];
            if (inputFoto) inputFoto.value = '';
            renderPhotoThumbnails();
            renderPhotoGridPreview();
        });
    }

    // Scroll to page helper
    window.scrollToPreviewPage = function(pageNum) {
        const page = pageNum === 2 ? document.getElementById('a4Page2') : document.getElementById('a4Page');
        if (page) {
            page.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Zoom Fit
    let previewIsFit = false;
    window.togglePreviewFit = function() {
        const wrapper = document.getElementById('a4Wrapper');
        const container = document.getElementById('panelPreview');
        const btn = document.getElementById('btnZoomToggle');
        const page = document.getElementById('a4Page');
        if (!wrapper || !container) return;

        previewIsFit = !previewIsFit;
        if (previewIsFit) {
            const availWidth = container.clientWidth - 40;
            const naturalWidth = (page ? page.offsetWidth : 0) || 794;
            let scale = availWidth / naturalWidth;
            if (scale > 1) scale = 1;
            if (scale < 0.35) scale = 0.35;
            
            wrapper.style.zoom = scale.toFixed(3);
            if (!('zoom' in document.body.style)) {
                wrapper.style.transform = `scale(${scale.toFixed(3)})`;
                wrapper.style.transformOrigin = 'top center';
            }

            if (btn) {
                btn.innerHTML = '<i class="bi bi-zoom-out"></i> 100%';
                btn.style.background = '#4657D9';
                btn.style.color = '#ffffff';
            }
        } else {
            wrapper.style.zoom = '1';
            wrapper.style.transform = 'none';
            if (btn) {
                btn.innerHTML = '<i class="bi bi-aspect-ratio"></i> Pas Lebar';
                btn.style.background = 'rgba(255,255,255,0.15)';
                btn.style.color = '#ffffff';
            }
        }
    };

    // Penyimpanan Berkas Berita Acara ke Database & Tombol Unduh/Cetak
    function saveArchiveDocument(filename) {
        try {
            const a4Wrapper = document.getElementById('a4Wrapper');
            const htmlContent = a4Wrapper ? a4Wrapper.innerHTML : '';
            const kelas = document.getElementById('nama_kelas')?.value || '';
            const mapel = document.getElementById('mata_pelajaran')?.value || '';
            const tgl = document.getElementById('tanggal_ujian')?.value || '';
            const namaUjian = document.getElementById('nama_ujian')?.value || '';
            const tahunAjaran = document.getElementById('tahun_ajaran')?.value || '';
            const semester = document.getElementById('semester')?.value || 'Ganjil';
            const ruang = document.getElementById('ruang')?.value || '';
            const seh = parseInt(document.getElementById('peserta_seharusnya')?.value, 10) || 0;
            const had = parseInt(document.getElementById('peserta_hadir')?.value, 10) || 0;
            const thad = parseInt(document.getElementById('peserta_tidak_hadir')?.value, 10) || 0;
            const p1 = document.getElementById('nama_pengawas_1')?.value || '';
            const nip1 = document.getElementById('nip_pengawas_1')?.value || '';
            const p2 = document.getElementById('nama_pengawas_2')?.value || '';
            const nip2 = document.getElementById('nip_pengawas_2')?.value || '';
            const classId = classSelect ? classSelect.value : '';

            fetch('/api/save-archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'berita_acara',
                    title: `Berita Acara - ${namaUjian} (${kelas} - ${mapel})`,
                    filename: filename,
                    nama_ujian: namaUjian,
                    tahun_ajaran: tahunAjaran,
                    semester: semester,
                    tanggal_ujian: tgl,
                    mata_pelajaran: mapel,
                    nama_kelas: kelas,
                    class_id: classId,
                    ruang: ruang,
                    peserta_seharusnya: seh,
                    peserta_hadir: had,
                    peserta_tidak_hadir: thad,
                    nama_pengawas_1: p1,
                    nip_pengawas_1: nip1,
                    nama_pengawas_2: p2,
                    nip_pengawas_2: nip2,
                    html_content: htmlContent
                })
            })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    console.log('Arsip Berita Acara berhasil disimpan ke database:', res.archive.id);
                    if (typeof showToast === 'function') {
                        showToast('Dokumen Berita Acara berhasil diarsipkan ke database!', 'success');
                    }
                }
            })
            .catch(e => console.warn('Gagal menyimpan arsip Berita Acara:', e));
        } catch (e) {
            console.warn('Gagal memproses arsip Berita Acara:', e);
        }
    }

    // Tombol Unduh PDF & Cetak
    const btnDownloadPdf = document.getElementById('btnDownloadPdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', function() {
            const kelas = (document.getElementById('nama_kelas')?.value || 'Kelas').replace(/\s+/g, '_');
            const mapel = (document.getElementById('mata_pelajaran')?.value || 'Ujian').replace(/\s+/g, '_');
            const tgl = document.getElementById('tanggal_ujian')?.value || '2026-10-19';
            const filename = `BA-SAS_${kelas}-${mapel}-${tgl}.pdf`;

            saveArchiveDocument(filename);

            if (typeof window.downloadA4AsPdf === 'function') {
                window.downloadA4AsPdf('a4Wrapper', filename);
            } else {
                window.print();
            }
        });
    }

    const btnPrintNative = document.getElementById('btnPrintNative');
    if (btnPrintNative) {
        btnPrintNative.addEventListener('click', function() {
            const kelas = (document.getElementById('nama_kelas')?.value || 'Kelas').replace(/\s+/g, '_');
            const mapel = (document.getElementById('mata_pelajaran')?.value || 'Ujian').replace(/\s+/g, '_');
            const tgl = document.getElementById('tanggal_ujian')?.value || '2026-10-19';
            const filename = `BA-SAS_${kelas}-${mapel}-${tgl}.pdf`;

            saveArchiveDocument(filename);
            window.print();
        });
    }

    // Inisialisasi awal
    initDynamicClasses();
    initDynamicTeachers();
    initDynamicSettings();
    initDynamicTemplates();
    setupProctorAutocomplete('nama_pengawas_1', 'nip_pengawas_1');
    setupProctorAutocomplete('nama_pengawas_2', 'nip_pengawas_2');
    updateLivePreview();
});

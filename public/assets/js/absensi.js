/**
 * Logika Formulir & Live Preview Daftar Hadir
 * Generator Absensi dan Berita Acara Ujian - SMK NEGERI FYJ CHANNEL
 */

document.addEventListener('DOMContentLoaded', function() {
    // 1. Elemen Formulir
    const form = document.getElementById('formAbsensi');
    const classSelect = document.getElementById('class_id');
    const studentsContainer = document.getElementById('studentsContainer');
    const studentLoading = document.getElementById('studentLoading');
    const btnSetAllHadir = document.getElementById('btnSetAllHadir');
    const signatureModeRadios = document.querySelectorAll('input[name="signature_mode"]');
    const canvasContainer = document.getElementById('canvasContainer');
    const manualSignNotice = document.getElementById('manualSignNotice');
    
    // Set default tanggal hari ini jika kosong
    const inputTgl = document.getElementById('tanggal_ujian');
    if (inputTgl && !inputTgl.value) {
        const today = new Date().toISOString().split('T')[0];
        inputTgl.value = today;
    }

    // Tanda Tangan Canvas
    const canvas1 = document.getElementById('canvas_ttd_pengawas_1');
    const canvas2 = document.getElementById('canvas_ttd_pengawas_2');
    const hiddenTtd1 = document.getElementById('ttd_pengawas_1_data');
    const hiddenTtd2 = document.getElementById('ttd_pengawas_2_data');
    const btnClear1 = document.getElementById('btnClearTtd1');
    const btnClear2 = document.getElementById('btnClearTtd2');

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

    // Toggle Mode Tanda Tangan
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

    // 3. Ambil Siswa saat Kelas Dipilih
    let activeStudents = [];

    function loadStudentsForClass(classId) {
        if (!classId) {
            studentsContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Silakan pilih kelas ujian terlebih dahulu.</div>';
            activeStudents = [];
            updateStudentTablePreview([]);
            updateRekap();
            updateLivePreview();
            return;
        }

        if (studentLoading) studentLoading.style.display = 'block';
        studentsContainer.innerHTML = '';

        fetch('/api/get-students.php?class_id=' + encodeURIComponent(classId))
            .then(res => res.json())
            .then(res => {
                if (studentLoading) studentLoading.style.display = 'none';
                if (res.success && res.students) {
                    activeStudents = res.students;
                    renderStudentFormInputs(res.students);
                    updateStudentTablePreview(res.students);
                    updateRekap();
                    updateLivePreview();
                } else {
                    studentsContainer.innerHTML = `<div class="alert alert-danger">${res.message || 'Gagal memuat siswa.'}</div>`;
                }
            })
            .catch(err => {
                if (studentLoading) studentLoading.style.display = 'none';
                console.warn('API error, attempting local DB fetch:', err);
                studentsContainer.innerHTML = '<div class="alert alert-danger">Terjadi kesalahan koneksi saat memuat data siswa.</div>';
            });
    }

    // 3. Ambil Kelas Dinamis dari Server
    let teachersList = [];

    function initDynamicClasses() {
        if (!classSelect) return;
        fetch('/api/classes?t=' + Date.now())
            .then(res => res.json())
            .then(classes => {
                if (Array.isArray(classes) && classes.length) {
                    const prevVal = classSelect.value;
                    classSelect.innerHTML = '<option value="" selected>-- Pilih Kelas Ujian --</option>';
                    classes.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.id;
                        opt.textContent = `${c.nama_kelas} (${c.program_keahlian || c.tingkat || ''})`;
                        classSelect.appendChild(opt);
                    });

                    // Hanya pertahankan nilai jika sebelumnya pengguna sudah memilih kelas
                    if (prevVal && classes.some(c => String(c.id) === String(prevVal))) {
                        classSelect.value = prevVal;
                        loadStudentsForClass(classSelect.value);
                    } else {
                        classSelect.value = '';
                        loadStudentsForClass('');
                    }
                } else {
                    classSelect.innerHTML = '<option value="" selected>-- Belum Ada Kelas Terdaftar --</option>';
                    loadStudentsForClass('');
                }
            })
            .catch(err => {
                console.warn('Gagal memuat daftar kelas dinamis:', err);
            });
    }

    function initDynamicTeachers() {
        fetch('/api/teachers?t=' + Date.now())
            .then(res => res.json())
            .then(teachers => {
                teachersList = teachers || [];
                const dl = document.getElementById('datalist_pengawas');
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
            .catch(err => console.warn('Gagal memuat data guru:', err));
    }

    function setupProctorAutocomplete(inputNamaId, inputNipId) {
        const elNama = document.getElementById(inputNamaId);
        const elNip = document.getElementById(inputNipId);
        if (!elNama || !elNip) return;

        function matchTeacher() {
            const val = elNama.value.trim().toLowerCase();
            if (!val) return;
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
                const dl = document.getElementById('datalist_subjects');
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
                const dl = document.getElementById('datalist_academic_years');
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
                }
            })
            .catch(() => {});
    }

    window.applyExamTemplate = function(tplId) {
        const templates = window.EXAM_TEMPLATES || [];
        const tpl = templates.find(t => String(t.id) === String(tplId)) || templates[0];
        if (tpl) {
            const elNamaUjian = document.getElementById('nama_ujian');
            const elTahun = document.getElementById('tahun_ajaran');
            const elSemester = document.getElementById('semester');
            if (elNamaUjian) {
                elNamaUjian.value = tpl.nama_ujian || '';
                elNamaUjian.dispatchEvent(new Event('input'));
            }
            if (elTahun) {
                elTahun.value = tpl.tahun_ajaran || '';
                elTahun.dispatchEvent(new Event('input'));
            }
            if (elSemester && tpl.semester) {
                elSemester.value = tpl.semester;
                elSemester.dispatchEvent(new Event('change'));
            }
            updateLivePreview();
        }
    };

    if (classSelect) {
        classSelect.addEventListener('change', function() {
            loadStudentsForClass(this.value);
        });
    }

    initDynamicClasses();
    initDynamicTeachers();
    initDynamicSettings();
    initDynamicTemplates();
    setupProctorAutocomplete('nama_pengawas_1', 'nip_pengawas_1');
    setupProctorAutocomplete('nama_pengawas_2', 'nip_pengawas_2');

    // Render baris input kehadiran siswa di formulir
    function renderStudentFormInputs(students) {
        if (students.length === 0) {
            studentsContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Tidak ada siswa aktif di kelas ini.</div>';
            return;
        }

        let html = '<div class="table-responsive"><table class="table" style="font-size: 0.85rem;">';
        html += '<thead><tr><th style="width:30px;">No</th><th>Nama Siswa</th><th style="text-align:center;">Status Kehadiran</th></tr></thead><tbody>';

        students.forEach((s, idx) => {
            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td>
                        <strong>${escapeHtml(s.nama)}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${s.nis ? 'NIS: ' + escapeHtml(s.nis) : ''}</div>
                        <input type="hidden" name="students[${s.id}][id]" value="${s.id}">
                        <input type="hidden" name="students[${s.id}][nama]" value="${escapeHtml(s.nama)}">
                        <input type="hidden" name="students[${s.id}][nis]" value="${escapeHtml(s.nis || '')}">
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                        <select name="students[${s.id}][status]" class="form-select form-select-sm student-status-select" data-id="${s.id}" style="width: auto; display: inline-block;">
                            <option value="Hadir" selected>Hadir</option>
                            <option value="Dispensasi">Dispensasi</option>
                            <option value="Izin">Izin</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Tidak Hadir">Tidak Hadir (Alpa)</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        studentsContainer.innerHTML = html;

        // Pasang event change ke seluruh status select
        document.querySelectorAll('.student-status-select').forEach(select => {
            select.addEventListener('change', function() {
                updateStudentStatusInPreview(this.getAttribute('data-id'), this.value);
                updateRekap();
            });
        });
    }

    // Tombol Cepat: Set Semua Hadir
    if (btnSetAllHadir) {
        btnSetAllHadir.addEventListener('click', function() {
            document.querySelectorAll('.student-status-select').forEach(select => {
                select.value = 'Hadir';
            });
            activeStudents.forEach(s => {
                updateStudentStatusInPreview(s.id, 'Hadir');
            });
            updateRekap();
        });
    }

    // 4. Hitung Rekapitulasi Otomatis
    function updateRekap() {
        const statuses = {
            'Hadir': 0,
            'Dispensasi': 0,
            'Izin': 0,
            'Sakit': 0,
            'Tidak Hadir': 0
        };

        const selects = document.querySelectorAll('.student-status-select');
        selects.forEach(s => {
            if (statuses[s.value] !== undefined) {
                statuses[s.value]++;
            }
        });

        const total = selects.length;

        // Update di Form
        if (document.getElementById('rekapHadirForm')) document.getElementById('rekapHadirForm').textContent = statuses['Hadir'];
        if (document.getElementById('rekapDispensasiForm')) document.getElementById('rekapDispensasiForm').textContent = statuses['Dispensasi'];
        if (document.getElementById('rekapIzinForm')) document.getElementById('rekapIzinForm').textContent = statuses['Izin'];
        if (document.getElementById('rekapSakitForm')) document.getElementById('rekapSakitForm').textContent = statuses['Sakit'];
        if (document.getElementById('rekapTidakHadirForm')) document.getElementById('rekapTidakHadirForm').textContent = statuses['Tidak Hadir'];
        if (document.getElementById('rekapTotalForm')) document.getElementById('rekapTotalForm').textContent = total;

        // Update di Live Preview A4
        if (document.getElementById('pvRekapHadir')) document.getElementById('pvRekapHadir').textContent = statuses['Hadir'];
        if (document.getElementById('pvRekapDispensasi')) document.getElementById('pvRekapDispensasi').textContent = statuses['Dispensasi'];
        if (document.getElementById('pvRekapIzin')) document.getElementById('pvRekapIzin').textContent = statuses['Izin'];
        if (document.getElementById('pvRekapSakit')) document.getElementById('pvRekapSakit').textContent = statuses['Sakit'];
        if (document.getElementById('pvRekapTidakHadir')) document.getElementById('pvRekapTidakHadir').textContent = statuses['Tidak Hadir'];
        if (document.getElementById('pvRekapTotal')) document.getElementById('pvRekapTotal').textContent = total;
    }

    // 5. Sinkronisasi Live Preview A4
    const inputFields = [
        'nama_ujian', 'tahun_ajaran', 'semester', 'tanggal_ujian', 'mata_pelajaran',
        'sesi', 'ruang', 'jam_mulai', 'jam_selesai',
        'nama_pengawas_1', 'nip_pengawas_1', 'nama_pengawas_2', 'nip_pengawas_2'
    ];

    inputFields.forEach(f => {
        const el = document.getElementById(f);
        if (el) {
            el.addEventListener('input', updateLivePreview);
            el.addEventListener('change', updateLivePreview);
        }
    });

    function updateLivePreview() {
        const namaUjian = document.getElementById('nama_ujian')?.value.trim() || 'SUMATIF AKHIR SEMESTER';
        const tahunAjaran = document.getElementById('tahun_ajaran')?.value.trim() || '2026/2027';
        if (document.getElementById('pvNamaUjian')) document.getElementById('pvNamaUjian').textContent = namaUjian.toUpperCase();
        if (document.getElementById('pvTahunAjaran')) document.getElementById('pvTahunAjaran').textContent = tahunAjaran;

        const tglStr = document.getElementById('tanggal_ujian')?.value;
        if (document.getElementById('pvHariTanggal')) document.getElementById('pvHariTanggal').textContent = formatTanggalIndo(tglStr);
        if (document.getElementById('pvMataPelajaran')) document.getElementById('pvMataPelajaran').textContent = document.getElementById('mata_pelajaran')?.value || '-';
        if (document.getElementById('pvSesi')) document.getElementById('pvSesi').textContent = document.getElementById('sesi')?.value || '-';
        if (document.getElementById('pvRuang')) document.getElementById('pvRuang').textContent = document.getElementById('ruang')?.value || '-';
        
        const jamMulai = document.getElementById('jam_mulai')?.value;
        const jamSelesai = document.getElementById('jam_selesai')?.value;
        if (document.getElementById('pvWaktu')) document.getElementById('pvWaktu').textContent = (jamMulai && jamSelesai) ? `${jamMulai} - ${jamSelesai} WITA` : '-';

        const selectedClassOption = classSelect?.options[classSelect.selectedIndex];
        if (document.getElementById('pvKelas')) document.getElementById('pvKelas').textContent = (selectedClassOption && classSelect.value) ? selectedClassOption.text.split('(')[0].trim() : '-';

        const namaP1 = document.getElementById('nama_pengawas_1')?.value.trim();
        const nipP1 = document.getElementById('nip_pengawas_1')?.value.trim();
        if (document.getElementById('pvNamaPengawas1')) {
            document.getElementById('pvNamaPengawas1').textContent = namaP1 ? namaP1 : '....................................';
        }
        if (document.getElementById('pvNipPengawas1')) {
            document.getElementById('pvNipPengawas1').textContent = nipP1 ? 'NIP. ' + nipP1 : 'NIP. .........................';
        }

        const rawNamaP2 = document.getElementById('nama_pengawas_2')?.value.trim();
        const nipP2 = document.getElementById('nip_pengawas_2')?.value.trim();
        const col1 = document.getElementById('pvColPengawas1');
        const col2 = document.getElementById('pvColPengawas2');

        if (rawNamaP2 && rawNamaP2 !== '') {
            if (col2) col2.style.display = 'table-cell';
            if (col1) col1.style.marginLeft = '0';
            if (document.getElementById('pvNamaPengawas2')) document.getElementById('pvNamaPengawas2').textContent = rawNamaP2;
            if (document.getElementById('pvNipPengawas2')) document.getElementById('pvNipPengawas2').textContent = nipP2 ? 'NIP. ' + nipP2 : 'NIP. .........................';
        } else {
            if (col2) col2.style.display = 'none';
            if (col1) col1.style.marginLeft = 'auto';
        }

        updatePreviewSignature();
    }

    function updateStudentTablePreview(students) {
        const tbody = document.getElementById('pvStudentTbody');
        if (!tbody) return;

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 1.5rem; color:#666;">(Silakan pilih kelas ujian terlebih dahulu)</td></tr>';
            return;
        }

        let html = '';
        students.forEach((s, idx) => {
            html += `
                <tr id="pvStudentRow_${s.id}">
                    <td class="center" style="width: 35px; text-align: center;">${idx + 1}</td>
                    <td class="center" style="width: 85px; text-align: center;">${escapeHtml(s.nis || '-')}</td>
                    <td style="padding-left: 8px;">${escapeHtml(s.nama)}</td>
                    <td class="center" id="pvStatus_${s.id}" style="font-weight: 600; width: 100px; text-align: center;">Hadir</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    function updateStudentStatusInPreview(studentId, status) {
        const el = document.getElementById(`pvStatus_${studentId}`);
        if (el) {
            el.textContent = status;
            if (status === 'Tidak Hadir') {
                el.style.color = '#dc2626';
            } else if (status === 'Sakit' || status === 'Izin') {
                el.style.color = '#ca8a04';
            } else if (status === 'Dispensasi') {
                el.style.color = '#0284c7';
            } else {
                el.style.color = '#000000';
            }
        }
    }

    function updatePreviewSignature() {
        const checkedMode = document.querySelector('input[name="signature_mode"]:checked');
        const isDigital = checkedMode ? checkedMode.value === 'digital' : true;
        const imgP1 = document.getElementById('pvSignImg1');
        const imgP2 = document.getElementById('pvSignImg2');
        const rawNamaP2 = document.getElementById('nama_pengawas_2')?.value.trim();

        if (isDigital) {
            if (hiddenTtd1 && hiddenTtd1.value && imgP1) {
                imgP1.src = hiddenTtd1.value;
                imgP1.style.display = 'block';
            } else if (imgP1) {
                imgP1.style.display = 'none';
            }

            if (rawNamaP2 && hiddenTtd2 && hiddenTtd2.value && imgP2) {
                imgP2.src = hiddenTtd2.value;
                imgP2.style.display = 'block';
            } else if (imgP2) {
                imgP2.style.display = 'none';
            }
        } else {
            if (imgP1) imgP1.style.display = 'none';
            if (imgP2) imgP2.style.display = 'none';
        }
    }

    // Helper format tanggal Indonesia sederhana
    function formatTanggalIndo(dateStr) {
        if (!dateStr) return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;

        const d = new Date(dateStr);
        const hariArr = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const bulanArr = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        const hari = hariArr[d.getDay()] || '';
        const day = parseInt(parts[2], 10);
        const month = bulanArr[parseInt(parts[1], 10)] || '';
        const year = parts[0];

        return `${hari}, ${day} ${month} ${year}`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Fit / Zoom Pratinjau A4
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
                btn.title = 'Kembali ke ukuran 100%';
            }
        } else {
            wrapper.style.zoom = '1';
            wrapper.style.transform = 'none';
            if (btn) {
                btn.innerHTML = '<i class="bi bi-aspect-ratio"></i> Pas Lebar';
                btn.style.background = 'rgba(255,255,255,0.15)';
                btn.style.color = '#ffffff';
                btn.title = 'Sesuaikan lebar halaman dengan layar';
            }
        }
    };

    window.addEventListener('resize', function() {
        if (previewIsFit) {
            window.togglePreviewFit();
            previewIsFit = false;
            window.togglePreviewFit();
        }
    });

    // 6. Penyimpanan Arsip Dokumen & Tombol Unduh/Cetak
    function saveArchiveDocument(filename) {
        const selectedClassOpt = classSelect?.options[classSelect.selectedIndex];
        const className = selectedClassOpt ? selectedClassOpt.text.split('(')[0].trim() : 'Kelas';
        const mapel = document.getElementById('mata_pelajaran')?.value || 'Ujian';
        const tgl = document.getElementById('tanggal_ujian')?.value || '';
        const namaUjian = document.getElementById('nama_ujian')?.value || 'Sumatif Akhir Semester';
        const tahunAjaran = document.getElementById('tahun_ajaran')?.value || '2026/2027';
        const semester = document.getElementById('semester')?.value || 'Ganjil';
        const ruang = document.getElementById('ruang')?.value || '';

        let hadCount = 0;
        let thadCount = 0;
        const absentList = [];

        document.querySelectorAll('.student-status-select').forEach(sel => {
            const status = (sel.value || '').trim();
            const studentId = sel.getAttribute('data-id');
            const studentObj = Array.isArray(activeStudents) ? activeStudents.find(s => String(s.id) === String(studentId)) : null;
            const studentName = studentObj ? studentObj.nama : (document.querySelector(`input[name="students[${studentId}][nama]"]`)?.value || '');

            if (status === 'Hadir') {
                hadCount++;
            } else {
                thadCount++;
                let code = 'a';
                const sLower = status.toLowerCase();
                if (sLower === 'sakit' || sLower === 's') code = 's';
                else if (sLower === 'izin' || sLower === 'i') code = 'i';
                else if (sLower === 'dispensasi' || sLower === 'd') code = 'd';
                else code = 'a';

                if (studentName) {
                    absentList.push(`${studentName} (${code})`);
                }
            }
        });

        const totalStudents = hadCount + thadCount;
        const absentString = absentList.join(', ');

        const payload = {
            type: 'daftar_hadir',
            title: `Daftar Hadir ${className} - ${mapel}`,
            filename: filename,
            nama_ujian: namaUjian,
            tahun_ajaran: tahunAjaran,
            semester: semester,
            tanggal_ujian: tgl,
            mata_pelajaran: mapel,
            nama_kelas: className,
            class_id: classSelect ? classSelect.value : '',
            ruang: ruang,
            peserta_seharusnya: totalStudents,
            peserta_hadir: hadCount,
            peserta_tidak_hadir: thadCount,
            siswa_tidak_hadir: absentString,
            nama_pengawas_1: document.getElementById('nama_pengawas_1')?.value || '',
            nip_pengawas_1: document.getElementById('nip_pengawas_1')?.value || '',
            nama_pengawas_2: document.getElementById('nama_pengawas_2')?.value || '',
            nip_pengawas_2: document.getElementById('nip_pengawas_2')?.value || '',
            html_content: document.getElementById('a4Wrapper')?.innerHTML || ''
        };

        fetch('/api/save-archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                console.log('Arsip Daftar Hadir berhasil disimpan ke database:', res.archive.id);
                if (typeof showToast === 'function') {
                    showToast('Dokumen Daftar Hadir berhasil diarsipkan ke database!', 'success');
                }
            }
        })
        .catch(e => console.warn('Gagal menyimpan arsip:', e));
    }

    const btnDownloadPdf = document.getElementById('btnDownloadPdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', function() {
            const selectedClassOpt = classSelect?.options[classSelect.selectedIndex];
            const className = (selectedClassOpt ? selectedClassOpt.text.split('(')[0].trim() : 'Kelas').replace(/\s+/g, '_');
            const mapel = (document.getElementById('mata_pelajaran')?.value || 'Ujian').replace(/\s+/g, '_');
            const tgl = document.getElementById('tanggal_ujian')?.value || '2026-10-19';
            const filename = `DH-SAS_${className}-${mapel}-${tgl}.pdf`;

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
            const selectedClassOpt = classSelect?.options[classSelect.selectedIndex];
            const className = (selectedClassOpt ? selectedClassOpt.text.split('(')[0].trim() : 'Kelas').replace(/\s+/g, '_');
            const mapel = (document.getElementById('mata_pelajaran')?.value || 'Ujian').replace(/\s+/g, '_');
            const tgl = document.getElementById('tanggal_ujian')?.value || '2026-10-19';
            const filename = `DH-SAS_${className}-${mapel}-${tgl}.pdf`;

            saveArchiveDocument(filename);
            window.print();
        });
    }

    // Dengarkan sinyal penghapusan arsip antar-tab / jendela secara realtime
    window.addEventListener('storage', function(e) {
        if (e.key === 'sas_archive_deleted_signal') {
            document.querySelectorAll('.student-status-select').forEach(select => {
                select.value = 'Hadir';
                const id = select.getAttribute('data-id');
                if (id) updateStudentStatusInPreview(id, 'Hadir');
            });
            updateRekap();
            updateLivePreview();
        }
    });

    // Inisialisasi awal
    updateLivePreview();
});

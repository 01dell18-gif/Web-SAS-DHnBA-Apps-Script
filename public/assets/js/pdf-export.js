/**
 * PDF Export & Print Helper
 * Mendukung pencetakan native A4 maupun unduhan PDF instan langsung di browser
 */

window.printA4Document = function(elementId, title = 'Dokumen_Ujian') {
    const el = document.getElementById(elementId);
    if (!el) {
        if (typeof showAlertModal === 'function') {
            showAlertModal({ title: 'Gagal Mencetak', message: 'Elemen pratinjau tidak ditemukan.', type: 'danger' });
        } else {
            alert('Elemen pratinjau tidak ditemukan.');
        }
        return;
    }

    // Ubah title sementara untuk nama file cetak default di browser
    const oldTitle = document.title;
    document.title = title;

    window.print();

    // Kembalikan title semula
    setTimeout(() => {
        document.title = oldTitle;
    }, 1000);
};

window.downloadA4AsPdf = async function(wrapperId, filename = 'Dokumen.pdf') {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) {
        if (typeof showAlertModal === 'function') {
            showAlertModal({ title: 'Gagal Mengunduh', message: 'Pratinjau dokumen tidak ditemukan.', type: 'danger' });
        } else {
            alert('Pratinjau dokumen tidak ditemukan.');
        }
        return;
    }

    // Jika html2pdf tersedia
    if (typeof html2pdf !== 'undefined') {
        const toast = showToast('Sedang menyiapkan berkas PDF...', 'info');

        // 1. Buat wrapper pelindung yang tetap berada di (0,0) namun di lapisan paling belakang
        const wrapperEl = document.createElement('div');
        wrapperEl.style.position = 'fixed';
        wrapperEl.style.top = '0';
        wrapperEl.style.left = '0';
        wrapperEl.style.width = '100%';
        wrapperEl.style.height = '100%';
        wrapperEl.style.zIndex = '-99999';
        wrapperEl.style.overflow = 'hidden';
        wrapperEl.style.pointerEvents = 'none';

        // 2. Buat salinan DOM terisolasi agar ukuran pas A4 dan tidak memotong tabel
        const exportDiv = document.createElement('div');
        exportDiv.style.width = '190mm'; // 210mm - 20mm total margin
        exportDiv.style.background = '#ffffff';
        exportDiv.style.color = '#000000';
        exportDiv.style.fontFamily = "'Times New Roman', Times, serif";
        exportDiv.style.boxSizing = 'border-box';
        exportDiv.style.margin = '0 auto';
        exportDiv.innerHTML = wrapper.innerHTML;

        // Bersihkan style preview layar yang membatasi ukuran kertas
        exportDiv.querySelectorAll('.a4-page').forEach(page => {
            page.removeAttribute('style');
            page.style.width = '100%';
            page.style.minHeight = 'auto';
            page.style.padding = '0';
            page.style.margin = '0';
            page.style.boxShadow = 'none';
            page.style.border = 'none';
            page.style.background = '#ffffff';
            page.style.boxSizing = 'border-box';
        });

        // Sembunyikan pemisah halaman visual layar
        exportDiv.querySelectorAll('#pvPageSeparator').forEach(el => el.remove());

        // Pastikan Halaman 2 (Lampiran Foto Berita Acara) pecah halaman rapi
        const page2 = exportDiv.querySelector('#a4Page2');
        if (page2) {
            page2.style.pageBreakBefore = 'always';
            page2.style.breakBefore = 'page';
            page2.style.marginTop = '10mm';
        }

        // Pastikan tabel tidak memotong baris dan tidak melompat ke halaman 2
        exportDiv.querySelectorAll('table.attendance-table').forEach(tbl => {
            tbl.style.width = '100%';
            tbl.style.borderCollapse = 'collapse';
            tbl.style.pageBreakInside = 'auto';
        });
        exportDiv.querySelectorAll('table.attendance-table tr').forEach(tr => {
            tr.style.pageBreakInside = 'avoid';
            tr.style.breakInside = 'avoid';
        });

        // Pastikan kotak rekapitulasi dan tanda tangan tidak terbelah
        exportDiv.querySelectorAll('.rekap-box').forEach(box => {
            box.style.pageBreakInside = 'avoid';
            box.style.breakInside = 'avoid';
            box.style.marginTop = '14px';
        });
        exportDiv.querySelectorAll('.signature-section').forEach(sig => {
            sig.style.pageBreakInside = 'avoid';
            sig.style.breakInside = 'avoid';
            sig.style.marginTop = '18px';
        });

        wrapperEl.appendChild(exportDiv);
        document.body.appendChild(wrapperEl);

        // Tunggu seluruh gambar selesai dimuat sebelum capture canvas
        const imgs = Array.from(exportDiv.querySelectorAll('img'));
        await Promise.all(imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(r => { img.onload = r; img.onerror = r; });
        }));

        const opt = {
            margin: [10, 10, 10, 10], // Margin merata 10mm di setiap lembar A4
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                logging: false,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: {
                mode: ['css', 'legacy'], // Hindari 'avoid-all' agar tabel tidak terlempar ke halaman 2
                avoid: ['tr', '.rekap-box', '.signature-section', '.kop-surat']
            }
        };

        try {
            await html2pdf().set(opt).from(exportDiv).save();
            if (toast) toast.remove();
            showToast('PDF berhasil diunduh!', 'success');
        } catch (err) {
            console.error('HTML2PDF Error:', err);
            if (toast) toast.remove();
            window.printA4Document(wrapperId, filename.replace('.pdf', ''));
        } finally {
            if (wrapperEl && wrapperEl.parentNode) {
                wrapperEl.parentNode.removeChild(wrapperEl);
            }
        }
    } else {
        // Fallback langsung cetak dialog browser yang memiliki opsi "Save as PDF"
        window.printA4Document(wrapperId, filename.replace('.pdf', ''));
    }
};

function showToast(msg, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }

    const t = document.createElement('div');
    const bg = type === 'success' ? '#10B981' : (type === 'danger' ? '#EF4444' : '#4657D9');
    t.style.cssText = `background:${bg};color:#fff;padding:12px 20px;border-radius:10px;box-shadow:0 8px 20px rgba(0,0,0,0.2);font-size:0.9rem;display:flex;align-items:center;gap:8px;animation:fadeIn 0.25s ease;font-weight:600;`;
    t.innerHTML = `<i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-info-circle'}"></i> <span>${msg}</span>`;
    container.appendChild(t);

    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity 0.4s ease';
        setTimeout(() => t.remove(), 400);
    }, 4000);

    return t;
}

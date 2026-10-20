/**
 * PDF Export & Print Helper
 * Mendukung pencetakan native A4 maupun unduhan PDF instan langsung di browser
 */

window.printA4Document = function(elementId, title = 'Dokumen_Ujian') {
    const el = document.getElementById(elementId);
    if (!el) {
        alert('Elemen pratinjau tidak ditemukan.');
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
        alert('Pratinjau dokumen tidak ditemukan.');
        return;
    }

    // Jika html2pdf tersedia
    if (typeof html2pdf !== 'undefined') {
        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const toast = showToast('Sedang membuat file PDF...', 'info');
        try {
            await html2pdf().set(opt).from(wrapper).save();
            if (toast) toast.remove();
            showToast('PDF berhasil diunduh!', 'success');
        } catch (err) {
            console.error('HTML2PDF Error:', err);
            window.printA4Document(wrapperId, filename.replace('.pdf', ''));
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

/**
 * SISTEM POPUP MODAL & NOTIFIKASI UNIVERSAL (SAS v2.9)
 * SMK NEGERI 1 KLUNGKUNG
 * Mendukung Dialog Konfirmasi Interaktif, Alert Kustom & Notifikasi Toast
 */

(function(window) {
    function getOverlay() {
        let overlay = document.getElementById('sasGlobalPopupOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sasGlobalPopupOverlay';
            overlay.className = 'sas-popup-overlay';
            overlay.innerHTML = `
                <div class="sas-popup-card" id="sasPopupCard" role="dialog" aria-modal="true">
                    <div class="sas-popup-icon-wrapper" id="sasPopupIconWrap">
                        <i id="sasPopupIcon" class="bi bi-info-circle-fill"></i>
                    </div>
                    <h3 class="sas-popup-title" id="sasPopupTitle">Konfirmasi</h3>
                    <div class="sas-popup-message" id="sasPopupMessage">Pesan konfirmasi</div>
                    <div class="sas-popup-actions" id="sasPopupActions">
                        <button type="button" class="sas-popup-btn sas-popup-btn-cancel" id="sasPopupBtnCancel">
                            <i class="bi bi-x-lg"></i> Batal
                        </button>
                        <button type="button" class="sas-popup-btn sas-popup-btn-confirm-primary" id="sasPopupBtnConfirm">
                            <i class="bi bi-check-lg"></i> Lanjutkan
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    function getToastContainer() {
        let container = document.getElementById('sasToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sasToastContainer';
            container.className = 'sas-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Tampilkan Modal Konfirmasi Modern (Promise-based & Callback-based)
     * @param {Object|string} opts
     * @returns {Promise<boolean>}
     */
    function showConfirmModal(opts) {
        return new Promise((resolve) => {
            const options = typeof opts === 'string' ? { message: opts } : (opts || {});
            const title = options.title || 'Konfirmasi Tindakan';
            const message = options.message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?';
            const type = options.type || (message.toLowerCase().includes('hapus') || message.toLowerCase().includes('delete') || message.toLowerCase().includes('reset') ? 'danger' : 'warning');
            const confirmText = options.confirmText || (type === 'danger' ? 'Ya, Lanjutkan' : 'Ya, Setuju');
            const cancelText = options.cancelText || 'Batal';
            const confirmIcon = options.confirmIcon || (type === 'danger' ? 'bi-exclamation-octagon-fill' : 'bi-check-lg');

            const overlay = getOverlay();
            const iconWrap = document.getElementById('sasPopupIconWrap');
            const icon = document.getElementById('sasPopupIcon');
            const titleEl = document.getElementById('sasPopupTitle');
            const messageEl = document.getElementById('sasPopupMessage');
            const btnCancel = document.getElementById('sasPopupBtnCancel');
            const btnConfirm = document.getElementById('sasPopupBtnConfirm');

            iconWrap.className = 'sas-popup-icon-wrapper';
            if (type === 'danger') {
                iconWrap.classList.add('sas-popup-icon-danger');
                icon.className = 'bi bi-exclamation-triangle-fill';
                btnConfirm.className = 'sas-popup-btn sas-popup-btn-confirm-danger';
            } else if (type === 'success') {
                iconWrap.classList.add('sas-popup-icon-success');
                icon.className = 'bi bi-check-circle-fill';
                btnConfirm.className = 'sas-popup-btn sas-popup-btn-confirm-success';
            } else if (type === 'info') {
                iconWrap.classList.add('sas-popup-icon-info');
                icon.className = 'bi bi-info-circle-fill';
                btnConfirm.className = 'sas-popup-btn sas-popup-btn-confirm-primary';
            } else {
                iconWrap.classList.add('sas-popup-icon-warning');
                icon.className = 'bi bi-question-circle-fill';
                btnConfirm.className = 'sas-popup-btn sas-popup-btn-confirm-warning';
            }

            titleEl.textContent = title;
            messageEl.textContent = message;

            btnCancel.style.display = 'inline-flex';
            btnCancel.innerHTML = `<i class="bi bi-x-lg"></i> ${cancelText}`;
            btnConfirm.innerHTML = `<i class="bi ${confirmIcon}"></i> ${confirmText}`;

            function close(result) {
                overlay.classList.remove('active');
                cleanup();
                if (result && typeof options.onConfirm === 'function') options.onConfirm();
                if (!result && typeof options.onCancel === 'function') options.onCancel();
                resolve(result);
            }

            function onKeydown(e) {
                if (e.key === 'Escape') close(false);
                if (e.key === 'Enter') {
                    e.preventDefault();
                    close(true);
                }
            }

            function onOverlayClick(e) {
                if (e.target === overlay) close(false);
            }

            function cleanup() {
                btnCancel.removeEventListener('click', handleCancel);
                btnConfirm.removeEventListener('click', handleConfirm);
                document.removeEventListener('keydown', onKeydown);
                overlay.removeEventListener('click', onOverlayClick);
            }

            function handleCancel() { close(false); }
            function handleConfirm() { close(true); }

            btnCancel.addEventListener('click', handleCancel);
            btnConfirm.addEventListener('click', handleConfirm);
            document.addEventListener('keydown', onKeydown);
            overlay.addEventListener('click', onOverlayClick);

            overlay.classList.add('active');
            btnConfirm.focus();
        });
    }

    /**
     * Tampilkan Modal Alert / Peringatan Modern
     * @param {Object|string} opts
     * @returns {Promise<void>}
     */
    function showAlertModal(opts) {
        return new Promise((resolve) => {
            const options = typeof opts === 'string' ? { message: opts } : (opts || {});
            const title = options.title || 'Informasi';
            const message = options.message || '';
            const type = options.type || 'info';
            const confirmText = options.confirmText || 'Mengerti';

            const overlay = getOverlay();
            const iconWrap = document.getElementById('sasPopupIconWrap');
            const icon = document.getElementById('sasPopupIcon');
            const titleEl = document.getElementById('sasPopupTitle');
            const messageEl = document.getElementById('sasPopupMessage');
            const btnCancel = document.getElementById('sasPopupBtnCancel');
            const btnConfirm = document.getElementById('sasPopupBtnConfirm');

            iconWrap.className = 'sas-popup-icon-wrapper';
            if (type === 'danger') {
                iconWrap.classList.add('sas-popup-icon-danger');
                icon.className = 'bi bi-x-circle-fill';
                btnConfirm.className = 'sas-popup-btn sas-popup-btn-confirm-danger';
            } else if (type === 'success') {
                iconWrap.classList.add('sas-popup-icon-success');
                icon.className = 'bi bi-check-circle-fill';
                btnConfirm.className = 'sas-popup-btn sas-popup-btn-confirm-success';
            } else if (type === 'warning') {
                iconWrap.classList.add('sas-popup-icon-warning');
                icon.className = 'bi bi-exclamation-triangle-fill';
                btnConfirm.className = 'sas-popup-btn sas-popup-btn-confirm-warning';
            } else {
                iconWrap.classList.add('sas-popup-icon-info');
                icon.className = 'bi bi-info-circle-fill';
                btnConfirm.className = 'sas-popup-btn sas-popup-btn-confirm-primary';
            }

            titleEl.textContent = title;
            messageEl.textContent = message;

            btnCancel.style.display = 'none';
            btnConfirm.innerHTML = `<i class="bi bi-check-lg"></i> ${confirmText}`;

            function close() {
                overlay.classList.remove('active');
                cleanup();
                if (typeof options.onConfirm === 'function') options.onConfirm();
                resolve();
            }

            function onKeydown(e) {
                if (e.key === 'Escape' || e.key === 'Enter') {
                    e.preventDefault();
                    close();
                }
            }

            function onOverlayClick(e) {
                if (e.target === overlay) close();
            }

            function cleanup() {
                btnConfirm.removeEventListener('click', close);
                document.removeEventListener('keydown', onKeydown);
                overlay.removeEventListener('click', onOverlayClick);
            }

            btnConfirm.addEventListener('click', close);
            document.addEventListener('keydown', onKeydown);
            overlay.addEventListener('click', onOverlayClick);

            overlay.classList.add('active');
            btnConfirm.focus();
        });
    }

    /**
     * Tampilkan Notifikasi Toast Mengambang
     * @param {string} message
     * @param {'info'|'success'|'warning'|'danger'} type
     */
    function showToast(message, type = 'info') {
        const container = getToastContainer();
        const toast = document.createElement('div');
        toast.className = `sas-toast-item toast-${type}`;

        let iconClass = 'bi-info-circle-fill';
        if (type === 'success') iconClass = 'bi-check-circle-fill';
        else if (type === 'danger') iconClass = 'bi-x-circle-fill';
        else if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';

        toast.innerHTML = `
            <i class="bi ${iconClass} sas-toast-icon"></i>
            <div style="flex: 1; line-height: 1.4;">${message}</div>
            <button type="button" style="background:none; border:none; color:inherit; opacity:0.6; cursor:pointer; font-size:1.1rem; padding:0 0 0 6px;" aria-label="Tutup">&times;</button>
            <div class="sas-toast-progress"></div>
        `;

        const btnClose = toast.querySelector('button');
        if (btnClose) {
            btnClose.onclick = () => dismiss();
        }

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        let timer = setTimeout(dismiss, 3500);

        function dismiss() {
            clearTimeout(timer);
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentElement) toast.parentElement.removeChild(toast);
            }, 300);
        }
    }

    // Expose ke global window
    window.showConfirmModal = showConfirmModal;
    window.showAlertModal = showAlertModal;
    window.showPopupConfirm = showConfirmModal;
    window.showPopupAlert = showAlertModal;
    window.showToast = showToast;
    window.showNotification = showToast;

})(window);

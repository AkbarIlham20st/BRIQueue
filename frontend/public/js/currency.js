document.addEventListener('DOMContentLoaded', () => {
    // Pastikan skrip hanya berjalan di halaman '/admin/currency'
    if (!window.location.pathname.includes('/admin/currency')) return;

    // === Mengambil Elemen dari Halaman ===
    const currencyListBody = document.getElementById('currency-list');
    const addForm = document.getElementById('add-currency-form');
    const toast = document.getElementById('toast-notification');
    const modal = document.getElementById('currency-modal');
    const modalTitle = document.getElementById('modal-title');
    const currencyForm = document.getElementById('currency-form');
    const addRateBtn = document.getElementById('add-rate-btn');
    const closeBtn = document.querySelector('.close-button');
    const currencyIdInput = document.getElementById('currency-id');

    // =======================================================
    // == FUNGSI-FUNGSI PENDUKUNG (HELPERS) ==
    // =======================================================

    /**
     * Mengirim request ke API dengan menyertakan cookie sesi (credentials).
     * @param {string} url - URL API tujuan.
     * @param {object} options - Opsi untuk fetch (method, body, dll).
     * @returns {Promise<Response>}
     */
    const fetchWithAuth = async (url, options = {}) => {
        const defaultOptions = { 
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...options.headers },
        };
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (response.status === 401) {
            window.location.href = '/admin/login'; // Paksa login jika sesi habis
            throw new Error('Unauthorized');
        }
        return response;
    };

    /**
     * Menampilkan notifikasi singkat (toast) di layar.
     * @param {string} message - Pesan yang akan ditampilkan.
     * @param {string} type - 'success' (hijau) atau 'error' (merah).
     */
    const showToast = (message, type = 'success') => {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    };

    // Fungsi untuk membuka dan menutup modal form
    const openModal = () => modal.style.display = 'flex';
    const closeModal = () => modal.style.display = 'none';

    // =======================================================
    // == FUNGSI UTAMA (MEMUAT, MENAMBAH, MENGEDIT, MENGHAPUS) ==
    // =======================================================

    /**
     * Mengambil data kurs dari backend dan menampilkannya di tabel.
     */
    const loadRates = async () => {
        try {
            const response = await fetchWithAuth(`${window.API_BASE_URL}/api/currency`);
            if (!response.ok) throw new Error('Gagal memuat data.');
            const rates = await response.json();
            
            currencyListBody.innerHTML = ''; // Kosongkan tabel sebelum diisi
            rates.forEach(rate => {
                const tr = document.createElement('tr');
                // Simpan data di atribut 'data-' untuk akses mudah nanti
                tr.innerHTML = `
                    <td>
                        <img src="https://flagcdn.com/w20/${rate.currency_code.slice(0, 2).toLowerCase()}.png" alt="${rate.currency_code}" style="margin-right: 8px; vertical-align: middle;">
                        <strong>${rate.currency_code}</strong>
                    </td>
                    <td>${new Intl.NumberFormat('id-ID').format(rate.buy_rate)}</td>
                    <td>${new Intl.NumberFormat('id-ID').format(rate.sell_rate)}</td>
                    <td>
                        <button class="btn-icon btn-edit" data-id="${rate.id}" data-code="${rate.currency_code}" data-buy="${rate.buy_rate}" data-sell="${rate.sell_rate}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" data-id="${rate.id}" title="Hapus">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                currencyListBody.appendChild(tr);
            });
        } catch (error) {
            if (error.message !== 'Unauthorized') showToast(error.message, 'error');
        }
    };

    // =======================================================
    // == EVENT LISTENERS (MENANGANI INTERAKSI PENGGUNA) ==
    // =======================================================

    // Saat tombol "Tambah Kurs Baru" diklik
    addRateBtn.addEventListener('click', () => {
        currencyForm.reset();
        currencyIdInput.value = '';
        modalTitle.textContent = 'Tambah Kurs Baru';
        document.getElementById('currency-code').disabled = false;
        openModal();
    });

    // Menangani semua klik di dalam tabel (untuk tombol edit dan hapus)
    currencyListBody.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return; // Abaikan jika yang diklik bukan tombol

        const id = button.dataset.id;
        
        // Jika tombol EDIT diklik
        if (button.classList.contains('btn-edit')) {
            modalTitle.textContent = 'Edit Kurs';
            currencyIdInput.value = id;
            document.getElementById('currency-code').value = button.dataset.code;
            document.getElementById('currency-code').disabled = true; // Kode tidak bisa diubah
            document.getElementById('currency-buy').value = button.dataset.buy;
            document.getElementById('currency-sell').value = button.dataset.sell;
            openModal();
        } 
        // Jika tombol HAPUS diklik
        else if (button.classList.contains('btn-delete')) {
            if (confirm('Anda yakin ingin menghapus kurs ini?')) {
                try {
                    await fetchWithAuth(`${window.API_BASE_URL}/api/currency/${id}`, { method: 'DELETE' });
                    showToast('Kurs berhasil dihapus.');
                    loadRates(); // Muat ulang daftar setelah berhasil
                } catch (error) {
                    if (error.message !== 'Unauthorized') showToast('Gagal menghapus kurs.', 'error');
                }
            }
        }
    });

    // Saat form di dalam modal di-submit (bisa untuk Tambah atau Edit)
    currencyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = currencyIdInput.value;
        const isEditing = !!id;

        const data = {
            currency_code: document.getElementById('currency-code').value,
            buy_rate: document.getElementById('currency-buy').value,
            sell_rate: document.getElementById('currency-sell').value,
        };

        const url = isEditing ? `${window.API_BASE_URL}/api/currency/${id}` : `${window.API_BASE_URL}/api/currency`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetchWithAuth(url, { method, body: JSON.stringify(data) });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message);
            }
            showToast(`Kurs berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}.`);
            closeModal();
            loadRates();
        } catch (error) {
            if (error.message !== 'Unauthorized') showToast(error.message, 'error');
        }
    });

    // Event listener untuk menutup modal
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(); // Hanya tutup jika klik di area luar modal
    });

    // --- INISIALISASI ---
    loadRates(); // Muat data kurs saat halaman pertama kali dibuka
});
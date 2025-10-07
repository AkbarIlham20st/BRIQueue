// Menunggu hingga seluruh struktur halaman (DOM) selesai dimuat oleh browser.
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    /*
    |--------------------------------------------------------------------------
    | BAGIAN BERSAMA (SHARED SCOPE)
    |--------------------------------------------------------------------------
    | Fungsi dan variabel di sini dapat diakses oleh semua halaman admin.
    | Ini menghindari pengulangan kode.
    */

    /**
     * Fungsi pembungkus (wrapper) untuk fetch yang sudah dilengkapi autentikasi.
     * @param {string} url - URL API tujuan.
     * @param {object} options - Opsi tambahan untuk fetch (method, body, dll).
     * @returns {Promise<Response>} - Object Response dari fetch.
     */

        // Mengambil elemen yang ada di semua halaman admin
    const logoutButton = document.querySelector('a[href="/admin/logout"]');
    
    async function fetchWithAuth(url, options = {}) {
        const defaultOptions = { credentials: 'include' };
        const response = await fetch(url, { ...defaultOptions, ...options });

        if (response.status === 401) { // Jika sesi tidak valid/habis.
            window.location.href = '/admin/login'; // Paksa kembali ke halaman login.
            throw new Error('Unauthorized');
        }
        return response;
    }

    /**
     * Fungsi untuk menangani proses logout.
     * @param {Event} e - Event object dari klik.
     */
    async function handleLogout(e) {
        e.preventDefault();
        
        // Hentikan interval jika ada (khusus untuk dashboard).
        // Kita simpan interval di object `window` agar bisa diakses dari sini.
        if (window.dataFetchInterval) {
            clearInterval(window.dataFetchInterval);
        }

        try {
            // Gunakan window.API_BASE_URL jika sudah didefinisikan
            const baseUrl = window.API_BASE_URL || '';
            await fetchWithAuth(`${baseUrl}/api/admin/logout`, { method: 'POST' });
            window.location.href = '/admin/login';
        } catch (error) {
            if (error.message !== 'Unauthorized') console.error('Gagal saat logout:', error);
        }
    }

    // Pasang event listener untuk tombol logout jika ada di halaman.
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }


    /*
    |--------------------------------------------------------------------------
    | BAGIAN SPESIFIK HALAMAN (PAGE-SPECIFIC LOGIC)
    |--------------------------------------------------------------------------
    | Kode di dalam blok 'if' hanya akan berjalan di halaman yang sesuai.
    */

    // 1. Logika khusus untuk Halaman Login
    if (path.includes('/admin/login')) {
        const loginForm = document.getElementById('login-form');
        const errorMessage = document.getElementById('error-message');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                errorMessage.textContent = '';
                const formData = new FormData(loginForm);
                const data = Object.fromEntries(formData.entries());

                try {
                    const response = await fetch('http://localhost:3001/api/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                        credentials: 'include'
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    window.location.href = '/admin/dashboard';
                } catch (error) {
                    errorMessage.textContent = error.message;
                }
            });
        }
    }

    // 2. Logika khusus untuk Halaman Dashboard
    if (path.includes('/admin/dashboard')) {
        const totalQueuesEl = document.getElementById('total-queues');
        const currentQueueEl = document.getElementById('current-queue');
        const remainingQueuesEl = document.getElementById('remaining-queues');

        async function fetchDashboardData() {
            try {
                const response = await fetchWithAuth('http://localhost:3001/api/queues/stats');
                const data = await response.json();
                totalQueuesEl.textContent = data.total;
                currentQueueEl.textContent = data.current;
                remainingQueuesEl.textContent = data.remaining;
            } catch (error) {
                if (error.message !== 'Unauthorized') console.error('Gagal mengambil data dashboard:', error);
            }
        }

        fetchDashboardData();
        // Simpan ID interval ke object `window` agar bisa diakses oleh fungsi `handleLogout`.
        window.dataFetchInterval = setInterval(fetchDashboardData, 5000);
    }

    // 3. Logika khusus untuk Halaman Kelola Antrian
    if (path.includes('/admin/queues')) {
        const resetBtn = document.getElementById('reset-queues-btn');

        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                if (!confirm('Apakah Anda benar-benar yakin ingin mereset semua antrian?')) return;
                try {
                    const response = await fetchWithAuth('http://localhost:3001/api/queues/reset', { method: 'POST' });
                    if (!response.ok) throw new Error('Gagal mereset antrian.');
                    const result = await response.json();
                    alert(result.message || 'Antrian berhasil direset!');
                } catch (error) {
                    if (error.message !== 'Unauthorized') alert(error.message);
                }
            });
        }
    }
});
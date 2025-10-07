document.addEventListener('DOMContentLoaded', () => {
    // Ambil elemen dari halaman
    const tellerNameEl = document.getElementById('teller-name');
    const currentQueueNumberEl = document.getElementById('current-queue-number');
    const callNextBtn = document.getElementById('call-next-btn');
    const completeBtn = document.getElementById('complete-btn');
    const recallBtn = document.getElementById('recall-btn');
    const errorMsgEl = document.getElementById('error-message');

    // Variabel untuk menyimpan state
    let tellerInfo = null;
    let currentQueue = null;

    // Fungsi fetch dengan penanganan error dasar
    async function fetchApi(url, options = {}) {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Terjadi kesalahan');
        }
        return response.json();
    }

    // 1. Identifikasi teller saat halaman dimuat
    const identify = async () => {
        try {
            tellerInfo = await fetchApi('http://192.168.1.73:3001/api/teller/identify'); // IP WAJIB DI SESUAIKAN LAPTOP SERVER
            tellerNameEl.textContent = `Selamat Datang, ${tellerInfo.name}`;
            callNextBtn.disabled = false; // Aktifkan tombol panggil
            fetchCurrentState();
            setInterval(fetchCurrentState, 5000); // Cek status setiap 5 detik
        } catch (error) {
            tellerNameEl.textContent = 'Akses Ditolak';
            errorMsgEl.textContent = error.message;
        }
    };

    // 2. Ambil status antrian saat ini
    const fetchCurrentState = async () => {
        if (!tellerInfo) return;
        try {
            currentQueue = await fetchApi(`http://192.168.1.73:3001/api/teller/${tellerInfo.id}/current-queue`);
            updateUI();
        } catch (error) {
            console.error("Gagal fetch status:", error);
        }
    };

    // 3. Perbarui tampilan (UI)
    const updateUI = () => {
        if (currentQueue) {
            currentQueueNumberEl.textContent = currentQueue.queue_number;
            callNextBtn.disabled = true;
            completeBtn.disabled = false;
            recallBtn.disabled = false;
        } else {
            currentQueueNumberEl.textContent = '--';
            callNextBtn.disabled = false;
            completeBtn.disabled = true;
            recallBtn.disabled = true;
        }
    };

    // Event Listeners untuk Tombol Aksi
    callNextBtn.addEventListener('click', async () => {
        try {
            const newQueue = await fetchApi('http://192.168.1.73:3001/api/queues/call-next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teller_id: tellerInfo.id })
            });
            currentQueue = newQueue;
            updateUI();
        } catch (error) {
            alert(error.message);
        }
    });

    completeBtn.addEventListener('click', async () => {
        if (!currentQueue) return;
        try {
            await fetchApi(`http://192.168.1.73:3001/api/queues/${currentQueue.id}/complete`, {
                method: 'PUT'
            });
            currentQueue = null;
            updateUI();
        } catch (error) {
            alert(error.message);
        }
    });

    // Panggil fungsi identifikasi saat halaman siap
    identify();
});
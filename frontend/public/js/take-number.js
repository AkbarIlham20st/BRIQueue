document.addEventListener('DOMContentLoaded', () => {
    const takeNumberBtn = document.getElementById('take-number-btn');
    const modal = document.getElementById('ticket-modal');
    const closeBtn = document.querySelector('.close-button');
    const queueNumberDisplay = document.getElementById('queue-number-display');

    takeNumberBtn.addEventListener('click', async () => {
        try {
            // Menonaktifkan tombol sementara untuk mencegah klik ganda
            takeNumberBtn.disabled = true;
            takeNumberBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

            // Menggunakan variabel global API_BASE_URL yang disuntikkan dari EJS
            const response = await fetch(`${window.API_BASE_URL}/api/queues/create`, {
                method: 'POST'
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengambil nomor antrian. Silakan coba lagi.');
            }

            const newQueue = await response.json();

            // Tampilkan nomor di modal
            queueNumberDisplay.textContent = newQueue.queue_number;
            modal.style.display = 'flex';

        } catch (error) {
            alert(error.message);
        } finally {
            // Mengaktifkan kembali tombol setelah proses selesai
            takeNumberBtn.disabled = false;
            takeNumberBtn.innerHTML = '<i class="fas fa-ticket-alt"></i> Ambil Nomor';
        }
    });

    // Fungsi untuk menutup modal
    const closeModal = () => {
        modal.style.display = 'none';
    };

    closeBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });
});
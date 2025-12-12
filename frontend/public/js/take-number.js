// frontend/public/js/take-number.js

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('ticket-modal');
    const closeBtn = document.querySelector('.close-button');
    const queueNumberDisplay = document.getElementById('queue-number-display');
    const modalInfo = document.querySelector('.modal-info');

    // Fungsi global agar bisa dipanggil dari HTML onclick="..."
    window.ambilAntrian = async (serviceType) => {
        // Ambil elemen tombol yang diklik (untuk efek loading)
        const btnClass = serviceType === 'teller' ? '.btn-teller' : '.btn-cs';
        const btn = document.querySelector(btnClass);
        const originalContent = btn.innerHTML;

        try {
            // Ubah tombol jadi loading
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin fa-2x"></i><br><span>Memproses...</span>';

            // Kirim data tipe layanan ke backend
            const response = await fetch(`${window.API_BASE_URL}/api/queues/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: serviceType }) // Kirim 'teller' atau 'cs'
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil nomor antrian.');
            }

            const newQueue = await response.json();

            // Tampilkan nomor di modal
            queueNumberDisplay.textContent = newQueue.queue_number;
            
            // Ubah info modal sesuai tipe
            const serviceName = serviceType === 'teller' ? 'Teller' : 'Customer Service';
            modalInfo.textContent = `Silakan menuju ruang tunggu ${serviceName}.`;
            
            modal.style.display = 'flex';

        } catch (error) {
            alert(error.message);
        } finally {
            // Kembalikan tombol ke semula
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    };

    // Fungsi tutup modal
    const closeModal = () => {
        modal.style.display = 'none';
    };

    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) closeModal();
    });
});
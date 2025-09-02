document.addEventListener('DOMContentLoaded', () => {
    // === Mengambil Elemen Sesuai EJS Anda ===
    const currentTimeEl = document.getElementById('current-time');
    const activeQueuesContainer = document.getElementById('active-queues');
    const videoContainer = document.getElementById('video-container');
    const currencyTableBody = document.querySelector('#currency-table tbody');
    const infoTextContainer = document.getElementById('info-text');

    let videoPlaylist = [];
    let currentVideoIndex = 0;
    let videoPlayer; // Variabel untuk elemen video yang akan kita buat

    // === Fungsi untuk Jam Digital ===
    const updateTime = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateString = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        // Pastikan elemen ada sebelum mengubah isinya
        if(currentTimeEl) {
            currentTimeEl.innerHTML = `${dateString} | ${timeString}`;
        }
    };

    // === Fungsi Utama untuk Mengambil Data & Update Tampilan ===
    const updateDisplayData = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/display');
            if (!response.ok) return;
            const data = await response.json();

            // Hanya update playlist video sekali saat halaman dimuat
            if (videoPlaylist.length === 0 && data.videos.length > 0) {
                videoPlaylist = data.videos;
                createAndPlayVideo();
            }

            updateQueueDisplay(data.queues);
            updateCurrencyDisplay(data.rates);
            updateInfoText(data.infos);

        } catch (error) {
            console.error('Gagal memperbarui display:', error);
        }
    };

    // === Fungsi Spesifik untuk Tiap Bagian ===

    // 1. Logika Video: Membuat elemen video dan memutarnya
    const createAndPlayVideo = () => {
        if (!videoContainer || videoPlaylist.length === 0) return;

        if (!videoPlayer) {
            videoPlayer = document.createElement('video');
            videoPlayer.autoplay = true;
            videoPlayer.muted = true;
            videoPlayer.playsinline = true;
            videoPlayer.addEventListener('ended', playNextVideoInPlaylist);
            videoContainer.appendChild(videoPlayer);
        }
        
        playNextVideoInPlaylist();
    };

    const playNextVideoInPlaylist = () => {
        if (!videoPlayer) return;
        videoPlayer.src = `/videos/${videoPlaylist[currentVideoIndex]}`;
        videoPlayer.play();
        currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
    };

    // 2. Logika Antrian: Menampilkan kartu untuk antrian yang dipanggil
    const updateQueueDisplay = (queues) => {
        if (!activeQueuesContainer) return;
        activeQueuesContainer.innerHTML = ''; // Mengosongkan daftar sebelumnya

        if (queues.length === 0) {
            activeQueuesContainer.innerHTML = '<div class="queue-card empty">Belum Ada Antrian</div>';
            return;
        }

        // Looping untuk setiap data antrian yang diterima dari backend
        queues.forEach(q => {
            const card = document.createElement('div');
            card.className = 'queue-card';
            // Membuat kartu HTML dengan nomor antrian dan info loket
            card.innerHTML = `
                <div class="queue-number">${q.queue_number}</div>
                <div class="teller-info">LOKET ${q.teller_id || '-'}</div>
            `;
            // Menambahkan kartu ke dalam halaman
            activeQueuesContainer.appendChild(card);
        });
    };

    // 3. Logika Kurs: Mengisi tabel mata uang
    const updateCurrencyDisplay = (rates) => {
        if (!currencyTableBody) return;
        currencyTableBody.innerHTML = '';
        rates.forEach(rate => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${rate.currency_code}</td><td>${rate.buy_rate}</td><td>${rate.sell_rate}</td>`;
            currencyTableBody.appendChild(tr);
        });
    };

    // 4. Logika Info Teks: Menggabungkan dan menampilkan teks berjalan
    const updateInfoText = (infos) => {
        if (!infoTextContainer) return;
        const fullText = infos.join(' ••• ');
        infoTextContainer.textContent = fullText;
    };


    // === Inisialisasi & Interval ===
    updateTime(); // Panggil sekali untuk jam
    setInterval(updateTime, 1000); // Update jam setiap detik

    updateDisplayData(); // Panggil sekali untuk data utama
    setInterval(updateDisplayData, 5000); // Update data utama setiap 5 detik
});
document.addEventListener('DOMContentLoaded', () => {
    // === Ambil Elemen dari Halaman ===
    const videoPlayer = document.getElementById('video-player');
    const timeEl = document.getElementById('time');
    const dateEl = document.getElementById('date');
    const currentQueueEl = document.getElementById('current-queue-number');
    const currentTellerEl = document.getElementById('current-teller');
    const lastCallsList = document.getElementById('last-calls-list');
    const currencyList = document.getElementById('currency-list');
    const infoTextEl = document.getElementById('info-text');

    let videoPlaylist = [];
    let currentVideoIndex = 0;

    // === Logika Jam Real-time ===
    const updateTime = () => {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        dateEl.textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    // === Logika Utama Pengambilan Data ===
    const updateDisplayData = async () => {
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/display`);
            if (!response.ok) return;
            const data = await response.json();

            if (videoPlaylist.length === 0 && data.videos.length > 0) {
                videoPlaylist = data.videos;
                playNextVideo();
            }
            updateQueueDisplay(data.queues);
            updateCurrencyDisplay(data.rates);
            updateInfoText(data.infos);
        } catch (error) {
            console.error('Gagal memperbarui display:', error);
        }
    };

    // === Fungsi-fungsi Update Tampilan ===
    const playNextVideo = () => {
        if (!videoPlayer || videoPlaylist.length === 0) return;
        videoPlayer.src = `/videos/${videoPlaylist[currentVideoIndex]}`;
        currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
    };
    videoPlayer.addEventListener('ended', playNextVideo);

    const updateQueueDisplay = (queues) => {
        const currentCall = queues[0]; // Ambil antrian paling baru
        if (currentCall) {
            currentQueueEl.textContent = currentCall.queue_number;
            currentTellerEl.textContent = `LOKET ${currentCall.teller_id || '-'}`;
        } else {
            currentQueueEl.textContent = '-';
            currentTellerEl.textContent = 'LOKET -';
        }
        
        lastCallsList.innerHTML = '';
        queues.slice(1, 4).forEach(q => { // Tampilkan 3 panggilan terakhir
            const li = document.createElement('li');
            li.textContent = `${q.queue_number} ➔ LOKET ${q.teller_id || '-'}`;
            lastCallsList.appendChild(li);
        });
    };

    const updateCurrencyDisplay = (rates) => {
        const formatter = new Intl.NumberFormat('id-ID');
        currencyList.innerHTML = '';
        // Duplikasi list agar scroll terlihat mulus
        const ratesToDisplay = [...rates, ...rates]; 
        ratesToDisplay.forEach(rate => {
            const countryCode = rate.currency_code.slice(0, 2).toLowerCase();
            const li = document.createElement('li');
            li.innerHTML = `
                <img src="https://flagcdn.com/h20/${countryCode}.png" alt="${rate.currency_code}">
                <span>${rate.currency_code}</span>
                <span>BELI: ${formatter.format(rate.buy_rate)}</span>
                <span>JUAL: ${formatter.format(rate.sell_rate)}</span>
            `;
            currencyList.appendChild(li);
        });
    };

    const updateInfoText = (infos) => {
        infoTextEl.textContent = infos.join(' ••• ');
    };

    // === Inisialisasi ===
    updateTime();
    setInterval(updateTime, 1000);
    updateDisplayData();
    setInterval(updateDisplayData, 5000);
});
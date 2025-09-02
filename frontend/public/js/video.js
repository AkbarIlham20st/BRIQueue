document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('/admin/videos')) return;

    const uploadForm = document.getElementById('upload-video-form');
    const uploadStatus = document.getElementById('upload-status');
    const videoListDiv = document.getElementById('video-list');
    
    // Fungsi fetch dengan autentikasi
    async function fetchWithAuth(url, options = {}) {
        const defaultOptions = { credentials: 'include' };
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (response.status === 401) {
            window.location.href = '/admin/login';
            throw new Error('Unauthorized');
        }
        return response;
    }

    // Fungsi untuk render daftar video
    const renderVideos = (videos) => {
        videoListDiv.innerHTML = '';
        if (videos.length === 0) {
            videoListDiv.innerHTML = '<p>Belum ada video yang diunggah.</p>';
            return;
        }

        videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.innerHTML = `
                <video src="/videos/${video.content_value}" controls muted></video>
                <div class="video-info">
                    <p><strong>File:</strong> ${video.content_value}</p>
                    <p><strong>Urutan:</strong> ${video.display_order}</p>
                    <div class="video-actions">
                        <div>
                            <span>Aktif: </span>
                            <label class="toggle-switch">
                                <input type="checkbox" class="status-toggle" data-id="${video.id}" data-order="${video.display_order}" ${video.is_active ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <button class="btn btn-danger delete-btn" data-id="${video.id}">Hapus</button>
                    </div>
                </div>
            `;
            videoListDiv.appendChild(videoCard);
        });
    };

    // Fungsi untuk memuat semua video
    const loadVideos = async () => {
        try {
            const response = await fetchWithAuth('http://localhost:3001/api/videos');
            const videos = await response.json();
            renderVideos(videos);
        } catch (error) {
            if (error.message !== 'Unauthorized') console.error('Gagal memuat video:', error);
        }
    };

    // Event listener untuk form upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        uploadStatus.textContent = 'Mengunggah...';

        const formData = new FormData(uploadForm);
        try {
            const response = await fetchWithAuth('http://localhost:3001/api/videos', {
                method: 'POST',
                body: formData, // Untuk FormData, browser akan set header Content-Type secara otomatis
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengunggah video.');
            }
            uploadStatus.textContent = 'Unggah berhasil!';
            uploadForm.reset();
            loadVideos(); // Refresh list
            setTimeout(() => { uploadStatus.textContent = ''; }, 3000);
        } catch (error) {
            if (error.message !== 'Unauthorized') uploadStatus.textContent = `Error: ${error.message}`;
        }
    });

    // Event listener untuk aksi di daftar video (delegation)
    videoListDiv.addEventListener('click', async (e) => {
        // Hapus video
        if (e.target.classList.contains('delete-btn')) {
            const videoId = e.target.getAttribute('data-id');
            if (confirm('Anda yakin ingin menghapus video ini?')) {
                try {
                    await fetchWithAuth(`http://localhost:3001/api/videos/${videoId}`, { method: 'DELETE' });
                    loadVideos(); // Refresh list
                } catch (error) {
                    if (error.message !== 'Unauthorized') alert('Gagal menghapus video.');
                }
            }
        }
        // Toggle status aktif
        if (e.target.classList.contains('status-toggle')) {
            const videoId = e.target.getAttribute('data-id');
            const displayOrder = e.target.getAttribute('data-order');
            const isActive = e.target.checked;
            try {
                await fetchWithAuth(`http://localhost:3001/api/videos/${videoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_active: isActive, display_order: displayOrder })
                });
                // Tidak perlu refresh list, lebih responsif
            } catch (error) {
                if (error.message !== 'Unauthorized') alert('Gagal mengubah status video.');
            }
        }
    });

    // Muat video saat halaman dibuka
    loadVideos();
});
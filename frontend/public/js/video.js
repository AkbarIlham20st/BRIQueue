document.addEventListener('DOMContentLoaded', () => {
    // Pastikan kode hanya berjalan di halaman kelola video
    if (!window.location.pathname.includes('/admin/videos')) return;

    // Ambil semua elemen yang diperlukan
    const uploadForm = document.getElementById('upload-video-form');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('videoFile');
    const fileNameDisplay = document.getElementById('file-name-display');
    const uploadBtn = document.getElementById('upload-btn');
    const videoListDiv = document.getElementById('video-list');
    const toast = document.getElementById('toast-notification');

    let selectedFile = null;

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

    // Fungsi untuk menampilkan notifikasi
    const showToast = (message, type = 'success') => {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    };

    // --- LOGIKA DRAG AND DROP ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            selectedFile = files[0];
            fileNameDisplay.textContent = selectedFile.name;
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            selectedFile = fileInput.files[0];
            fileNameDisplay.textContent = selectedFile.name;
        }
    });

    // --- LOGIKA UPLOAD ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            showToast('Silakan pilih file video terlebih dahulu.', 'error');
            return;
        }

        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah...';

        const formData = new FormData(uploadForm);
        try {
            const response = await fetchWithAuth(`${window.API_BASE_URL}/api/videos`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengunggah video.');
            }
            showToast('Video berhasil diunggah!');
            uploadForm.reset();
            fileNameDisplay.textContent = '';
            selectedFile = null;
            loadVideos();
        } catch (error) {
            if (error.message !== 'Unauthorized') showToast(error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Unggah Video';
        }
    });

    // --- RENDER DAN KELOLA DAFTAR VIDEO ---
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
                    <p><strong>Urutan:</strong> ${video.display_order}</p>
                    <div class="video-actions">
                        <div class="status-indicator">
                            <span class="status-dot ${video.is_active ? 'active' : 'inactive'}"></span>
                            <span>${video.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        </div>
                        <button class="delete-btn" data-id="${video.id}" title="Hapus Video">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            videoListDiv.appendChild(videoCard);
        });
    };
    
    const loadVideos = async () => {
        try {
            const response = await fetchWithAuth(`${window.API_BASE_URL}/api/videos`);
            const videos = await response.json();
            renderVideos(videos);
        } catch (error) {
            if (error.message !== 'Unauthorized') console.error('Gagal memuat video:', error);
        }
    };
    
    // Event listener untuk tombol hapus
    videoListDiv.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const videoId = deleteButton.getAttribute('data-id');
            if (confirm('Anda yakin ingin menghapus video ini secara permanen?')) {
                try {
                    await fetchWithAuth(`${window.API_BASE_URL}/api/videos/${videoId}`, { method: 'DELETE' });
                    showToast('Video berhasil dihapus.');
                    loadVideos();
                } catch (error) {
                    if (error.message !== 'Unauthorized') showToast('Gagal menghapus video.', 'error');
                }
            }
        }
    });

    // // Logout handler
    // document.getElementById('logout-link')?.addEventListener('click', async (e) => {
    //     e.preventDefault();
    //     try {
    //         await fetchWithAuth(`${window.API_BASE_URL}/api/admin/logout`, { method: 'POST' });
    //         window.location.href = '/admin/login';
    //     } catch (error) {
    //         if (error.message !== 'Unauthorized') console.error('Gagal logout:', error);
    //     }
    // });

    // Muat video saat halaman dibuka
    loadVideos();
});
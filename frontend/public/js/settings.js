document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('/admin/settings')) return;

    const form = document.getElementById('change-password-form');
    const messageEl = document.getElementById('form-message');

    // Fungsi fetch dengan autentikasi
    async function fetchWithAuth(url, options = {}) {
        const defaultOptions = { 
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...options.headers },
        };
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (response.status === 401) {
            window.location.href = '/admin/login';
            throw new Error('Unauthorized');
        }
        return response;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageEl.textContent = '';
        messageEl.className = 'form-message';

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validasi frontend sederhana
        if (newPassword !== confirmPassword) {
            messageEl.textContent = 'Konfirmasi password baru tidak cocok!';
            messageEl.classList.add('error');
            return;
        }

        if (newPassword.length < 6) {
            messageEl.textContent = 'Password baru minimal harus 6 karakter!';
            messageEl.classList.add('error');
            return;
        }

        try {
            const response = await fetchWithAuth('http://localhost:3001/api/admin/change-password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Gagal mengubah password.');
            }

            messageEl.textContent = result.message;
            messageEl.classList.add('success');
            form.reset();

        } catch (error) {
            if (error.message !== 'Unauthorized') {
                messageEl.textContent = error.message;
                messageEl.classList.add('error');
            }
        }
    });
});
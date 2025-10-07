document.addEventListener('DOMContentLoaded', () => {
    // Pastikan kode hanya berjalan di halaman pengaturan
    if (!window.location.pathname.includes('/admin/settings')) return;

    const form = document.getElementById('change-password-form');
    const messageEl = document.getElementById('form-message');
    const newPasswordInput = document.getElementById('newPassword');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    const toggleIcons = document.querySelectorAll('.password-toggle-icon');

    // =====================================================================
    // ✅ FUNGSI PENTING YANG MEMASTIKAN COOKIE SELALU DIKIRIM
    // =====================================================================
    async function fetchWithAuth(url, options = {}) {
        const defaultOptions = { 
            credentials: 'include', // Ini adalah kuncinya!
            headers: { 'Content-Type': 'application/json', ...options.headers },
        };
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (response.status === 401) {
            window.location.href = '/admin/login';
            throw new Error('Unauthorized');
        }
        return response;
    }
    // =====================================================================


    // --- LOGIKA TAMPIL/SEMBUNYIKAN PASSWORD ---
    toggleIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const input = icon.closest('.input-group').querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // --- LOGIKA INDIKATOR KEKUATAN PASSWORD ---
    newPasswordInput.addEventListener('input', () => {
        const password = newPasswordInput.value;
        const strength = checkPasswordStrength(password);
        
        strengthBar.className = 'strength-bar';
        if (password.length > 0) {
            strengthText.textContent = strength.text;
            strengthBar.classList.add(strength.class);
        } else {
            strengthText.textContent = '';
        }
    });

    const checkPasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score < 3) return { text: 'Lemah', class: 'weak' };
        if (score < 5) return { text: 'Sedang', class: 'medium' };
        return { text: 'Kuat', class: 'strong' };
    };

    // --- LOGIKA SUBMIT FORM ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageEl.textContent = '';
        messageEl.className = 'form-message';

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            messageEl.textContent = 'Konfirmasi password baru tidak cocok!';
            messageEl.classList.add('error');
            return;
        }
        if (newPassword.length < 8) {
            messageEl.textContent = 'Password baru minimal harus 8 karakter!';
            messageEl.classList.add('error');
            return;
        }

        try {
            // Gunakan fungsi fetchWithAuth yang sudah benar
            const response = await fetchWithAuth(`${window.API_BASE_URL}/api/admin/change-password`, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            messageEl.textContent = result.message;
            messageEl.classList.add('success');
            form.reset();
            strengthBar.className = 'strength-bar';
            strengthText.textContent = '';
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                messageEl.textContent = error.message;
                messageEl.classList.add('error');
            }
        }
    });
});
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// backend/controllers/adminController.js

exports.login = async (req, res) => {
    // ================== DEBUGGING START ==================
    console.log('\n--- [DEBUG] Menerima Permintaan Login Baru ---');
    console.log('[DEBUG] Waktu:', new Date().toLocaleTimeString());
    console.log('[DEBUG] Request Body:', req.body);
    console.log('[DEBUG] Info Sesi Awal:', req.session.user || 'Tidak ada sesi aktif');
    // =================== DEBUGGING END ===================

    const { username, password } = req.body;
    
    try {
        const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
        const admin = result.rows[0];

        if (!admin) {
            console.log(`[DEBUG] HASIL: Username '${username}' tidak ditemukan.`);
            return res.status(401).json({ message: 'Username atau password salah' });
        }
        console.log('[DEBUG] HASIL: Admin ditemukan di DB:', {id: admin.id, username: admin.username});

        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        console.log('[DEBUG] HASIL: Perbandingan password (bcrypt):', isPasswordMatch);

        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        // Membuat sesi baru
        req.session.user = { id: admin.id, username: admin.username };
        console.log('[DEBUG] HASIL: Sesi baru berhasil dibuat untuk:', req.session.user);
        
        // Final response
        res.status(200).json({ message: 'Login berhasil', user: req.session.user });

    } catch (error) {
        console.error('[DEBUG] ERROR:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Gagal logout' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout berhasil' });
    });
};

exports.checkAuth = (req, res) => {
    if (req.session.user) {
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        res.status(401).json({ loggedIn: false });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.session.user.id; // Ambil ID admin dari sesi yang aktif

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Semua kolom harus diisi' });
    }

    try {
        // 1. Ambil hash password saat ini dari database
        const result = await db.query('SELECT password FROM admins WHERE id = $1', [adminId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Admin tidak ditemukan' });
        }
        const currentHashedPassword = result.rows[0].password;

        // 2. Bandingkan password saat ini yang diinput dengan yang ada di DB
        const isMatch = await bcrypt.compare(currentPassword, currentHashedPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password saat ini salah' });
        }

        // 3. Hash password baru
        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update password di database dengan hash yang baru
        await db.query('UPDATE admins SET password = $1 WHERE id = $2', [newHashedPassword, adminId]);

        res.status(200).json({ message: 'Password berhasil diperbarui!' });
    } catch (error) {
        console.error('Gagal ganti password:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};
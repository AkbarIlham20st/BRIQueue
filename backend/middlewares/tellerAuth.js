const db = require('../config/db');

// Middleware untuk memeriksa apakah request berasal dari IP teller yang terdaftar
const isTeller = async (req, res, next) => {
    const ip = req.ip;
    try {
        const result = await db.query('SELECT * FROM tellers WHERE ip_address = $1', [ip]);
        
        if (result.rows.length === 0) {
            return res.status(403).json({ message: 'Akses ditolak. IP Anda tidak terdaftar.' });
        }

        // Jika IP ditemukan, simpan info teller di object request untuk digunakan nanti
        req.teller = result.rows[0];
        next(); // Lanjutkan ke controller

    } catch (error) {
        res.status(500).json({ message: 'Kesalahan server saat autentikasi teller' });
    }
};

module.exports = { isTeller };
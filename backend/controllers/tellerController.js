const db = require('../config/db');

// Fungsi untuk mengidentifikasi teller berdasarkan alamat IP
exports.identifyTeller = async (req, res) => {
    const ip = req.ip;
    console.log(`[TELLER] Mencoba identifikasi dari IP: ${ip}`);
    
    try {
        const result = await db.query('SELECT * FROM tellers WHERE ip_address = $1', [ip]);
        if (result.rows.length === 0) {
            // Jika IP tidak terdaftar, kirim error 403 (Forbidden)
            return res.status(403).json({ message: 'Akses ditolak. Alamat IP tidak terdaftar sebagai teller.' });
        }
        // Jika IP ditemukan, kirim detail teller
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// Fungsi untuk mendapatkan antrian yang sedang dilayani oleh teller spesifik
exports.getCurrentQueue = async (req, res) => {
    const { tellerId } = req.params;
    try {
        const result = await db.query(
            "SELECT * FROM queues WHERE teller_id = $1 AND status = 'Dipanggil' ORDER BY called_at DESC LIMIT 1",
            [tellerId]
        );
        res.status(200).json(result.rows[0] || null); // Kirim null jika tidak ada
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil antrian saat ini' });
    }
};
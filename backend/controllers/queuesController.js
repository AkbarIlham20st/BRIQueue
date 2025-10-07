const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const totalResult = await db.query("SELECT COUNT(*) FROM queues WHERE DATE(created_at) = CURRENT_DATE");
        const servingResult = await db.query("SELECT queue_number FROM queues WHERE status = 'Dipanggil' ORDER BY called_at DESC LIMIT 1");
        const remainingResult = await db.query("SELECT COUNT(*) FROM queues WHERE status = 'Menunggu' AND DATE(created_at) = CURRENT_DATE");

        res.status(200).json({
            total: totalResult.rows[0].count || 0,
            current: servingResult.rows.length > 0 ? servingResult.rows[0].queue_number : '-',
            remaining: remainingResult.rows[0].count || 0,
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil statistik' });
    }
};

// Fungsi untuk mereset semua antrian (Admin)
exports.resetQueues = async (req, res) => {
    try {
        await db.query('TRUNCATE TABLE queues RESTART IDENTITY');
        res.status(200).json({ message: 'Semua antrian berhasil direset' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mereset antrian' });
    }
};

// Fungsi untuk mendapatkan semua antrian hari ini (Admin)
exports.getAllQueues = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM queues WHERE DATE(created_at) = CURRENT_DATE ORDER BY id ASC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// Fungsi untuk membuat antrian baru secara manual (Admin)
exports.createNewQueue = async (req, res) => {
    try {
        const lastQueue = await db.query(
            "SELECT queue_number FROM queues WHERE DATE(created_at) = CURRENT_DATE ORDER BY id DESC LIMIT 1"
        );
        
        let newNumber = 1;
        if (lastQueue.rows.length > 0) {
            const lastNumber = parseInt(lastQueue.rows[0].queue_number.split('-')[1]);
            newNumber = lastNumber + 1;
        }

        const newQueueNumber = `A-${String(newNumber).padStart(3, '0')}`;
        const result = await db.query(
            "INSERT INTO queues (queue_number, status) VALUES ($1, 'Menunggu') RETURNING *",
            [newQueueNumber]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// Fungsi untuk memanggil antrian berikutnya (Teller & Admin)
exports.callNextQueue = async (req, res) => {
    const { teller_id } = req.body;
    const active_teller_id = teller_id || 1; // Default ke teller 1 jika tidak ada

    try {
        const nextQueue = await db.query(
            "SELECT * FROM queues WHERE status = 'Menunggu' AND DATE(created_at) = CURRENT_DATE ORDER BY id ASC LIMIT 1"
        );
        if (nextQueue.rows.length === 0) {
            return res.status(404).json({ message: 'Tidak ada antrian yang menunggu' });
        }
        const queueToCall = nextQueue.rows[0];
        const result = await db.query(
            "UPDATE queues SET status = 'Dipanggil', called_at = CURRENT_TIMESTAMP, teller_id = $1 WHERE id = $2 RETURNING *",
            [active_teller_id, queueToCall.id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memanggil antrian' });
    }
};

// Fungsi untuk menyelesaikan antrian (Teller & Admin)
exports.completeQueue = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            "UPDATE queues SET status = 'Selesai', completed_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Antrian tidak ditemukan' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal menyelesaikan antrian' });
    }
};
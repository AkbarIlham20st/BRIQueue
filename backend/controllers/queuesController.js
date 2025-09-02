const db = require('../config/db');

exports.resetQueues = async (req, res) => {
    try {
        await db.query('TRUNCATE TABLE queues RESTART IDENTITY');
        res.status(200).json({ message: 'Semua antrian berhasil direset' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mereset antrian' });
    }
};
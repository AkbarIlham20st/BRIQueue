const db = require('../config/db');

// READ: Mengambil semua data kurs
exports.getAllRates = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM currency_rates ORDER BY currency_code ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data kurs' });
    }
};

// CREATE: Menambah kurs baru
exports.createRate = async (req, res) => {
    const { currency_code, buy_rate, sell_rate } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO currency_rates (currency_code, buy_rate, sell_rate) VALUES ($1, $2, $3) RETURNING *',
            [currency_code.toUpperCase(), buy_rate, sell_rate]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambah kurs baru, mungkin kode mata uang sudah ada.' });
    }
};

// UPDATE: Memperbarui kurs yang ada
exports.updateRate = async (req, res) => {
    const { id } = req.params;
    const { buy_rate, sell_rate } = req.body;
    try {
        const result = await db.query(
            'UPDATE currency_rates SET buy_rate = $1, sell_rate = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [buy_rate, sell_rate, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui kurs.' });
    }
};

// DELETE: Menghapus kurs
exports.deleteRate = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM currency_rates WHERE id = $1', [id]);
        res.status(200).json({ message: 'Kurs berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus kurs.' });
    }
};
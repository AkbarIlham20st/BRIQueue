const db = require('../config/db');

exports.getDisplayData = async (req, res) => {
    try {
        const [videoResult, queueResult, currencyResult, infoResult] = await Promise.all([
            // 1. Ambil video aktif
            db.query(`SELECT content_value FROM display_contents WHERE content_type = 'video' AND is_active = TRUE ORDER BY display_order ASC, id ASC`),
            
            // 2. Ambil 5 antrian terbaru yang dipanggil/selesai
            db.query(`SELECT queue_number, status, teller_id FROM queues WHERE DATE(created_at) = CURRENT_DATE AND (status = 'Dipanggil' OR status = 'Selesai') ORDER BY called_at DESC NULLS LAST, id DESC LIMIT 3`),
            
            // 3. Ambil data kurs
            db.query(`SELECT currency_code, buy_rate, sell_rate FROM currency_rates ORDER BY id ASC`),
            
            // ✅ 4. Ambil teks informasi yang aktif
            db.query(`SELECT content_value FROM display_contents WHERE content_type = 'info' AND is_active = TRUE ORDER BY display_order ASC, id ASC`)
        ]);

        // Gabungkan semua hasil
        res.status(200).json({
            videos: videoResult.rows.map(v => v.content_value),
            queues: queueResult.rows,
            rates: currencyResult.rows,
            infos: infoResult.rows.map(i => i.content_value) // ✅ Kirim data info
        });

    } catch (error) {
        console.error('Gagal mengambil data untuk display:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// READ: Mendapatkan semua video
exports.getAllVideos = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM display_contents WHERE content_type = 'video' ORDER BY display_order ASC, id ASC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data video' });
    }
};

// CREATE: Upload video baru
exports.uploadVideo = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File video tidak ditemukan' });
    }

    const { display_order, duration, is_active } = req.body;
    const content_value = req.file.filename; // Nama file yang disimpan oleh Multer

    try {
        const result = await db.query(
            `INSERT INTO display_contents (content_type, content_value, display_order, duration, is_active) 
             VALUES ('video', $1, $2, $3, $4) RETURNING *`,
            [content_value, display_order || 99, duration || 15, is_active || true]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal menyimpan data video ke database' });
    }
};

// UPDATE: Mengubah detail video (seperti status aktif/tidak aktif)
exports.updateVideo = async (req, res) => {
    const { id } = req.params;
    const { display_order, is_active } = req.body;

    try {
        const result = await db.query(
            `UPDATE display_contents SET display_order = $1, is_active = $2 
             WHERE id = $3 AND content_type = 'video' RETURNING *`,
            [display_order, is_active, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Video tidak ditemukan' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui data video' });
    }
};

// DELETE: Menghapus video
exports.deleteVideo = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Ambil nama file dari database terlebih dahulu
        const videoData = await db.query("SELECT content_value FROM display_contents WHERE id = $1", [id]);
        if (videoData.rows.length === 0) {
            return res.status(404).json({ message: 'Data video tidak ditemukan di DB' });
        }
        const filename = videoData.rows[0].content_value;

        // 2. Hapus data dari database
        await db.query("DELETE FROM display_contents WHERE id = $1", [id]);

        // 3. Hapus file fisik dari folder
        const filePath = path.join(__dirname, '../../../frontend/public/videos/', filename);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Gagal menghapus file fisik:', err);
                // Jangan kirim error ke client karena data DB sudah terhapus
            }
        });

        res.status(200).json({ message: 'Video berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus video' });
    }
};
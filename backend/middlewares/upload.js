const multer = require('multer');
const path = require('path');

// Tentukan lokasi penyimpanan file
// Kita simpan di folder public frontend agar bisa diakses langsung oleh browser
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../frontend/public/videos/');
    },
    filename: function (req, file, cb) {
        // Buat nama file yang unik untuk menghindari duplikasi
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter untuk hanya menerima file video
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file video yang diizinkan!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 50 // Batas ukuran file 50MB
    }
});

module.exports = upload;
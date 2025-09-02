const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

dotenv.config({ path: '../.env' });

const app = express();
app.set('trust proxy', true);
const PORT = process.env.BACKEND_PORT || 3001;

const allowedOrigins = [
    `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
    'http://192.168.0.189:3000' // <-- TAMBAHKAN ALAMAT IP SERVER ANDA DI SINI
];

app.use(cors({
    origin: function (origin, callback) {
        // Izinkan jika origin ada di dalam daftar, atau jika origin tidak ada (misal: request dari Postman)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Akses diblokir oleh kebijakan CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    store: new pgSession({
        pool: db.pool,
        tableName: 'user_sessions'
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 jam
    }
}));

db.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('🔴 Gagal terhubung ke database:', err);
    } else {
        console.log('🟢 Berhasil terhubung ke database PostgreSQL.');
    }
});

// Routes
const adminRoutes = require('./routes/adminRoutes');
const queuesRoutes = require('./routes/queuesRoutes');
const videoRoutes = require('./routes/videoRoutes');
const displayRoutes = require('./routes/displayRoutes');
const tellerRoutes = require('./routes/tellerRoutes');

app.use('/api/admin', adminRoutes);
app.use('/api/queues', queuesRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/display', displayRoutes);
app.use('/api/teller', tellerRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend server berjalan di http://localhost:${PORT}`);
});
// 1. Panggil semua modul yang diperlukan di bagian paling atas
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// 2. Muat environment variables SEGERA setelah import
// Pastikan path ini benar, menunjuk ke file .env di folder root
dotenv.config({ path: '../.env' });

// 3. Inisialisasi aplikasi Express
const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;

// 4. Buat variabel global 'apiBaseUrl' untuk semua halaman EJS
// Ini akan dibaca dari file .env Anda
app.locals.apiBaseUrl = `http://${process.env.APP_HOST_IP}:${process.env.BACKEND_PORT || 3001}`;

// 5. Konfigurasi View Engine dan folder public (static)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware untuk membaca data dari form
app.use(express.urlencoded({ extended: true }));


/*
|--------------------------------------------------------------------------
| Definisi Semua Rute Halaman
|--------------------------------------------------------------------------
*/

// Halaman utama, arahkan ke login
app.get('/', (req, res) => {
    res.redirect('/admin/login');
});

// --- Rute Admin ---
app.get('/admin/login', (req, res) => {
    res.render('admin/login');
});
app.get('/admin/dashboard', (req, res) => {
    res.render('admin/dashboard');
});
app.get('/admin/queues', (req, res) => {
    res.render('admin/queues');
});
app.get('/admin/currency', (req, res) => {
    res.render('admin/currency');
});
app.get('/admin/videos', (req, res) => {
    res.render('admin/video');
});
app.get('/admin/settings', (req, res) => {
    res.render('admin/settings');
});

// --- Rute Teller ---
app.get('/teller', (req, res) => {
    res.render('teller');
});

// --- Rute Display ---
app.get('/display', (req, res) => {
    res.render('display');
});

// --- Rute Pengambilan Nomor ---
app.get('/ambil-nomor', (req, res) => {
    res.render('take-number');
});


// 6. Jalankan server di bagian paling akhir
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🖥️  Frontend server berjalan di http://localhost:${PORT} dan di jaringan Anda.`);
});
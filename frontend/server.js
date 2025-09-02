// Import modul yang diperlukan dari package Node.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Memuat variabel lingkungan dari file .env yang ada di folder root proyek
// Path '../.env' artinya "naik satu level direktori, lalu cari file .env"
dotenv.config({ path: '../.env' });

// Inisialisasi aplikasi Express
const app = express();
// Ambil nomor port dari file .env, atau gunakan 3000 jika tidak ditemukan
const PORT = process.env.FRONTEND_PORT || 3000;

// Konfigurasi View Engine untuk EJS
// Memberitahu Express untuk menggunakan EJS sebagai template engine
app.set('view engine', 'ejs');
// Menentukan lokasi folder 'views' tempat file .ejs disimpan
app.set('views', path.join(__dirname, 'views'));

// Middleware untuk menyajikan file statis
// Membuat semua file di dalam folder 'public' dapat diakses dari browser
// Contoh: file 'public/css/admin.css' bisa diakses melalui URL '/css/admin.css'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware untuk membaca data dari form (jika diperlukan)
app.use(express.urlencoded({ extended: true }));


/*
|--------------------------------------------------------------------------
| Definisi Rute Halaman (Page Routes)
|--------------------------------------------------------------------------
| Rute-rute ini bertanggung jawab untuk merender (menampilkan) file EJS
| yang sesuai ketika pengguna mengakses URL tertentu.
*/

// Rute utama (homepage), akan langsung diarahkan ke halaman login admin
app.get('/', (req, res) => {
    res.redirect('/admin/login');
});

// Rute untuk menampilkan halaman login admin
app.get('/admin/login', (req, res) => {
    // Merender file 'views/admin/login.ejs'
    res.render('admin/login');
});

// Rute untuk menampilkan dashboard admin utama
app.get('/admin/dashboard', (req, res) => {
    // Merender file 'views/admin/dashboard.ejs'
    // Autentikasi akan ditangani oleh JavaScript di sisi klien yang memanggil API backend
    res.render('admin/dashboard');
});

app.get('/admin/queues', (req, res) => {
    res.render('admin/queues');
});

app.get('/admin/videos', (req, res) => {
    res.render('admin/video');
});

app.get('/admin/settings', (req, res) => {
    res.render('admin/settings');
});

app.get('/teller', (req, res) => {
    res.render('teller');
});

// Rute untuk menampilkan halaman teller
app.get('/teller', (req, res) => {
    // Merender file 'views/teller.ejs' (pastikan file ini ada)
    res.render('teller');
});

// Rute untuk menampilkan halaman display publik
app.get('/display', (req, res) => {
    // Merender file 'views/display.ejs' (pastikan file ini ada)
    res.render('display');
});


// Menjalankan server dan mendengarkan koneksi yang masuk di port yang ditentukan
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🖥️  Frontend server berjalan dengan lancar di http://localhost:${PORT}`);
});
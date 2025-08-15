const express = require('express');
const path = require('path');
const session = require('express-session');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// 1. Konfigurasi Session untuk Admin
app.use(session({
  secret: 'rahasia_bank_queue', // Ganti dengan secret key yang kuat
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set true jika menggunakan HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 hari
  }
}));

// 2. Konfigurasi EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 3. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 4. Proxy Configuration
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  onError: (err, req, res) => {
    console.error('⚠️ Proxy Error:', err);
    res.status(502).render('error', { 
      message: 'Koneksi backend gagal',
      details: err.message
    });
  }
}));

// ================= ROUTES ================= //

// Public Routes
app.get('/', (req, res) => res.redirect('/display'));

app.get('/teller', (req, res) => {
  res.render('teller', { 
    title: 'Teller Interface',
    apiBaseUrl: '/api'
  });
});

app.get('/display', (req, res) => {
  res.render('display', {
    title: 'Display Antrian',
    apiBaseUrl: '/api'
  });
});

// ================= ADMIN ROUTES ================= //

// Middleware untuk cek login admin
const requireAdminAuth = (req, res, next) => {
  if (req.session.adminAuthenticated) {
    return next();
  }
  res.redirect('/admin/login');
};

// Login Page
app.get('/admin/login', (req, res) => {
  if (req.session.adminAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', {
    title: 'Admin Login',
    error: req.query.error
  });
});

// Login Handler
app.post('/admin/login', async (req, res) => {
  try {
    // Contoh validasi sederhana (ganti dengan koneksi ke database)
    if (req.body.username === 'admin' && req.body.password === 'admin123') {
      req.session.adminAuthenticated = true;
      req.session.adminUsername = req.body.username;
      return res.redirect('/admin/dashboard');
    }
    throw new Error('Username atau password salah');
  } catch (err) {
    res.redirect('/admin/login?error=' + encodeURIComponent(err.message));
  }
});

// Dashboard Admin
app.get('/admin/dashboard', requireAdminAuth, (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    admin: {
      username: req.session.adminUsername
    },
    apiBaseUrl: '/api'
  });
});

// Logout Handler
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin API Routes (Proteksi dengan auth)
app.use('/admin/api', requireAdminAuth, createProxyMiddleware({
  target: 'http://localhost:3000',
  pathRewrite: { '^/admin/api': '/api/admin' },
  changeOrigin: true
}));

// ================= ERROR HANDLING ================= //

// 404 Not Found
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 Not Found',
    message: 'Halaman tidak ditemukan'
  });
});

// 500 Server Error
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Terjadi kesalahan sistem',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ================= START SERVER ================= //

app.listen(PORT, () => {
  console.log(`
  🚀 Frontend running: http://localhost:${PORT}
  🔗 Admin Panel: http://localhost:${PORT}/admin/login
  📁 Views: ${path.join(__dirname, 'views')}
  `);
});
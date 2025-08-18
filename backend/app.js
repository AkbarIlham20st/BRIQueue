require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const tellerRoutes = require('./routes/tellerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const queuesRoutes = require('./routes/queuesRoutes');
const displayRoutes = require('./routes/displayRoutes');
const { pool } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend/public'));

// Trust proxy untuk mendapatkan IP asli
app.set('trust proxy', true);

// Routes
app.use('/api/teller', tellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/admin', queuesRoutes);
app.use('/api/display', displayRoutes);

// Test database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error', err.stack);
  } else {
    console.log('Database connected');
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
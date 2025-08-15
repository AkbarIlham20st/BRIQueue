const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bank_queue',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Test the connection immediately
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

module.exports = {
  pool,  // Export the pool directly
  query: (text, params) => pool.query(text, params),
};
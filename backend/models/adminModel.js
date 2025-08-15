const db = require('../config/db');
const bcrypt = require('bcrypt');

module.exports = {
  authenticateAdmin: async (username, password) => {
    const { rows } = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (rows.length === 0) return null;
    
    const isValid = await bcrypt.compare(password, rows[0].password);
    return isValid ? rows[0] : null;
  },

  getDisplayContents: async () => {
    const { rows } = await db.query(
      `SELECT * FROM display_contents 
       WHERE is_active = TRUE 
       ORDER BY display_order ASC`
    );
    return rows;
  },

  addVideo: async (videoUrl, duration, displayOrder) => {
    const { rows } = await db.query(
      `INSERT INTO display_contents 
       (content_type, content_value, duration, display_order) 
       VALUES ('video', $1, $2, $3) 
       RETURNING *`,
      [videoUrl, duration, displayOrder]
    );
    return rows[0];
  },

  removeContent: async (contentId) => {
    const { rows } = await db.query(
      'DELETE FROM display_contents WHERE id = $1 RETURNING *',
      [contentId]
    );
    return rows[0];
  },

  updateContentOrder: async (contents) => {
    await db.query('BEGIN');
    
    try {
      for (const content of contents) {
        await db.query(
          'UPDATE display_contents SET display_order = $1 WHERE id = $2',
          [content.display_order, content.id]
        );
      }
      
      await db.query('COMMIT');
      return true;
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  },

  updateCurrencyRates: async (rates) => {
    await db.query('BEGIN');
    
    try {
      for (const rate of rates) {
        await db.query(
          `INSERT INTO currency_rates (currency_code, buy_rate, sell_rate) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (currency_code) 
           DO UPDATE SET buy_rate = EXCLUDED.buy_rate, sell_rate = EXCLUDED.sell_rate, updated_at = CURRENT_TIMESTAMP`,
          [rate.currency_code, rate.buy_rate, rate.sell_rate]
        );
      }
      
      await db.query('COMMIT');
      return true;
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  },

  getCurrencyRates: async () => {
    const { rows } = await db.query('SELECT * FROM currency_rates ORDER BY currency_code');
    return rows;
  },

  updateInfoText: async (text) => {
    // Hapus info text lama
    await db.query(`DELETE FROM display_contents WHERE content_type = 'info'`);
    
    const { rows } = await db.query(
      `INSERT INTO display_contents (content_type, content_value, display_order) 
       VALUES ('info', $1, 999) 
       RETURNING *`,
      [text]
    );
    return rows[0];
  },
};
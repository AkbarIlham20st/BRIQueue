const db = require('../config/db');

module.exports = {
  getCurrentDisplayData: async () => {
    // Dapatkan antrian yang sedang dipanggil
    const queues = await db.query(
      `SELECT q.*, t.name as teller_name 
       FROM queues q
       JOIN tellers t ON q.teller_id = t.id
       WHERE q.status = 'Dipanggil'
       ORDER BY q.called_at DESC`
    );

    // Dapatkan konten display
    const contents = await db.query(
      `SELECT * FROM display_contents 
       WHERE is_active = TRUE 
       ORDER BY display_order ASC`
    );

    // Dapatkan kurs mata uang
    const currencies = await db.query('SELECT * FROM currency_rates ORDER BY currency_code');

    return {
      activeQueues: queues.rows,
      displayContents: contents.rows,
      currencyRates: currencies.rows,
    };
  },
};
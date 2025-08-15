const db = require('../config/db');

module.exports = {
  getTellerByIp: async (ip) => {
    const { rows } = await db.query('SELECT * FROM tellers WHERE ip_address = $1', [ip]);
    return rows[0];
  },

  callNextQueue: async (tellerId) => {
    // Mulai transaksi
    await db.query('BEGIN');
    
    try {
      // Dapatkan antrian tertua yang menunggu
      const { rows } = await db.query(
        `UPDATE queues 
         SET status = 'Dipanggil', teller_id = $1, called_at = CURRENT_TIMESTAMP 
         WHERE id = (
           SELECT id FROM queues 
           WHERE status = 'Menunggu' 
           ORDER BY created_at ASC 
           LIMIT 1
         )
         RETURNING *`,
        [tellerId]
      );

      if (rows.length === 0) {
        await db.query('ROLLBACK');
        return null;
      }

      await db.query('COMMIT');
      return rows[0];
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  },

  recallLastQueue: async (tellerId) => {
    const { rows } = await db.query(
      `SELECT * FROM queues 
       WHERE teller_id = $1 AND status = 'Dipanggil' 
       ORDER BY called_at DESC 
       LIMIT 1`,
      [tellerId]
    );
    return rows[0];
  },

  completeQueue: async (queueId) => {
    const { rows } = await db.query(
      `UPDATE queues 
       SET status = 'Selesai', completed_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [queueId]
    );
    return rows[0];
  },

  generateQueueNumber: async () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    // Hitung jumlah antrian hari ini
    const { rows } = await db.query(
      `SELECT COUNT(*) as count FROM queues 
       WHERE created_at::date = CURRENT_DATE`
    );
    
    const count = parseInt(rows[0].count) + 1;
    return `A-${count.toString().padStart(3, '0')}`;
  },

  createQueue: async (queueNumber) => {
    const { rows } = await db.query(
      `INSERT INTO queues (queue_number, status) 
       VALUES ($1, 'Menunggu') 
       RETURNING *`,
      [queueNumber]
    );
    return rows[0];
  },

  getActiveQueues: async () => {
    const { rows } = await db.query(
      `SELECT q.*, t.name as teller_name 
       FROM queues q
       LEFT JOIN tellers t ON q.teller_id = t.id
       WHERE q.status IN ('Menunggu', 'Dipanggil')
       ORDER BY 
         CASE WHEN q.status = 'Dipanggil' THEN 0 ELSE 1 END,
         q.created_at ASC`
    );
    return rows;
  },
};
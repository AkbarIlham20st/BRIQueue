const pool = require('../config/db');

module.exports = {
  getAllQueues: async () => {
    const query = `
      SELECT q.*, t.name as teller_name 
      FROM queues q
      LEFT JOIN tellers t ON q.teller_id = t.id
      ORDER BY q.created_at DESC`;
    const { rows } = await pool.query(query);
    return rows;
  },

  getActiveQueues: async () => {
    const query = `
      SELECT q.*, t.name as teller_name 
      FROM queues q
      LEFT JOIN tellers t ON q.teller_id = t.id
      WHERE q.status IN ('Menunggu', 'Dipanggil')
      ORDER BY q.created_at ASC`;
    const { rows } = await pool.query(query);
    return rows;
  },

  callQueue: async (queueId, tellerId) => {
    const query = `
      UPDATE queues 
      SET status = 'Dipanggil', 
          teller_id = $1,
          called_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`;
    const { rows } = await pool.query(query, [tellerId, queueId]);
    return rows[0];
  },

  completeQueue: async (queueId) => {
    const query = `
      UPDATE queues 
      SET status = 'Selesai',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *`;
    const { rows } = await pool.query(query, [queueId]);
    return rows[0];
  },

  resetQueues: async () => {
    await pool.query("UPDATE queues SET status = 'Menunggu', teller_id = NULL");
  },

  getAvailableTellers: async () => {
    const query = "SELECT * FROM tellers ORDER BY name";
    const { rows } = await pool.query(query);
    return rows;
  }
};
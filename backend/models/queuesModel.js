// models/queueModel.js
const pool = require('../config/db');

// Get queue statistics
exports.getQueueStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalTodayQuery = `
      SELECT COUNT(*) FROM queues 
      WHERE DATE(created_at) = $1
    `;
    
    const completedQuery = `
      SELECT COUNT(*) FROM queues 
      WHERE status = 'Selesai' AND DATE(created_at) = $1
    `;
    
    const inProgressQuery = `
      SELECT COUNT(*) FROM queues 
      WHERE status = 'Diproses' AND DATE(created_at) = $1
    `;
    
    const waitingQuery = `
      SELECT COUNT(*) FROM queues 
      WHERE status = 'Menunggu' AND DATE(created_at) = $1
    `;
    
    const totalTodayResult = await pool.query(totalTodayQuery, [today]);
    const completedResult = await pool.query(completedQuery, [today]);
    const inProgressResult = await pool.query(inProgressQuery, [today]);
    const waitingResult = await pool.query(waitingQuery, [today]);
    
    return {
      totalToday: parseInt(totalTodayResult.rows[0].count),
      completed: parseInt(completedResult.rows[0].count),
      inProgress: parseInt(inProgressResult.rows[0].count),
      waiting: parseInt(waitingResult.rows[0].count)
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    throw error;
  }
};

// Get recent queues
exports.getRecentQueues = async (limit = 5) => {
  try {
    const query = `
      SELECT q.*, t.name as teller_name 
      FROM queues q 
      LEFT JOIN tellers t ON q.teller_id = t.id 
      WHERE DATE(q.created_at) = CURRENT_DATE 
      ORDER BY q.created_at DESC 
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error getting recent queues:', error);
    throw error;
  }
};

// Get all tellers
exports.getTellers = async () => {
  try {
    const query = 'SELECT * FROM tellers ORDER BY id';
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting tellers:', error);
    throw error;
  }
};

// Get next queue
exports.getNextQueue = async () => {
  try {
    const waitingCountQuery = `
      SELECT COUNT(*) FROM queues 
      WHERE status = 'Menunggu' AND DATE(created_at) = CURRENT_DATE
    `;
    
    const nextQueueQuery = `
      SELECT * FROM queues 
      WHERE status = 'Menunggu' AND DATE(created_at) = CURRENT_DATE 
      ORDER BY created_at ASC 
      LIMIT 1
    `;
    
    const waitingCountResult = await pool.query(waitingCountQuery);
    const nextQueueResult = await pool.query(nextQueueQuery);
    
    return {
      queue_number: nextQueueResult.rows[0]?.queue_number || null,
      waiting_count: parseInt(waitingCountResult.rows[0].count)
    };
  } catch (error) {
    console.error('Error getting next queue:', error);
    throw error;
  }
};

// Get all queues with pagination
exports.getQueues = async (limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT q.*, t.name as teller_name 
      FROM queues q 
      LEFT JOIN tellers t ON q.teller_id = t.id 
      ORDER BY q.created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  } catch (error) {
    console.error('Error getting queues:', error);
    throw error;
  }
};

// Get total queues count
exports.getTotalQueues = async () => {
  try {
    const query = 'SELECT COUNT(*) FROM queues';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error getting total queues:', error);
    throw error;
  }
};

// Call next queue
exports.callNextQueue = async (tellerId) => {
  try {
    // Get the next waiting queue
    const nextQueueQuery = `
      SELECT * FROM queues 
      WHERE status = 'Menunggu' 
      ORDER BY created_at ASC 
      LIMIT 1
    `;
    
    const nextQueueResult = await pool.query(nextQueueQuery);
    
    if (nextQueueResult.rows.length === 0) {
      return { success: false, message: 'Tidak ada antrian yang menunggu' };
    }
    
    const queueId = nextQueueResult.rows[0].id;
    
    // Update the queue status
    const updateQuery = `
      UPDATE queues 
      SET status = 'Diproses', teller_id = $1, called_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [tellerId, queueId]);
    
    return { 
      success: true, 
      queue: updateResult.rows[0] 
    };
  } catch (error) {
    console.error('Error calling next queue:', error);
    throw error;
  }
};

// Complete queue
exports.completeQueue = async (queueId) => {
  try {
    const query = `
      UPDATE queues 
      SET status = 'Selesai', completed_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [queueId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error completing queue:', error);
    throw error;
  }
};

// Delete queue
exports.deleteQueue = async (queueId) => {
  try {
    const query = 'DELETE FROM queues WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [queueId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting queue:', error);
    throw error;
  }
};
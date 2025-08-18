const queuesModel = require('../models/queuesModel');

module.exports = {
    getQueuesPage: async (req, res) => {
    try {
      const allQueues = await queuesModel.getAllQueues();
      const activeQueues = await queuesModel.getActiveQueues();
      const tellers = await queuesModel.getAvailableTellers();
      
      res.render('admin/queues', { 
        title: 'Manage Queues',
        allQueues,
        activeQueues,
        tellers,
        user: req.session.admin
      });
    } catch (error) {
      console.error('Error getting queues:', error);
      res.status(500).render('error', { 
        message: 'Failed to load queues',
        error: req.app.get('env') === 'development' ? error : null
      });
    }
  },

  callQueue: async (req, res) => {
    try {
      const { queueId, tellerId } = req.body;
      const updatedQueue = await queuesModel.callQueue(queueId, tellerId);
      
      res.json({
        success: true,
        queue: updatedQueue
      });
    } catch (error) {
      console.error('Error calling queue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to call queue'
      });
    }
  },

  completeQueue: async (req, res) => {
    try {
      const { queueId } = req.body;
      const updatedQueue = await queuesModel.completeQueue(queueId);
      
      res.json({
        success: true,
        queue: updatedQueue
      });
    } catch (error) {
      console.error('Error completing queue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete queue'
      });
    }
  },

  resetQueues: async (req, res) => {
    try {
      await queuesModel.resetQueues();
      res.json({ success: true });
    } catch (error) {
      console.error('Error resetting queues:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset queues'
      });
    }
  }
};
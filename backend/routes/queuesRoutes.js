const express = require('express');
const router = express.Router();
const queuesController = require('../controllers/queuesController');
const { authenticate } = require('../middleware/auth');

router.get('/queues', authenticate, queuesController.getQueuesPage);
router.post('/queues/call', authenticate, queuesController.callQueue);
router.post('/queues/complete', authenticate, queuesController.completeQueue);
router.post('/queues/reset', authenticate, queuesController.resetQueues);

module.exports = router;
const express = require('express');
const router = express.Router();
const tellerController = require('../controllers/tellerController');

// Teller routes (no auth needed, identified by IP)
router.get('/next', tellerController.callNextQueue);
router.get('/recall', tellerController.recallLastQueue);
router.post('/complete/:queueId', tellerController.completeQueue);
router.get('/queues', tellerController.getActiveQueues);

// Public queue generation
router.post('/generate', tellerController.generateQueue);

module.exports = router;
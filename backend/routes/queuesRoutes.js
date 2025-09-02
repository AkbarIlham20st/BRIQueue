const express = require('express');
const router = express.Router();
const queuesController = require('../controllers/queuesController');
const { isAuthenticated } = require('../middlewares/auth');

router.post('/reset', isAuthenticated, queuesController.resetQueues);

module.exports = router;
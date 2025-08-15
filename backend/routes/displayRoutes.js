const express = require('express');
const router = express.Router();
const displayController = require('../controllers/displayController');

// Public display routes
router.get('/', displayController.getDisplayData);

module.exports = router;
const express = require('express');
const router = express.Router();
const displayController = require('../controllers/displayController');

// API endpoint publik di GET /api/display
router.get('/', displayController.getDisplayData);

module.exports = router;
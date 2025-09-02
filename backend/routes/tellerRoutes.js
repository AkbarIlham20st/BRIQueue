const express = require('express');
const router = express.Router();
const tellerController = require('../controllers/tellerController');

// Rute untuk "login" otomatis berdasarkan IP
router.get('/identify', tellerController.identifyTeller);

// Rute untuk mendapatkan antrian yang sedang dilayani teller
router.get('/:tellerId/current-queue', tellerController.getCurrentQueue);

module.exports = router;
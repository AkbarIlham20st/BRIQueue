const express = require('express');
const router = express.Router();
const queuesController = require('../controllers/queuesController');
const { isAuthenticated } = require('../middlewares/auth');

// ✅ RUTE PUBLIK: Untuk pelanggan mengambil nomor antrian (tanpa login)
router.post('/create', queuesController.createNewQueue);

// --- Rute yang sudah ada untuk Admin dan Teller ---
router.get('/stats', isAuthenticated, queuesController.getStats);
router.post('/reset', isAuthenticated, queuesController.resetQueues);
router.get('/', isAuthenticated, queuesController.getAllQueues);
router.post('/call-next', queuesController.callNextQueue);
router.put('/:id/complete', queuesController.completeQueue);

module.exports = router;
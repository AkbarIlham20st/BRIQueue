const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const { isAuthenticated } = require('../middlewares/auth');

// Lindungi semua rute dengan autentikasi admin
router.use(isAuthenticated);

router.get('/', currencyController.getAllRates);
router.post('/', currencyController.createRate);
router.put('/:id', currencyController.updateRate);
router.delete('/:id', currencyController.deleteRate);

module.exports = router;
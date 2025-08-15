const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/login', adminController.login);

// Protected routes
router.use(authMiddleware.authenticateAdmin);

router.get('/contents', adminController.getDisplayContents);
router.post('/videos', adminController.addVideo);
router.delete('/contents/:contentId', adminController.removeContent);
router.put('/contents/order', adminController.updateContentOrder);
router.put('/currencies', adminController.updateCurrencyRates);
router.put('/info', adminController.updateInfoText);

module.exports = router;
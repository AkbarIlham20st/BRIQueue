const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middlewares/auth');

router.post('/login', adminController.login);
router.post('/logout', isAuthenticated, adminController.logout);
router.get('/check-auth', adminController.checkAuth);
router.put('/change-password', isAuthenticated, adminController.changePassword);

module.exports = router;
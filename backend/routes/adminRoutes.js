const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Authentication Middleware
const authenticate = (req, res, next) => {
  if (req.session.admin) {
    return next();
  }
  res.status(401).json({ 
    success: false,
    error: 'Unauthorized' 
  });
};

// Public Routes
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

// Protected Routes (require authentication)
router.use(authenticate);

// Settings routes
router.get('/settings', authenticate, adminController.getSettingsPage);
router.post('/settings/change-password', authenticate, adminController.changePassword);

// Video Management
router.post('/videos/upload', adminController.uploadVideoHandler);
router.get('/videos', adminController.getVideos);
router.put('/videos/order', adminController.updateVideoOrder);
router.delete('/videos/:id', adminController.deleteVideo);

// Dashboard
router.get('/dashboard', adminController.getDashboardData);

module.exports = router;
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const upload = require('../middlewares/upload');
const { isAuthenticated } = require('../middlewares/auth');

// Lindungi semua rute video dengan autentikasi
router.use(isAuthenticated);

router.get('/', videoController.getAllVideos);
router.post('/', upload.single('videoFile'), videoController.uploadVideo);
router.put('/:id', videoController.updateVideo);
router.delete('/:id', videoController.deleteVideo);

module.exports = router;
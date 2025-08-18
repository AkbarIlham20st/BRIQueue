const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// Configure upload directory
const uploadDir = path.join(__dirname, '../../frontend/public/uploads/videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `video_${uuidv4()}${ext}`);
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
}).single('videoFile');

// Controller Methods

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password are required' 
      });
    }

    // In a real app, verify against database
    if (username === 'admin' && password === 'admin123') {
      req.session.admin = { username };
      return res.json({ 
        success: true,
        message: 'Login successful' 
      });
    }

    res.status(401).json({ 
      success: false,
      error: 'Invalid credentials' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to logout' 
      });
    }
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  });
};

const uploadVideoHandler = (req, res) => {
  uploadVideo(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        success: false,
        error: err.message 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    try {
      const filePath = `/uploads/videos/${req.file.filename}`;
      const duration = req.body.duration || 30;
      const displayOrder = req.body.displayOrder || 999;

      const result = await pool.query(
        `INSERT INTO display_contents 
         (content_type, content_value, duration, display_order)
         VALUES ('video', $1, $2, $3) RETURNING *`,
        [filePath, duration, displayOrder]
      );

      res.json({
        success: true,
        video: result.rows[0]
      });
    } catch (error) {
      console.error('Database error:', error);
      // Clean up uploaded file if DB fails
      fs.unlinkSync(path.join(uploadDir, req.file.filename));
      res.status(500).json({ 
        success: false,
        error: 'Database error' 
      });
    }
  });
};

const getVideos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM display_contents 
       WHERE content_type = 'video'
       ORDER BY display_order ASC`
    );
    res.json({
      success: true,
      videos: rows
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch videos' 
    });
  }
};

const updateVideoOrder = async (req, res) => {
  const { videos } = req.body;
  
  try {
    await pool.query('BEGIN');
    
    for (const video of videos) {
      await pool.query(
        `UPDATE display_contents 
         SET display_order = $1
         WHERE id = $2`,
        [video.order, video.id]
      );
    }
    
    await pool.query('COMMIT');
    res.json({ 
      success: true,
      message: 'Video order updated' 
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Update order error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update video order' 
    });
  }
};

const deleteVideo = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get video path first
    const { rows } = await pool.query(
      'SELECT content_value FROM display_contents WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Video not found' 
      });
    }

    const filePath = path.join(__dirname, '../../frontend/public', rows[0].content_value);
    
    // Delete from database
    await pool.query(
      'DELETE FROM display_contents WHERE id = $1',
      [id]
    );
    
    // Delete file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    
    res.json({ 
      success: true,
      message: 'Video deleted' 
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete video' 
    });
  }
};

const getDashboardData = async (req, res) => {
  try {
    // Example dashboard data
    const videosCount = await pool.query(
      "SELECT COUNT(*) FROM display_contents WHERE content_type = 'video'"
    );
    const queuesCount = await pool.query(
      "SELECT COUNT(*) FROM queues WHERE status = 'active'"
    );

    res.json({
      success: true,
      data: {
        videos: parseInt(videosCount.rows[0].count),
        queues: parseInt(queuesCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load dashboard data' 
    });
  }
};

module.exports = {
  login,
  logout,
  uploadVideoHandler,
  getVideos,
  updateVideoOrder,
  deleteVideo,
  getDashboardData,
  getSettingsPage: async (req, res) => {
        try {
            res.render('admin/settings', {
                title: 'Settings',
                user: req.session.admin
            });
        } catch (error) {
            console.error('Error getting settings page:', error);
            res.status(500).render('error', {
                message: 'Failed to load settings page',
                error: req.app.get('env') === 'development' ? error : null
            });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const adminId = req.session.admin.id;

            // Dapatkan password saat ini dari database
            const { rows } = await pool.query(
                'SELECT password FROM admins WHERE id = $1',
                [adminId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found'
                });
            }

            // Verifikasi password saat ini
            const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Hash password baru
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password di database
            await pool.query(
                'UPDATE admins SET password = $1 WHERE id = $2',
                [hashedPassword, adminId]
            );

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password'
            });
        }
    }
};
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Change password
exports.changePassword = async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ 
      success: false, 
      message: "Anda belum login. Silakan login terlebih dahulu." 
    });
  }
  
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  try {
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Semua field harus diisi" 
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Password baru dan konfirmasi password tidak cocok" 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password baru harus minimal 6 karakter" 
      });
    }
    
    // Verify current password
    const result = await pool.query(
      "SELECT password FROM admins WHERE id = $1", 
      [req.session.admin.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin tidak ditemukan" 
      });
    }
    
    const match = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!match) {
      return res.status(400).json({ 
        success: false, 
        message: "Password saat ini salah" 
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await pool.query(
      "UPDATE admins SET password = $1 WHERE id = $2",
      [hashedPassword, req.session.admin.id]
    );
    
    res.json({ 
      success: true, 
      message: "Password berhasil diubah" 
    });
    
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server saat mengubah password' 
    });
  }
};
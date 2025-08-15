const adminModel = require('../models/adminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await adminModel.authenticateAdmin(username, password);
    
    if (!admin) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Buat token JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'bankqueuesecret',
      { expiresIn: '8h' }
    );

    res.json({ 
      message: 'Login berhasil',
      token,
      admin: { id: admin.id, username: admin.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDisplayContents = async (req, res) => {
  try {
    const contents = await adminModel.getDisplayContents();
    const currencies = await adminModel.getCurrencyRates();
    
    res.json({ contents, currencies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addVideo = async (req, res) => {
  try {
    const { videoUrl, duration, displayOrder } = req.body;
    const video = await adminModel.addVideo(videoUrl, duration, displayOrder);
    
    res.json({
      message: 'Video berhasil ditambahkan',
      video
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = await adminModel.removeContent(contentId);
    
    if (!content) {
      return res.status(404).json({ error: 'Konten tidak ditemukan' });
    }
    
    res.json({
      message: 'Konten berhasil dihapus',
      content
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateContentOrder = async (req, res) => {
  try {
    const { contents } = req.body;
    await adminModel.updateContentOrder(contents);
    
    res.json({ message: 'Urutan konten berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateCurrencyRates = async (req, res) => {
  try {
    const { rates } = req.body;
    await adminModel.updateCurrencyRates(rates);
    
    res.json({ message: 'Kurs mata uang berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateInfoText = async (req, res) => {
  try {
    const { text } = req.body;
    const info = await adminModel.updateInfoText(text);
    
    res.json({
      message: 'Informasi berhasil diperbarui',
      info
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
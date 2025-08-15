const jwt = require('jsonwebtoken');

exports.authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak, token tidak ada' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bankqueuesecret');
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid' });
  }
};
const jwt = require('jsonwebtoken');

// Kunci rahasia untuk tanda tangan JWT (di produksi, taruh di .env)
const JWT_SECRET = 'SUPER_SECRET_KEY_PHOTOBOX_2026';

const verifyAdmin = (req, res, next) => {
  // Ambil token dari header Authorization: Bearer <TOKEN>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Pastikan user yang login adalah admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Akses dilarang. Anda bukan admin.' });
    }

    req.user = decoded;
    next(); // Lanjut ke fungsi API utama jika lolos pengecekan
  } catch (err) {
    return res.status(403).json({ error: 'Token tidak valid atau kadaluwarsa.' });
  }
};

module.exports = { verifyAdmin, JWT_SECRET };
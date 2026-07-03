const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { verifyAdmin, JWT_SECRET } = require('./middlewares/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Konfigurasi Multer (Sama seperti sebelumnya)
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, './uploads'); },
  filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

// --- ENDPOINT OTENTIKASI (LOGIN ADMIN) ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // CONTOH SEDERHANA: Di dunia nyata, cek ke database dan gunakan bcrypt
  if (username === 'admin' && password === 'admin123') {
    // Buat token JWT dengan payload role: 'admin'
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }

  res.status(401).json({ error: 'Username atau password salah!' });
});

// --- ENDPOINTS API ---

// GET /api/frames -> BISA DIAKSES SIAPAPUN (Klien & Admin butuh ini)
app.get('/api/frames', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) return res.json([]);
  
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Gagal' });
    const frames = files.map(file => ({
      name: file,
      url: `http://localhost:5000/uploads/${file}`
    }));
    res.json(frames);
  });
});

// POST /api/frames -> DIPROTEKSI (Hanya Admin)
// Tambahkan middleware 'verifyAdmin' sebelum fungsi upload
app.post('/api/frames', verifyAdmin, upload.single('frame'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tidak ada file' });
  res.json({ message: 'Sukses', url: `http://localhost:5000/uploads/${req.file.filename}` });
});

// DELETE /api/frames/:filename -> DIPROTEKSI (Hanya Admin)
app.delete('/api/frames/:filename', verifyAdmin, (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ message: 'Terhapus' });
  } else {
    res.status(404).json({ error: 'Tidak ditemukan' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend berjalan di port ${PORT}`));
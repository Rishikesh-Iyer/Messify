const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mess_feedback',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Create tables if they don't exist
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        reg_number VARCHAR(50) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        block_room VARCHAR(50) NOT NULL,
        mess_name VARCHAR(100) NOT NULL,
        mess_type VARCHAR(50) NOT NULL,
        quality_rating INT NOT NULL,
        quantity_rating INT NOT NULL,
        hygiene_rating INT NOT NULL,
        timing_rating INT NOT NULL,
        overall_rating INT NOT NULL,
        suggestion VARCHAR(255),
        comments TEXT,
        proof_filename VARCHAR(255),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
}

initializeDatabase();

// Routes

// User Registration
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, email, name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { id: result.insertId, name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Submit Feedback
app.post('/api/feedback', authenticateToken, upload.single('proof'), async (req, res) => {
  const {
    regNumber,
    studentName,
    blockRoom,
    messName,
    messType,
    qualityRating,
    quantityRating,
    hygieneRating,
    timingRating,
    overallRating,
    suggestion,
    comments
  } = req.body;

  if (!regNumber || !studentName || !blockRoom || !messName || !messType || 
      !qualityRating || !quantityRating || !hygieneRating || !timingRating || !overallRating) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    const proofFilename = req.file ? req.file.filename : null;

    const [result] = await pool.query(
      `INSERT INTO feedback (
        user_id, reg_number, student_name, block_room, mess_name, mess_type,
        quality_rating, quantity_rating, hygiene_rating, timing_rating, overall_rating,
        suggestion, comments, proof_filename
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, regNumber, studentName, blockRoom, messName, messType,
        qualityRating, quantityRating, hygieneRating, timingRating, overallRating,
        suggestion || null, comments || null, proofFilename
      ]
    );

    res.json({ 
      success: true,
      feedbackId: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get User Feedback History
app.get('/api/feedback/history', authenticateToken, async (req, res) => {
  try {
    const [feedback] = await pool.query(
      'SELECT * FROM feedback WHERE user_id = ? ORDER BY submitted_at DESC',
      [req.user.id]
    );
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch feedback history' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all active job postings
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM job_postings WHERE is_active = 1 ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Failed to fetch job postings' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Middleware to check if admin is logged in
const isAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// Admin Login Page
router.get('/login', (req, res) => {
  if (req.session.adminLoggedIn) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: null });
});

// Admin Login Post
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === process.env.ADMIN_USER) {
    // In a real app, you'd compare current hash. For this setup, we use .env hash.
    const match = await bcrypt.compare(password, process.env.ADMIN_PASS_HASH);
    if (match) {
      req.session.adminLoggedIn = true;
      return res.redirect('/admin/dashboard');
    }
  }
  
  res.render('admin/login', { error: 'Invalid username or password' });
});

// Admin Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin Dashboard (Applications Overview)
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const [totalApps] = await db.query('SELECT COUNT(*) as count FROM career_applications');
    const [newToday] = await db.query('SELECT COUNT(*) as count FROM career_applications WHERE DATE(submitted_at) = CURRENT_DATE');
    const [shortlisted] = await db.query('SELECT COUNT(*) as count FROM career_applications WHERE status = \'shortlisted\'');
    const [recentApps] = await db.query('SELECT * FROM career_applications ORDER BY submitted_at DESC LIMIT 10');
    
    res.render('admin/dashboard', {
        stats: {
            total: totalApps[0].count,
            today: newToday[0].count,
            shortlisted: shortlisted[0].count
        },
        recentApps
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Dashboard Error');
  }
});

// Admin - Manage Job Postings
router.get('/jobs', isAdmin, async (req, res) => {
    const [jobs] = await db.query('SELECT * FROM job_postings ORDER BY created_at DESC');
    res.render('admin/jobs', { jobs });
});

// Admin - Add Job Post Login
router.post('/jobs/add', isAdmin, async (req, res) => {
    const { title, location, experience, employment_type, description } = req.body;
    await db.query(
        'INSERT INTO job_postings (title, location, experience, employment_type, description) VALUES ($1, $2, $3, $4, $5)',
        [title, location, experience, employment_type, description]
    );
    res.redirect('/admin/jobs');
});

// Admin - Toggle Job Status
router.post('/jobs/toggle/:id', isAdmin, async (req, res) => {
    await db.query('UPDATE job_postings SET is_active = NOT is_active WHERE id = $1', [req.params.id]);
    res.redirect('/admin/jobs');
});

// Admin - View Applications with Filters
router.get('/applications', isAdmin, async (req, res) => {
    const { position, status, date_from, date_to } = req.query;
    let query = 'SELECT * FROM career_applications WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (position) {
        query += ` AND position = $${paramCount++}`;
        params.push(position);
    }
    if (status) {
        query += ` AND status = $${paramCount++}`;
        params.push(status);
    }
    if (date_from) {
        query += ` AND DATE(submitted_at) >= $${paramCount++}`;
        params.push(date_from);
    }
    if (date_to) {
        query += ` AND DATE(submitted_at) <= $${paramCount++}`;
        params.push(date_to);
    }

    query += ' ORDER BY submitted_at DESC';
    const [apps] = await db.query(query, params);
    const [positions] = await db.query('SELECT DISTINCT position FROM career_applications');

    res.render('admin/applications', { apps, positions, filters: req.query });
});

// Admin - Update Application Status
router.post('/applications/status/:id', isAdmin, async (req, res) => {
    await db.query('UPDATE career_applications SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
    res.redirect('/admin/applications');
});

module.exports = router;

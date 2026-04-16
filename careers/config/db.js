const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL from environment if available (for production)
// Otherwise use individual config variables
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Export pool directly for flexibility
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};

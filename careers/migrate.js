const { Pool } = require('pg');

const DATABASE_URL = "postgresql://cold_storage_user:c0CCSJfIbY68DqHZcjt3SkIJHRXkSuXr@cold-storage-prod-db.cluster-cpaowmow2t70.us-east-1.rds.amazonaws.com:5432/cold_storage";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const schema = `
CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    experience VARCHAR(100),
    employment_type VARCHAR(100),
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS career_applications (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    position VARCHAR(255) NOT NULL,
    resume_path VARCHAR(255) NOT NULL,
    cover_letter TEXT,
    status VARCHAR(50) DEFAULT 'new',
    ip_address VARCHAR(45),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting Migration...");
    await client.query(schema);
    console.log("Tables created successfully.");
    
    // Insert a dummy job if empty
    const { rows } = await client.query('SELECT COUNT(*) FROM job_postings');
    if (parseInt(rows[0].count) === 0) {
        await client.query("INSERT INTO job_postings (title, location, experience, employment_type, description) VALUES ('System Engineer', 'Bhubaneswar, Odisha', '2-5 Years', 'Full-time', 'Responsible for maintaining industrial automation systems.')");
        console.log("Initial job listing added.");
    }
  } catch (err) {
    console.error("Migration Failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();

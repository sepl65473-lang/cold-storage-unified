const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://cold_storage_user:c0CCSJfIbY68DqHZcjt3SkIJHRXkSuXr@cold-storage-prod.ck5qui62i949.us-east-1.rds.amazonaws.com:5432/cold_storage'
});

async function seed() {
  await client.connect();
  console.log('Connected to DB');

  // Check tables
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

  // Create jobs table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(255),
      location VARCHAR(255),
      type VARCHAR(100),
      description TEXT,
      requirements TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check count
  const count = await client.query('SELECT COUNT(*) FROM jobs');
  console.log('Current job count:', count.rows[0].count);

  if (parseInt(count.rows[0].count) === 0) {
    await client.query(`
      INSERT INTO jobs (title, department, location, type, description, requirements) VALUES
      ('IoT Systems Engineer', 'Engineering', 'Remote / Mumbai', 'Full-time',
       'Design and maintain cold storage IoT monitoring systems. Work with sensors, cloud infrastructure, and real-time dashboards.',
       '2+ years experience in IoT, Node.js, AWS. Knowledge of MQTT and time-series databases preferred.'),
      ('Full Stack Developer', 'Technology', 'Remote / Bhubaneswar', 'Full-time',
       'Build and maintain web applications for our cold storage management platform using React and Node.js.',
       '2+ years in React, Node.js, PostgreSQL. Experience with AWS a plus.'),
      ('Field Operations Executive', 'Operations', 'Odisha (On-site)', 'Full-time',
       'Oversee installation and maintenance of cold storage units across client sites in Odisha.',
       'Diploma/BE in Electrical or Mechanical. Willingness to travel. 1+ year in field operations.')
    `);
    console.log('3 sample jobs inserted!');
  } else {
    console.log('Jobs already exist — skipping seed.');
  }

  await client.end();
  console.log('Done!');
}

seed().catch(e => { console.error('Error:', e.message); process.exit(1); });

const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://cold_storage_user:c0CCSJfIbY68DqHZcjt3SkIJHRXkSuXr@cold-storage-prod.ck5qui62i949.us-east-1.rds.amazonaws.com:5432/cold_storage'
});

async function seed() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(`
      INSERT INTO jobs (title, department, location, type, description, requirements)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, ['System Engineer', 'Engineering', 'Remote/Mumbai', 'Full-time', 'Responsible for maintaining and optimizing our cold storage IoT infrastructure.', '3+ years experience, Node.js, AWS, IoT knowledge']);
    console.log('Seed job inserted successfully');
  } catch (err) {
    console.error('Error seeding:', err);
  } finally {
    await client.end();
  }
}

seed();

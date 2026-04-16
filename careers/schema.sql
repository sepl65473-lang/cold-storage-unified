-- Career Page Database Schema
-- Database: smaatech_careers (or your preferred name)

CREATE TABLE IF NOT EXISTS job_postings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  experience VARCHAR(100) NOT NULL,
  employment_type VARCHAR(50) DEFAULT 'Full-Time',
  description TEXT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS career_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  position VARCHAR(100) NOT NULL,
  resume_path VARCHAR(255) NOT NULL,
  cover_letter TEXT,
  ip_address VARCHAR(45),
  status ENUM('new','reviewed','shortlisted','rejected') DEFAULT 'new',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(ip_address, attempted_at)
);

-- Seed Initial Data
INSERT INTO job_postings (title, location, experience, employment_type, description) VALUES
('Mechanical Engineer', 'Odisha, India', '2–5 Years', 'Full-Time', 'Responsible for design, analysis and maintenance of mechanical systems at project sites.'),
('Site Supervisor', 'Mumbai, India', '3–6 Years', 'Full-Time', 'Oversee daily site operations, manage workforce and ensure project timelines are met.'),
('QA/QC Engineer', 'Remote / On-site', '2–4 Years', 'Full-Time', 'Ensure quality standards are met across all engineering processes and documentation.');

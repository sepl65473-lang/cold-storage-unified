# Deployment Guide: Smaatech Careers Portal

This project is built using Node.js, Express, and MySQL. It serves a Careers page and a secure Admin Panel.

## 1. Prerequisites
- **Node.js**: Version 18 or higher.
- **MySQL**: Local or cloud-based server.
- **SMTP**: For emails (Gmail App Password recommended).

## 2. Database Setup
1. Log into your MySQL server.
2. Create a database (e.g., `smaatech_careers`).
3. Run the SQL commands found in `careers/schema.sql`.

## 3. Configuration (.env)
Open `careers/.env` and update the following:
- `DB_PASSWORD`: Your MySQL root/user password.
- `SMTP_USER`: `Info@smaatechengineering.com` (Already set).
- `SMTP_PASS`: Your Gmail App Password or SMTP key.
- `ADMIN_PASS_HASH`: To generate a new password, use a bcrypt generator or the provided default.

## 4. Installation
```bash
cd careers
npm install
```

## 5. Running the Application
- **Development**: `npm run dev` (starts on port 5000).
- **Production**: `npm start`.

## 6. Accessing the Portal
- **Career Page**: `http://localhost:5000/career`
- **Admin Login**: `http://localhost:5000/admin/login`

## 7. Security Notes
- **Resume Storage**: Uploaded resumes are hidden from direct public view but accessible via the `/uploads` route in Admin.
- **Rate Limiting**: Users can only submit 5 applications per hour from the same IP.
- **Cleanup**: Regularly clear the `uploads/resumes` folder for obsolete applications.

const FormData = require('form-data');
const fs = require('fs');
const http = require('http'); // or https if needed
const https = require('https');

async function testApply() {
  const form = new FormData();
  form.append('full_name', 'Test Applicant');
  form.append('email', 'testapplicant@smaatechengineering.com');
  form.append('phone', '1234567890');
  form.append('position', 'System Engineer');
  form.append('cover_letter', 'This is a test cover letter for the live site verification.');
  form.append('resume', fs.createReadStream('dummy_resume.pdf'));

  const options = {
    hostname: 'd3vnr4g2fo6uaz.cloudfront.net',
    path: '/api/apply',
    method: 'POST',
    headers: form.getHeaders()
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error('Request Error:', e.message);
  });

  form.pipe(req);
}

testApply();

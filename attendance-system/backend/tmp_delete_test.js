const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: '1759703084089', username: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/api/admin/sections/section_1759703231537',
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log('status', res.statusCode);
  console.log('headers', res.headers);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('body', data);
  });
});

req.on('error', (e) => console.error('err full', e));
req.end();

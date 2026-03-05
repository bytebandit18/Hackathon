const fs = require('fs');
const crypto = require('crypto');
const data = 'data:image/jpeg;base64,' + crypto.randomBytes(1024*1024).toString('base64');
fetch('http://127.0.0.1:3000/api/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: data })
}).then(r => console.log(r.status)).catch(console.error);

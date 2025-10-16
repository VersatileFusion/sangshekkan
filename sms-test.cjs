const http = require('http');
const kavenegar = require('kavenegar');

const apiKey = '6330784E63442F627734617951766468584C716374414B376764535A376F7030723078692F764D785644513D';
const api = kavenegar.KavenegarApi({ apikey: apiKey });

async function sendSMS(phone, code) {
  let receptor = phone;
  if (receptor.startsWith('+98')) receptor = '0' + receptor.slice(3);
  else if (receptor.startsWith('98')) receptor = '0' + receptor.slice(2);
  else if (!receptor.startsWith('0')) receptor = '0' + receptor;
  
  return new Promise((resolve, reject) => {
    api.Send({
      message: `کد تایید شما: ${code}\nاعتبار: 2 دقیقه`,
      sender: '2000660110',
      receptor: receptor
    }, (response, status) => {
      if (status === 200) {
        console.log(`✓ SMS SENT to ${receptor}: ${code}`);
        resolve(true);
      } else {
        console.error(`✗ FAILED: ${status}`, response);
        reject(new Error(`SMS failed: ${status}`));
      }
    });
  });
}

const otpStore = new Map();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/api/auth/register') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { phone } = JSON.parse(body);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(phone, { code, expiresAt: Date.now() + 2 * 60 * 1000 });
        
        await sendSMS(phone, code);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'کد تایید ارسال شد', phone, expiresIn: 120 }));
      } catch (err) {
        console.error('ERROR:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/api/auth/verify-otp') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { phone, code } = JSON.parse(body);
        const record = otpStore.get(phone);
        
        if (!record || record.code !== code || Date.now() > record.expiresAt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'کد نامعتبر یا منقضی' }));
          return;
        }
        
        otpStore.delete(phone);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ verified: true, phone }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'خطای سرور' }));
      }
    });
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(4000, () => {
  console.log('\n✓ Server: http://localhost:4000');
  console.log('✓ Real SMS enabled\n');
});


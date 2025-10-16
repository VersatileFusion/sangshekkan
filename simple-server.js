const http = require('http');

// Kavenegar SMS
async function sendSMS(phone, code) {
  const kavenegar = require('kavenegar');
  const apiKey = '6330784E63442F627734617951766468584C716374414B376764535A376F7030723078692F764D785644513D';
  const api = kavenegar.KavenegarApi({ apikey: apiKey });
  
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
        console.log(`✓ SMS sent to ${receptor}: ${code}`);
        resolve(true);
      } else {
        console.error(`✗ SMS failed: ${status}`, response);
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
        const cleanPhone = phone.replace(/[\s-]/g, '');
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 2 * 60 * 1000;
        
        otpStore.set(cleanPhone, { code, expiresAt });
        
        await sendSMS(cleanPhone, code);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'کد تایید ارسال شد', 
          phone: cleanPhone, 
          expiresIn: 120 
        }));
      } catch (err) {
        console.error('Register error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'خطا در ارسال پیامک' }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/api/auth/verify-otp') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { phone, code } = JSON.parse(body);
        const cleanPhone = phone.replace(/[\s-]/g, '');
        const record = otpStore.get(cleanPhone);
        
        if (!record || record.code !== code || Date.now() > record.expiresAt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'کد نامعتبر یا منقضی' }));
          return;
        }
        
        otpStore.delete(cleanPhone);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ verified: true, phone: cleanPhone }));
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

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`\n✓ Server ready: http://localhost:${PORT}`);
  console.log(`✓ SMS will be sent to real phone numbers\n`);
});


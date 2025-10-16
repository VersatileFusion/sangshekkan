import WebSocket from 'ws';

const url = process.argv[2] || 'ws://localhost:4000/api/ws';
const ws = new WebSocket(url);
ws.on('open', () => {
  console.log('WS connected');
  ws.send(JSON.stringify({ type: 'subscribe', rooms: ['panel:TOP_STUDENTS'] }));
});
ws.on('message', (data) => {
  try { console.log('WS message:', JSON.parse(data.toString())); } catch { console.log('WS message:', String(data)); }
});
ws.on('close', () => console.log('WS closed'));
ws.on('error', (e) => console.error('WS error', e));




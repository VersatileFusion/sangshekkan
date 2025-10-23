// File: apps/web/index.js
import { serve } from '@hono/node-server';
import app from './build/server/index.js';

const port = process.env.PORT || 3000;

console.log(`Starting server on port ${port}`);

// Add error handling for port conflicts
const server = serve({
  fetch: app.fetch,
  port: port,
}, (info) => {
  console.log(`🚀 Server running at http://localhost:${info.port}`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Trying port ${port + 1}`);
    // Try next port
    const newPort = parseInt(port) + 1;
    serve({
      fetch: app.fetch,
      port: newPort,
    }, (info) => {
      console.log(`🚀 Server running at http://localhost:${info.port}`);
    });
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});


// Render-compatible server entry point
import { serve } from '@hono/node-server';
import app from './build/server/index.js';

const port = process.env.PORT || 3000;

console.log(`🚀 Starting server on port ${port}`);

serve({
  fetch: app.fetch,
  port: port,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
});

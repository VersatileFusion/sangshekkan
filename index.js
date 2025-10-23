// File: apps/web/index.js
import app from './build/server/index.js';

// The app is already being served by createHonoServer in production
// We just need to export it for Render to use
console.log('🚀 Server configured and ready');

export default app;


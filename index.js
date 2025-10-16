// File: apps/web/index.js
import { handle } from 'hono/vercel';
import app from './build/server/index.js';

export const config = { runtime: 'nodejs' };

export default handle(app);


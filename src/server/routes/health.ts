import { Hono } from 'hono';
import { getHealth } from '../controllers/healthController';

const router = new Hono();

router.get('/health', (c) => c.json(getHealth()));

export default router;







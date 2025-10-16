import { Hono } from 'hono';
import { requestId } from 'hono/request-id';
import routes from './routes';
import { security } from './middlewares/security';
import { corsMiddleware } from './middlewares/cors';
import { errorHandler } from './middlewares/errorHandler';

export function createServerApp() {
  const app = new Hono();
  app.use('*', requestId());
  app.use('*', security);
  app.use('*', corsMiddleware());
  app.use('*', errorHandler);

  app.route('/api', routes);
  return app;
}







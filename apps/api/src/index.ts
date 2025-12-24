import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { companies } from './routes/companies';
import { logos } from './routes/logos';
import { search } from './routes/search';
import { apiKeyAuth } from './middleware/api-key';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  LOGOS_BUCKET: R2Bucket;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:4321', 'https://assetpipe.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Request-Id'],
  maxAge: 86400,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'AssetPipe API',
    version: '1.0.0',
    status: 'healthy',
  });
});

// API v1 routes (require API key)
const v1 = new Hono<{ Bindings: Env }>();
v1.use('*', apiKeyAuth);
v1.route('/companies', companies);
v1.route('/logos', logos);
v1.route('/search', search);

app.route('/v1', v1);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: c.env.ENVIRONMENT === 'production'
        ? 'An internal error occurred'
        : err.message,
    },
  }, 500);
});

export default app;

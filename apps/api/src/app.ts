import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { registerErrorHandler } from './error-handler.js';
import { createAuthRoutes } from './routes/auth.js';
import { createClientsRoutes } from './routes/clients.js';
import { createDashboardRoutes } from './routes/dashboard.js';
import { createHealthRoute } from './routes/health.js';
import { createInvoicesRoutes } from './routes/invoices.js';
import { createMeRoutes } from './routes/me.js';
import type { AppDeps, AppEnv } from './types.js';

export function createApp(deps: AppDeps) {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });

  app.use('*', logger());
  app.use('*', cors({ origin: deps.env.corsOrigin ?? '*' }));
  app.use('*', secureHeaders());

  // registerErrorHandler wires app.onError(...) - it must be registered
  // before any route so validation/thrown errors are always funneled
  // through a single, consistent error-response shape.
  registerErrorHandler(app);

  const v1 = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  })
    .route('/auth', createAuthRoutes(deps))
    .route('/me', createMeRoutes(deps))
    .route('/clients', createClientsRoutes(deps))
    .route('/invoices', createInvoicesRoutes(deps))
    .route('/dashboard', createDashboardRoutes(deps));

  // Route chaining preserves the schema required by Hono's RPC client.
  // Auth endpoints remain outside the protected /api/v1 middleware.
  const routes = app
    .route('/health', createHealthRoute(deps))
    .route('/api/v1', v1);

  routes.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'PagManager API',
      version: '0.1.0',
    },
  });

  return routes.get(
    '/docs',
    Scalar({
      url: '/openapi.json',
      pageTitle: 'PagManager API',
    }),
  );
}

export type App = ReturnType<typeof createApp>;
export type AppType = App;

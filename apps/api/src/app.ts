import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { authMiddleware } from './auth/middleware.js';
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

  app.route('/health', createHealthRoute(deps));

  // Auth endpoints are intentionally mounted before/outside the
  // `authMiddleware` scoping below - registering/logging in must be
  // reachable without a token.
  app.route('/api/v1/auth', createAuthRoutes(deps));

  const v1 = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });

  v1.use('*', authMiddleware(deps));
  v1.route('/me', createMeRoutes(deps));
  v1.route('/clients', createClientsRoutes(deps));
  v1.route('/invoices', createInvoicesRoutes(deps));
  v1.route('/dashboard', createDashboardRoutes(deps));

  app.route('/api/v1', v1);

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'PagManager API',
      version: '0.1.0',
    },
  });

  app.get(
    '/docs',
    Scalar({
      url: '/openapi.json',
      pageTitle: 'PagManager API',
    }),
  );

  return app;
}

export type App = ReturnType<typeof createApp>;

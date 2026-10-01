import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { NONCE, secureHeaders } from 'hono/secure-headers';

import { registerErrorHandler } from './error-handler.js';
import { MAX_REQUEST_BODY_BYTES } from './request-limits.js';
import { createAuthRoutes } from './routes/auth.js';
import { createClientsRoutes } from './routes/clients.js';
import { createDashboardRoutes } from './routes/dashboard.js';
import { createHealthRoute } from './routes/health.js';
import { createInvoicesRoutes } from './routes/invoices.js';
import { createMeRoutes } from './routes/me.js';
import type { AppDeps, AppEnv } from './types.js';

function scalarContentSecurityPolicy(nonce: string | undefined): string {
  const nonceSource = nonce ? `'nonce-${nonce}'` : '';
  return [
    "default-src 'self'",
    `script-src 'self' https://cdn.jsdelivr.net ${nonceSource}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://cdn.jsdelivr.net",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; ');
}

export function createApp(deps: AppDeps) {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });

  app.use('*', logger());
  const corsOrigin =
    deps.env.nodeEnv === 'production'
      ? (deps.env.corsOrigin ?? '')
      : (deps.env.corsOrigin ?? '*');
  app.use('*', cors({ origin: corsOrigin }));

  // Scalar needs a narrowly scoped CSP exception for its inline styles and
  // the script it loads from jsDelivr. Register this wrapper outside
  // secureHeaders so it can replace the general policy after the response is
  // produced. The SPA keeps the stricter self-only policy below.
  app.use('/docs', async (c, next) => {
    await next();
    c.header(
      'Content-Security-Policy',
      scalarContentSecurityPolicy(c.get('secureHeadersNonce')),
    );
  });

  app.use(
    '*',
    secureHeaders({
      xFrameOptions: 'DENY',
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'", 'https://viacep.com.br'],
        fontSrc: ["'self'", 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", NONCE],
        // Sonner and Radix inject inline style elements without consistently
        // attaching a nonce. Scripts remain restricted to self and the nonce.
        styleSrc: ["'self'", "'unsafe-inline'"],
        styleSrcAttr: ["'unsafe-inline'"],
      },
    }),
  );

  if (deps.env.nodeEnv === 'production') {
    // Keep the typed OpenAPI routes registered for RPC consumers, while
    // short-circuiting public documentation before the generators can run.
    app.use('/docs', async (c) => c.notFound());
    app.use('/docs/*', async (c) => c.notFound());
    app.use('/openapi.json', async (c) => c.notFound());
  }

  app.use('*', bodyLimit({ maxSize: MAX_REQUEST_BODY_BYTES }));

  // registerErrorHandler wires app.onError(...) - it must be registered
  // before any route so validation/thrown errors are always funneled
  // through a single, consistent error-response shape.
  registerErrorHandler(app, deps.env.nodeEnv);
  app.openAPIRegistry.registerComponent('securitySchemes', 'BearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  const healthRoute = createHealthRoute(deps, 'getHealth');

  const v1 = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  })
    .route('/health', createHealthRoute(deps, 'getApiV1Health'))
    .route('/auth', createAuthRoutes(deps))
    .route('/me', createMeRoutes(deps))
    .route('/clients', createClientsRoutes(deps))
    .route('/invoices', createInvoicesRoutes(deps))
    .route('/dashboard', createDashboardRoutes(deps));

  // Route chaining preserves the schema required by Hono's RPC client.
  // Auth endpoints remain outside the protected /api/v1 middleware.
  const routes = app.route('/health', healthRoute).route('/api/v1', v1);

  routes.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'PagManager API',
      version: '0.1.0',
    },
  });

  return routes.get(
    '/docs',
    Scalar((c) => {
      const nonce = c.get('secureHeadersNonce');
      return {
        url: '/openapi.json',
        pageTitle: 'PagManager API',
        ...(nonce ? { nonce } : {}),
      };
    }),
  );
}

export type App = ReturnType<typeof createApp>;
export type AppType = App;

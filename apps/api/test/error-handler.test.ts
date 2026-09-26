import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { registerErrorHandler } from '../src/error-handler.js';
import { AppError } from '../src/errors.js';

function buildApp() {
  const app = new Hono();

  app.get('/zod', () => {
    const schema = z.object({ name: z.string() });
    schema.parse({});
    return new Response('unreachable');
  });

  app.get('/bad-request', () => {
    throw AppError.badRequest('bad', { field: 'x' });
  });

  app.get('/unauthorized', () => {
    throw AppError.unauthorized('nope');
  });

  app.get('/conflict-pg', () => {
    const err = new Error('duplicate key value') as Error & { code: string };
    err.code = '23505';
    throw err;
  });

  app.get('/boom', () => {
    throw new Error('secret internal detail');
  });

  registerErrorHandler(app);
  return app;
}

describe('registerErrorHandler', () => {
  it('maps ZodError to 400 VALIDATION_ERROR', async () => {
    const app = buildApp();
    const res = await app.request('/zod');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('maps AppError.badRequest to 400 with details', async () => {
    const app = buildApp();
    const res = await app.request('/bad-request');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('BAD_REQUEST');
    expect(body.details).toEqual({ field: 'x' });
  });

  it('maps AppError.unauthorized to 401', async () => {
    const app = buildApp();
    const res = await app.request('/unauthorized');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('maps Postgres unique violation to 409 CONFLICT', async () => {
    const app = buildApp();
    const res = await app.request('/conflict-pg');
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('CONFLICT');
  });

  it('maps unknown errors to 500 without leaking internals', async () => {
    const app = buildApp();
    const res = await app.request('/boom');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(body)).not.toContain('secret internal detail');
  });
});

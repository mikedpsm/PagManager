import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { createApp } from '../src/app.js';
import {
  closeTestApp,
  createTestApp,
  type TestApp,
} from './helpers/testApp.js';

describe('createApp', () => {
  let testApp: TestApp;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    testApp = await createTestApp({ corsOrigin: 'http://localhost:3000' });
    app = testApp.app;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('GET /health returns 200 with status ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('GET /openapi.json returns a JSON OpenAPI document', async () => {
    const res = await app.request('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body.openapi).toBe('3.1.0');
    expect(body.info.title).toBe('PagManager API');
  });

  it('GET /docs returns an HTML page', async () => {
    const res = await app.request('/docs');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('sends the configured CORS origin header', async () => {
    const res = await app.request('/health', {
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:3000',
    );
  });

  it('sends secure headers such as X-Content-Type-Options', async () => {
    const res = await app.request('/health');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('protects /api/v1 routes with the auth middleware', async () => {
    const res = await app.request('/api/v1/me');
    expect(res.status).toBe(401);
  });

  it('does not protect /api/v1/auth routes with the auth middleware', async () => {
    const res = await app.request('/api/v1/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'someone@example.com' }),
    });
    expect(res.status).toBe(200);
  });
});

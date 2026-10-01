import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { MAX_REQUEST_BODY_BYTES } from '../src/request-limits.js';
import { mountStaticAssets } from '../src/server.js';
import {
  closeTestApp,
  createTestApp,
  type TestApp,
} from './helpers/testApp.js';

describe('createApp', () => {
  let testApp: TestApp;
  let app: ReturnType<typeof createApp>;
  let staticDir: string | undefined;

  beforeAll(async () => {
    testApp = await createTestApp({ corsOrigin: 'http://localhost:3000' });
    app = testApp.app;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
    if (staticDir) {
      await rm(staticDir, { recursive: true, force: true });
    }
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
    expect(Object.keys(body.paths)).not.toHaveLength(0);
  });

  it('GET /docs returns an HTML page', async () => {
    const res = await app.request('/docs');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    const policy = res.headers.get('content-security-policy') ?? '';
    const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
    expect(nonce).toBeTruthy();
    expect(policy).toContain('https://cdn.jsdelivr.net');
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(html).toContain(`nonce="${nonce}"`);
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
    const policy = res.headers.get('content-security-policy') ?? '';
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
    const connectSrc = policy
      .split(';')
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith('connect-src '));
    expect(connectSrc).toContain("connect-src 'self' https://viacep.com.br");
    expect(connectSrc?.split(/\s+/)).not.toContain('https:');
    expect(policy).not.toContain('https://cdn.jsdelivr.net');
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it('enforces the configured production CORS origin without a wildcard fallback', async () => {
    const productionApp = createApp({
      db: testApp.db,
      env: {
        ...testApp.env,
        nodeEnv: 'production',
        corsOrigin: 'https://pagmanager.example',
      },
    });

    const allowed = await productionApp.request('/health', {
      headers: { Origin: 'https://pagmanager.example' },
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe(
      'https://pagmanager.example',
    );

    const blocked = await productionApp.request('/health', {
      headers: { Origin: 'https://attacker.example' },
    });
    expect(blocked.headers.get('access-control-allow-origin')).toBeNull();

    const preflight = await productionApp.request('/api/v1/auth/check-email', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://pagmanager.example',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe(
      'https://pagmanager.example',
    );

    const unauthenticated = await productionApp.request('/api/v1/me', {
      headers: { Origin: 'https://pagmanager.example' },
    });
    expect(unauthenticated.status).toBe(401);
  });

  it('caps request bodies at 100 KiB by byte length before JSON parsing', async () => {
    const prefix = '{"email":"body-limit@example.com","padding":"';
    const suffix = '"}';
    const bodyOfSize = (size: number) => {
      const contentBytes = size - Buffer.byteLength(prefix + suffix);
      const padding =
        'é'.repeat(Math.floor(contentBytes / 2)) +
        (contentBytes % 2 === 1 ? 'x' : '');
      const body = `${prefix}${padding}${suffix}`;
      expect(Buffer.byteLength(body)).toBe(size);
      return body;
    };
    const endpoint = '/api/v1/auth/check-email';
    const exactBody = bodyOfSize(MAX_REQUEST_BODY_BYTES);
    const exactResponse = await app.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(exactBody)),
      },
      body: exactBody,
    });
    expect(exactResponse.status).toBe(200);

    const oversizedBody = bodyOfSize(MAX_REQUEST_BODY_BYTES + 1);
    const oversizedResponse = await app.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(oversizedBody)),
      },
      body: oversizedBody,
    });
    expect(oversizedResponse.status).toBe(413);
    expect(await oversizedResponse.json()).toEqual({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body must not exceed 100 KiB',
    });

    const streamedRequest = new Request(`http://localhost${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(oversizedBody));
          controller.close();
        },
      }),
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });
    expect(streamedRequest.headers.has('content-length')).toBe(false);
    const streamedResponse = await app.fetch(streamedRequest);
    expect(streamedResponse.status).toBe(413);
  });

  it('returns production docs and OpenAPI 404s even when the SPA is mounted', async () => {
    const productionApp = createApp({
      db: testApp.db,
      env: {
        ...testApp.env,
        nodeEnv: 'production',
        corsOrigin: 'https://pagmanager.example',
      },
    });
    staticDir = await mkdtemp(path.join(os.tmpdir(), 'pagmanager-static-'));
    await writeFile(
      path.join(staticDir, 'index.html'),
      '<!doctype html><html><body>SPA shell</body></html>',
    );
    mountStaticAssets(productionApp, staticDir);

    const home = await productionApp.request('/');
    expect(home.status).toBe(200);
    expect(home.headers.get('content-security-policy')).toContain(
      "default-src 'self'",
    );

    for (const route of ['/docs', '/openapi.json']) {
      const response = await productionApp.request(route);
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).not.toContain('text/html');
      expect(await response.text()).not.toContain('SPA shell');
    }
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

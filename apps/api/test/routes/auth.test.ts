import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { createApp } from '../../src/app.js';
import {
  closeTestApp,
  createTestApp,
  requestFromIp,
  type TestApp,
} from '../helpers/testApp.js';

describe('auth routes', () => {
  let testApp: TestApp;
  let app: ReturnType<typeof createApp>;
  let requestIp = '';
  let nextRequestIp = 1;

  beforeAll(async () => {
    testApp = await createTestApp();
    ({ app } = testApp);
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  beforeEach(() => {
    requestIp = `2001:db8::${nextRequestIp++}`;
  });

  function post(path: string, body: unknown) {
    return requestFromIp(
      app,
      path,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      requestIp,
    );
  }

  it('registers a new user and never leaks the password hash', async () => {
    const res = await post('/api/v1/auth/register', {
      username: 'Alice',
      email: 'alice@example.com',
      passwd: 'supersecret',
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.token).toBeTypeOf('string');
    expect(body.user.email).toBe('alice@example.com');
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expect(JSON.stringify(body)).not.toContain('supersecret');
  });

  it('rejects invalid registration input with 400', async () => {
    const res = await post('/api/v1/auth/register', {
      username: '',
      email: 'not-an-email',
      passwd: 'short',
    });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate email registration with 409 (real duplicate check)', async () => {
    await post('/api/v1/auth/register', {
      username: 'Bob',
      email: 'bob@example.com',
      passwd: 'supersecret',
    });

    const res = await post('/api/v1/auth/register', {
      username: 'Bob Two',
      email: 'bob@example.com',
      passwd: 'anotherpassword',
    });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    await post('/api/v1/auth/register', {
      username: 'Carol',
      email: 'carol@example.com',
      passwd: 'correcthorse',
    });

    const res = await post('/api/v1/auth/login', {
      email: 'carol@example.com',
      passwd: 'correcthorse',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTypeOf('string');
    expect(body.user.email).toBe('carol@example.com');
  });

  it('returns a generic 401 for unknown email (does not leak which check failed)', async () => {
    const res = await post('/api/v1/auth/login', {
      email: 'nobody@example.com',
      passwd: 'whatever1',
    });
    expect(res.status).toBe(401);
  });

  it('returns the same generic 401 for a wrong password', async () => {
    await post('/api/v1/auth/register', {
      username: 'Dave',
      email: 'dave@example.com',
      passwd: 'correctpassword',
    });

    const res = await post('/api/v1/auth/login', {
      email: 'dave@example.com',
      passwd: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('check-email reports unavailable for a taken email and available otherwise', async () => {
    await post('/api/v1/auth/register', {
      username: 'Erin',
      email: 'erin@example.com',
      passwd: 'supersecret',
    });

    const taken = await post('/api/v1/auth/check-email', {
      email: 'erin@example.com',
    });
    expect(await taken.json()).toEqual({ available: false });

    const free = await post('/api/v1/auth/check-email', {
      email: 'nobody-yet@example.com',
    });
    expect(await free.json()).toEqual({ available: true });
  });

  it('rate limits login before JSON validation and ignores forwarded IP headers', async () => {
    const limitedTestApp = await createTestApp();
    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const res = await requestFromIp(
          limitedTestApp.app,
          '/api/v1/auth/login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forwarded-For': `192.0.2.${attempt + 1}`,
            },
            body: JSON.stringify({
              email: 'unknown@example.com',
              passwd: 'wrongpassword',
            }),
          },
          '2001:db8::100',
        );
        expect(res.status).toBe(401);
      }

      const otherIp = await requestFromIp(
        limitedTestApp.app,
        '/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'unknown@example.com',
            passwd: 'wrongpassword',
          }),
        },
        '2001:db8::101',
      );
      expect(otherIp.status).toBe(401);

      const blocked = await requestFromIp(
        limitedTestApp.app,
        '/api/v1/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': '198.51.100.123',
          },
          body: '{malformed JSON',
        },
        '2001:db8::100',
      );
      expect(blocked.status).toBe(429);
      expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
      expect(await blocked.json()).toEqual({
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      });

      // The register counter is independent from login's counter.
      const register = await requestFromIp(
        limitedTestApp.app,
        '/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Rate limit test',
            email: 'rate-limit-test@example.com',
            passwd: 'valid-password',
          }),
        },
        '2001:db8::100',
      );
      expect(register.status).toBe(201);
    } finally {
      await closeTestApp(limitedTestApp);
    }
  });
});

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { createApp } from '../../src/app.js';
import {
  closeTestApp,
  createTestApp,
  type TestApp,
} from '../helpers/testApp.js';

describe('auth routes', () => {
  let testApp: TestApp;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    testApp = await createTestApp();
    ({ app } = testApp);
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  function post(path: string, body: unknown) {
    return app.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
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
});

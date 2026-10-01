import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { createApp } from '../../src/app.js';
import {
  authedRequest,
  closeTestApp,
  createTestApp,
  registerUser,
  requestFromIp,
  type TestApp,
} from '../helpers/testApp.js';

describe('me routes', () => {
  let testApp: TestApp;
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    ({ app } = testApp);

    ({ token } = await registerUser(app, {
      username: 'Me User',
      email: 'me@example.com',
    }));
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  const authed = (path: string, init: RequestInit = {}) =>
    authedRequest(app, token)(path, init);

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/v1/me');
    expect(res.status).toBe(401);
  });

  it('GET / returns the current user without the password hash', async () => {
    const res = await authed('/api/v1/me');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('me@example.com');
    expect(JSON.stringify(body)).not.toContain('passwordHash');
  });

  it('PATCH / updates only the provided fields', async () => {
    const res = await authed('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'Updated Name' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe('Updated Name');
    expect(body.email).toBe('me@example.com');
  });

  it('PATCH / preserves a leading-zero CPF as a string', async () => {
    const res = await authed('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ cpf: '00000000353' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cpf).toBe('00000000353');
  });

  it('PATCH / rejects a duplicate email belonging to another user', async () => {
    await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Other User',
        email: 'other@example.com',
        passwd: 'supersecret',
      }),
    });

    const res = await authed('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ email: 'other@example.com' }),
    });
    expect(res.status).toBe(409);
  });

  it('PATCH / rejects invalid input with 400', async () => {
    const res = await authed('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    expect(res.status).toBe(400);
  });

  it('PATCH / requires the current password before changing the password', async () => {
    const res = await authed('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({
        passwd: 'replacement-password',
        confirmPasswd: 'replacement-password',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH / rejects an incorrect current password before changing any profile fields', async () => {
    const res = await authed('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({
        username: 'Must Not Be Saved',
        passwd: 'replacement-password',
        confirmPasswd: 'replacement-password',
        currentPasswd: 'incorrect-current-password',
      }),
    });

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('FORBIDDEN');

    const profile = await authed('/api/v1/me');
    expect((await profile.json()).username).toBe('Updated Name');
  });

  it('PATCH / changes the password after verifying the current password', async () => {
    const res = await authed('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({
        passwd: 'replacement-password',
        confirmPasswd: 'replacement-password',
        currentPasswd: 'supersecret',
      }),
    });

    expect(res.status).toBe(200);
    const updatedUser = await res.json();
    expect(JSON.stringify(updatedUser)).not.toContain('passwordHash');

    const oldPasswordLogin = await requestFromIp(
      app,
      '/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'me@example.com',
          passwd: 'supersecret',
        }),
      },
      '2001:db8::200',
    );
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await requestFromIp(
      app,
      '/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'me@example.com',
          passwd: 'replacement-password',
        }),
      },
      '2001:db8::200',
    );
    expect(newPasswordLogin.status).toBe(200);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { signAuthToken, verifyAuthToken } from '../../src/auth/jwt.js';

const JWT_SECRET = 'test-secret-used-only-in-the-jwt-unit-test';

describe('auth JWT lifetime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets a one-hour expiry and rejects the token once that hour passes', async () => {
    vi.useFakeTimers();
    const issuedAt = new Date('2026-10-01T12:00:00.000Z');
    vi.setSystemTime(issuedAt);

    const token = await signAuthToken('user-1', JWT_SECRET);
    const payload = await verifyAuthToken(token, JWT_SECRET);
    expect(payload.exp - payload.iat).toBe(60 * 60);

    vi.setSystemTime(new Date(issuedAt.getTime() + 59 * 60 * 1000));
    await expect(verifyAuthToken(token, JWT_SECRET)).resolves.toMatchObject({
      sub: 'user-1',
    });

    vi.setSystemTime(new Date(issuedAt.getTime() + 60 * 60 * 1000 + 1000));
    await expect(verifyAuthToken(token, JWT_SECRET)).rejects.toThrow();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedFetch } from './api';
import { getAccessToken, getStoredUser, storeSession } from './auth-storage';

describe('authenticatedFetch session handling', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('clears the stored session after an expired token returns 401', async () => {
    storeSession({
      token: 'expired-token',
      user: {
        id: '6f61ad58-06fc-47fd-8c9a-4533e9206d16',
        username: 'Example User',
        email: 'example@example.com',
      },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await authenticatedFetch('/api/v1/me');

    expect(response.status).toBe(401);
    expect(getAccessToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(requestInit.headers).get('Authorization')).toBe(
      'Bearer expired-token',
    );
  });

  it('keeps the session when an authenticated request succeeds', async () => {
    storeSession({
      token: 'valid-token',
      user: {
        id: '6f61ad58-06fc-47fd-8c9a-4533e9206d16',
        username: 'Example User',
        email: 'example@example.com',
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );

    await authenticatedFetch('/api/v1/me');

    expect(getAccessToken()).toBe('valid-token');
    expect(getStoredUser()?.email).toBe('example@example.com');
  });
});

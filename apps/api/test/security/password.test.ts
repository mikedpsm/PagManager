import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '../../src/security/password.js';

describe('password hashing', () => {
  it('produces a hash matching the expected pbkdf2$<iterations>$<salt>$<hash> format', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(
      /^pbkdf2\$\d+\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/,
    );
  });

  it('encodes exactly 600000 iterations', async () => {
    const hash = await hashPassword('correct horse battery staple');
    const [, iterations] = hash.split('$');
    expect(iterations).toBe('600000');
  });

  it('round-trips: verifyPassword returns true for the correct password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(
      verifyPassword('correct horse battery staple', hash),
    ).resolves.toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('wrong password', hash)).resolves.toBe(
      false,
    );
  });

  it('returns false (never throws) for a malformed hash string', async () => {
    await expect(
      verifyPassword('anything', 'not-a-valid-hash'),
    ).resolves.toBe(false);
    await expect(verifyPassword('anything', '')).resolves.toBe(false);
    await expect(
      verifyPassword('anything', 'pbkdf2$notanumber$salt$hash'),
    ).resolves.toBe(false);
  });
});

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../src/env.js';

describe('loadEnv', () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), 'pagmanager-api-env-'));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('throws when running in production with Postgres and no JWT_SECRET', async () => {
    await expect(
      loadEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        DATA_DIR: dataDir,
      }),
    ).rejects.toThrow(/JWT_SECRET/);
  });

  it('rejects short, placeholder, and obviously repeated production JWT secrets', async () => {
    const weakSecrets = [
      'too-short',
      'replace-with-a-unique-secret-of-at-least-32-characters',
      'a'.repeat(64),
      `${'a'.repeat(31)}b`,
      '1234567890'.repeat(4),
    ];

    for (const jwtSecret of weakSecrets) {
      const result = await loadEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        JWT_SECRET: jwtSecret,
        CORS_ORIGIN: 'https://pagmanager.example.com',
        DATA_DIR: dataDir,
      }).catch((error: unknown) => error);

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toMatch(/JWT_SECRET/);
      expect((result as Error).message).not.toContain(jwtSecret);
    }
  });

  it('accepts a sufficiently long explicit secret in production', async () => {
    const jwtSecret = 'F3kQ8vN1xZ5mR9tB2yH6pL4sD7wC0aJ5';
    const config = await loadEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      JWT_SECRET: jwtSecret,
      CORS_ORIGIN: 'https://pagmanager.example.com',
      DATA_DIR: dataDir,
    });

    expect(config.jwtSecret).toBe(jwtSecret);
  });

  it('generates and persists a JWT secret in PGlite mode when none is provided', async () => {
    const config = await loadEnv({
      NODE_ENV: 'development',
      DATA_DIR: dataDir,
    });

    expect(config.jwtSecret).toMatch(/^[0-9a-f]{64}$/);

    const persisted = await readFile(path.join(dataDir, 'jwt-secret'), 'utf8');
    expect(persisted.trim()).toBe(config.jwtSecret);
  });

  it('reuses the same secret across repeated loadEnv calls against the same DATA_DIR', async () => {
    const first = await loadEnv({ NODE_ENV: 'development', DATA_DIR: dataDir });
    const second = await loadEnv({
      NODE_ENV: 'development',
      DATA_DIR: dataDir,
    });

    expect(second.jwtSecret).toBe(first.jwtSecret);
  });

  it('generates and validates a strong persisted JWT secret in production PGlite mode', async () => {
    const config = await loadEnv({
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://pagmanager.example.com',
      DATA_DIR: dataDir,
    });

    expect(config.jwtSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(config.corsOrigin).toBe('https://pagmanager.example.com');
    const persisted = await readFile(path.join(dataDir, 'jwt-secret'), 'utf8');
    expect(persisted.trim()).toBe(config.jwtSecret);
  });

  it('rejects a weak persisted production JWT secret without replacing it', async () => {
    const weakSecret = `${'a'.repeat(31)}b`;
    const secretPath = path.join(dataDir, 'jwt-secret');
    await writeFile(secretPath, weakSecret, 'utf8');

    await expect(
      loadEnv({
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://pagmanager.example.com',
        DATA_DIR: dataDir,
      }),
    ).rejects.toThrow(/JWT_SECRET/);

    expect(await readFile(secretPath, 'utf8')).toBe(weakSecret);
  });

  it.each([
    undefined,
    '',
    '*',
    'https://*.example.com',
    'https://pagmanager.example.com/path',
    'https://user:password@pagmanager.example.com',
    'ftp://pagmanager.example.com',
    'https://pagmanager.example.com?query=1',
  ])('rejects production CORS_ORIGIN %s', async (corsOrigin) => {
    await expect(
      loadEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        JWT_SECRET: 'F3kQ8vN1xZ5mR9tB2yH6pL4sD7wC0aJ5',
        CORS_ORIGIN: corsOrigin,
        DATA_DIR: dataDir,
      }),
    ).rejects.toThrow(/CORS_ORIGIN/);
  });

  it('accepts only an HTTP(S) production origin and normalizes a trailing slash', async () => {
    const config = await loadEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      JWT_SECRET: 'F3kQ8vN1xZ5mR9tB2yH6pL4sD7wC0aJ5',
      CORS_ORIGIN: 'https://pagmanager.example.com/',
      DATA_DIR: dataDir,
    });

    expect(config.corsOrigin).toBe('https://pagmanager.example.com');
  });
});

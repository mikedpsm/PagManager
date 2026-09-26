import { mkdtemp, readFile, rm } from 'node:fs/promises';
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

  it('generates and persists a JWT secret in PGlite mode when none is provided', async () => {
    const config = await loadEnv({
      NODE_ENV: 'development',
      DATA_DIR: dataDir,
    });

    expect(config.jwtSecret).toMatch(/^[0-9a-f]{64}$/);

    const persisted = await readFile(
      path.join(dataDir, 'jwt-secret'),
      'utf8',
    );
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
});

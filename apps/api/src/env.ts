import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.url().optional(),
  DATA_DIR: z.string().default('./data'),
  JWT_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

export type RawEnv = z.infer<typeof envSchema>;

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string | undefined;
  dataDir: string;
  jwtSecret: string;
  corsOrigin: string | undefined;
}

const JWT_SECRET_FILE_NAME = 'jwt-secret';

async function readOrCreateJwtSecretFile(dataDir: string): Promise<string> {
  const secretPath = path.join(dataDir, JWT_SECRET_FILE_NAME);

  try {
    const existing = await readFile(secretPath, 'utf8');
    const trimmed = existing.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  } catch {
    // File does not exist yet (or is unreadable) - fall through and create it.
  }

  await mkdir(dataDir, { recursive: true });
  const secret = randomBytes(32).toString('hex');
  await writeFile(secretPath, secret, { mode: 0o600 });
  return secret;
}

export async function loadEnv(
  raw: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<AppConfig> {
  const parsed = envSchema.parse(raw);

  let jwtSecret = parsed.JWT_SECRET;

  if (parsed.DATABASE_URL && parsed.NODE_ENV === 'production') {
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is required when running in production with a Postgres DATABASE_URL configured.',
      );
    }
  } else if (!parsed.DATABASE_URL && !jwtSecret) {
    jwtSecret = await readOrCreateJwtSecretFile(parsed.DATA_DIR);
  }

  if (!jwtSecret) {
    // Postgres configured but not production (e.g. development/test): still
    // need a secret to sign tokens, so fall back to the persisted file too.
    jwtSecret = await readOrCreateJwtSecretFile(parsed.DATA_DIR);
  }

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    dataDir: parsed.DATA_DIR,
    jwtSecret,
    corsOrigin: parsed.CORS_ORIGIN,
  };
}

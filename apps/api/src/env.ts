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
  WEB_DIST_DIR: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

export type RawEnv = z.infer<typeof envSchema>;

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string | undefined;
  dataDir: string;
  webDistDir: string | undefined;
  jwtSecret: string;
  corsOrigin: string | undefined;
}

const JWT_SECRET_FILE_NAME = 'jwt-secret';

const JWT_SECRET_PLACEHOLDERS = [
  'change-me',
  'changeme',
  'changeit',
  'replace-with',
  'replace-me',
  'replaceme',
  'placeholder',
  'your-secret',
  'yoursecret',
  'your-jwt',
  'example-secret',
  'test-secret',
  'dev-secret',
  'default-secret',
  'password',
  'supersecret',
  'letmein',
  'qwerty',
];

function isObviousRepeatedPattern(value: string): boolean {
  const maxPatternLength = Math.min(16, Math.floor(value.length / 2));
  for (
    let patternLength = 1;
    patternLength <= maxPatternLength;
    patternLength++
  ) {
    if (value.length % patternLength !== 0) continue;

    let repeats = true;
    for (let index = patternLength; index < value.length; index++) {
      if (value[index] !== value[index % patternLength]) {
        repeats = false;
        break;
      }
    }
    if (repeats) return true;
  }
  return false;
}

function validateProductionJwtSecret(secret: string): void {
  const normalized = secret.toLowerCase();
  if (
    Array.from(secret).length < 32 ||
    new Set(Array.from(secret)).size < 8 ||
    JWT_SECRET_PLACEHOLDERS.some((placeholder) =>
      normalized.includes(placeholder),
    ) ||
    isObviousRepeatedPattern(secret) ||
    normalized.includes('1234567890') ||
    normalized.includes('abcdefghijklmnopqrstuvwxyz')
  ) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters and must not be a placeholder, low-diversity value, or obvious repeated pattern in production.',
    );
  }
}

function productionCorsOrigin(origin: string | undefined): string {
  if (
    !origin ||
    origin.trim() !== origin ||
    origin.includes('*') ||
    origin === '*'
  ) {
    throw new Error(
      'CORS_ORIGIN is required in production and must be one explicit HTTP(S) origin.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error(
      'CORS_ORIGIN is required in production and must be one explicit HTTP(S) origin.',
    );
  }

  if (
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    parsed.username.length > 0 ||
    parsed.password.length > 0 ||
    parsed.hostname.includes('*') ||
    parsed.pathname !== '/' ||
    parsed.search.length > 0 ||
    parsed.hash.length > 0
  ) {
    throw new Error(
      'CORS_ORIGIN is required in production and must be one explicit HTTP(S) origin.',
    );
  }

  return parsed.origin;
}

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

  if (!jwtSecret) {
    throw new Error('JWT_SECRET could not be resolved.');
  }

  if (parsed.NODE_ENV === 'production') {
    validateProductionJwtSecret(jwtSecret);
  }

  const corsOrigin =
    parsed.NODE_ENV === 'production'
      ? productionCorsOrigin(parsed.CORS_ORIGIN)
      : parsed.CORS_ORIGIN;

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    dataDir: parsed.DATA_DIR,
    webDistDir: parsed.WEB_DIST_DIR,
    jwtSecret,
    corsOrigin,
  };
}

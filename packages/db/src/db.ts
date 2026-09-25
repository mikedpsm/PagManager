import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import {
  drizzle as drizzlePGlite,
  type PgliteDatabase,
} from 'drizzle-orm/pglite';
import {
  drizzle as drizzlePostgresJs,
  type PostgresJsDatabase,
} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { type Schema, schema } from './schema.js';

export type Db =
  | {
      driver: 'postgres';
      client: PostgresJsDatabase<Schema>;
      close: () => Promise<void>;
    }
  | {
      driver: 'pglite';
      client: PgliteDatabase<Schema>;
      close: () => Promise<void>;
    };

export interface DbEnv {
  DATABASE_URL?: string;
  DATA_DIR?: string;
}

export function createPostgresDb(connectionString: string): Db {
  const client = postgres(connectionString);
  return {
    driver: 'postgres',
    client: drizzlePostgresJs(client, { schema }),
    close: () => client.end(),
  };
}

export function createPGliteDb(dataDir?: string): Db {
  const pglite = dataDir
    ? new PGlite(dataDir, { extensions: { citext } })
    : new PGlite({ extensions: { citext } });
  return {
    driver: 'pglite',
    client: drizzlePGlite(pglite, { schema }),
    close: () => pglite.close(),
  };
}

export function createDb(env: DbEnv = process.env): Db {
  if (env.DATABASE_URL) {
    return createPostgresDb(env.DATABASE_URL);
  }
  const dataDir = path.join(env.DATA_DIR ?? process.cwd(), 'pglite');
  return createPGliteDb(dataDir);
}

export function createInMemoryDb(): Db {
  return createPGliteDb();
}

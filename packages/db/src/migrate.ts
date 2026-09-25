import { fileURLToPath } from 'node:url';

import { migrate as migratePGlite } from 'drizzle-orm/pglite/migrator';
import { migrate as migratePostgresJs } from 'drizzle-orm/postgres-js/migrator';

import type { Db } from './db.js';

export const defaultMigrationsFolder = fileURLToPath(
  new URL('../../../db/migrations', import.meta.url),
);

export async function runMigrations(
  database: Db,
  migrationsFolder: string = defaultMigrationsFolder,
): Promise<void> {
  if (database.driver === 'postgres') {
    await migratePostgresJs(database.client, { migrationsFolder });
  } else {
    await migratePGlite(database.client, { migrationsFolder });
  }
}

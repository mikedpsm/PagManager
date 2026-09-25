import { createDb, type Db, type DbEnv } from './db.js';
import { runMigrations } from './migrate.js';

export async function initializeDb(env: DbEnv = process.env): Promise<Db> {
  const db = createDb(env);
  await runMigrations(db);
  return db;
}

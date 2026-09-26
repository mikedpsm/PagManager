import { createDb, type Db, type DbEnv } from './db.js';
import { runMigrations } from './migrate.js';

export async function initializeDb(env: DbEnv = process.env): Promise<Db> {
  const db = createDb(env);
  try {
    await runMigrations(db);
  } catch (error) {
    await db.close();
    throw error;
  }
  return db;
}

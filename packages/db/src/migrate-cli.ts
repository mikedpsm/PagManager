import { createDb } from './db.js';
import { runMigrations } from './migrate.js';

async function main(): Promise<void> {
  const db = createDb();
  try {
    await runMigrations(db);
    console.log('Migrations applied successfully.');
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});

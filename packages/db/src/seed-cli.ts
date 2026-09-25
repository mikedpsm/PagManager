import { createDb } from './db.js';
import { runMigrations } from './migrate.js';
import { seed } from './seed.js';

async function main(): Promise<void> {
  const db = createDb();
  try {
    await runMigrations(db);
    await seed(db);
    console.log('Seed completed successfully.');
  } finally {
    await db.close();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});

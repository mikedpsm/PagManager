import { sql } from 'drizzle-orm';
import { Hono } from 'hono';

import type { AppDeps } from '../types.js';

export function createHealthRoute(deps: AppDeps) {
  const health = new Hono();

  health.get('/', async (c) => {
    try {
      await deps.db.client.execute(sql`select 1`);
      return c.json({ status: 'ok' }, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ status: 'error', message }, 503);
    }
  });

  return health;
}

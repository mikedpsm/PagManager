import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import type { AppDeps } from '../types.js';
import { jsonResponse } from './openapi.js';

const healthOkSchema = z.object({ status: z.literal('ok') });
const healthFailureSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
});

export function createHealthRoute(deps: AppDeps, operationId: string) {
  const health = new OpenAPIHono();
  const healthOperation = createRoute({
    method: 'get',
    path: '/',
    operationId,
    tags: ['Health'],
    summary: 'Check API and database availability',
    responses: {
      200: jsonResponse(healthOkSchema, 'The database is available.'),
      503: jsonResponse(healthFailureSchema, 'The database check failed.'),
    },
  });

  health.openAPIRegistry.registerPath(healthOperation);

  return health.get(healthOperation.getRoutingPath(), async (c) => {
    try {
      await deps.db.client.execute(sql`select 1`);
      return c.json({ status: 'ok' }, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ status: 'error', message }, 503);
    }
  });
}

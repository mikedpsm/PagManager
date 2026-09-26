import { dashboardSummarySchema } from '@pagmanager/contracts';
import { clients, invoices } from '@pagmanager/db';
import { OpenAPIHono } from '@hono/zod-openapi';
import { and, asc, eq, sql } from 'drizzle-orm';

import type { AppDeps, AppEnv } from '../types.js';

export function createDashboardRoutes(deps: AppDeps) {
  const dashboard = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });

  dashboard.get('/summary', async (c) => {
    const user = c.get('user');

    const [totalsRow] = await deps.db.client
      .select({
        paidCents: sql<number>`coalesce(sum(case when ${invoices.paidAt} is not null then ${invoices.amountCents} else 0 end), 0)::integer`,
        pendingCents: sql<number>`coalesce(sum(case when ${invoices.paidAt} is null and ${invoices.dueDate} >= current_date then ${invoices.amountCents} else 0 end), 0)::integer`,
        overdueCents: sql<number>`coalesce(sum(case when ${invoices.paidAt} is null and ${invoices.dueDate} < current_date then ${invoices.amountCents} else 0 end), 0)::integer`,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(clients.userId, user.id));

    const overdueClients = await deps.db.client
      .select({
        invoiceId: invoices.id,
        username: clients.username,
        amountCents: invoices.amountCents,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          eq(clients.userId, user.id),
          sql`${invoices.paidAt} is null and ${invoices.dueDate} < current_date`,
        ),
      )
      .orderBy(asc(invoices.dueDate))
      .limit(4);

    const upToDateClients = await deps.db.client
      .select({
        invoiceId: invoices.id,
        username: clients.username,
        amountCents: invoices.amountCents,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          eq(clients.userId, user.id),
          sql`${invoices.paidAt} is null and ${invoices.dueDate} >= current_date`,
        ),
      )
      .orderBy(asc(invoices.dueDate))
      .limit(4);

    const body = dashboardSummarySchema.parse({
      totals: totalsRow ?? { paidCents: 0, pendingCents: 0, overdueCents: 0 },
      overdueClients,
      upToDateClients,
    });

    return c.json(body, 200);
  });

  return dashboard;
}

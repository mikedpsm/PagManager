import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { dashboardSummarySchema } from '@pagmanager/contracts';
import { clients, invoices } from '@pagmanager/db';
import { and, asc, eq, sql } from 'drizzle-orm';
import { authMiddleware } from '../auth/middleware.js';
import { AppError } from '../errors.js';
import type { AppDeps, AppEnv } from '../types.js';
import {
  bearerAuthSecurity,
  internalErrorResponse,
  jsonResponse,
  unauthorizedErrorResponse,
} from './openapi.js';

function assertSafeDashboardTotal(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new AppError(
      500,
      'INTERNAL_SERVER_ERROR',
      'Dashboard total exceeds the supported integer range',
    );
  }

  return value;
}

export function createDashboardRoutes(deps: AppDeps) {
  const dashboard = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });
  dashboard.use('*', authMiddleware(deps));

  const summaryOperation = createRoute({
    method: 'get',
    path: '/summary',
    operationId: 'getDashboardSummary',
    tags: ['Dashboard'],
    summary: 'Get dashboard totals and invoice summaries',
    security: bearerAuthSecurity,
    responses: {
      200: jsonResponse(
        dashboardSummarySchema,
        'Dashboard totals and invoice lists.',
      ),
      ...unauthorizedErrorResponse,
      ...internalErrorResponse,
    },
  });

  dashboard.openAPIRegistry.registerPath(summaryOperation);

  const routes = dashboard.get(summaryOperation.getRoutingPath(), async (c) => {
    const user = c.get('user');

    const [totalsRow] = await deps.db.client
      .select({
        paidCents: sql<number>`
          coalesce(
            sum(case when ${invoices.paidAt} is not null then ${invoices.amountCents} else 0 end),
            0
          )
        `.mapWith(Number),
        pendingCents: sql<number>`
          coalesce(
            sum(case when ${invoices.paidAt} is null and ${invoices.dueDate} >= current_date then ${invoices.amountCents} else 0 end),
            0
          )
        `.mapWith(Number),
        overdueCents: sql<number>`
          coalesce(
            sum(case when ${invoices.paidAt} is null and ${invoices.dueDate} < current_date then ${invoices.amountCents} else 0 end),
            0
          )
        `.mapWith(Number),
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
      totals: totalsRow
        ? {
            paidCents: assertSafeDashboardTotal(totalsRow.paidCents),
            pendingCents: assertSafeDashboardTotal(totalsRow.pendingCents),
            overdueCents: assertSafeDashboardTotal(totalsRow.overdueCents),
          }
        : { paidCents: 0, pendingCents: 0, overdueCents: 0 },
      overdueClients,
      upToDateClients,
    });

    return c.json(body, 200);
  });

  return routes;
}

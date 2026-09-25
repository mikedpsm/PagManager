import { z } from 'zod';

export const dashboardTotalsSchema = z.object({
  paidCents: z.number().int().nonnegative(),
  pendingCents: z.number().int().nonnegative(),
  overdueCents: z.number().int().nonnegative(),
});

export type DashboardTotals = z.infer<typeof dashboardTotalsSchema>;

export const dashboardClientSummarySchema = z.object({
  invoiceId: z.uuid(),
  username: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  dueDate: z.iso.date(),
});

export type DashboardClientSummary = z.infer<typeof dashboardClientSummarySchema>;

export const dashboardSummarySchema = z.object({
  totals: dashboardTotalsSchema,
  overdueClients: z.array(dashboardClientSummarySchema).max(4),
  upToDateClients: z.array(dashboardClientSummarySchema).max(4),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

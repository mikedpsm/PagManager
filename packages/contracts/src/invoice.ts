import { z } from 'zod';

export const invoiceStatusSchema = z.enum(['paid', 'pending', 'overdue']);

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const invoiceSchema = z.object({
  id: z.uuid(),
  clientId: z.uuid(),
  description: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  dueDate: z.iso.date(),
  paidAt: z.iso.datetime().nullable(),
  status: invoiceStatusSchema,
});

export type Invoice = z.infer<typeof invoiceSchema>;

export const invoiceListQuerySchema = z.object({
  status: invoiceStatusSchema.optional(),
});

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

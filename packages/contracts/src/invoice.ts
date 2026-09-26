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

export const createInvoiceInputSchema = invoiceSchema.omit({
  id: true,
  paidAt: true,
  status: true,
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

export const updateInvoiceInputSchema = createInvoiceInputSchema.partial();

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceInputSchema>;

export const invoiceListQuerySchema = z.object({
  status: invoiceStatusSchema.optional(),
  clientId: z.uuid().optional(),
});

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

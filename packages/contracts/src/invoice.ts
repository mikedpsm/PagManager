import { z } from 'zod';

import { MAX_INVOICE_DESCRIPTION_LENGTH } from './field-limits.js';

export const invoiceStatusSchema = z.enum(['paid', 'pending', 'overdue']);

export const MAX_INVOICE_AMOUNT_CENTS = 2_147_483_647;
export const invoiceAmountCentsSchema = z
  .number()
  .int()
  .nonnegative()
  .max(MAX_INVOICE_AMOUNT_CENTS);

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const invoiceSchema = z.object({
  id: z.uuid(),
  clientId: z.uuid(),
  description: z.string().min(1),
  amountCents: invoiceAmountCentsSchema,
  dueDate: z.iso.date(),
  paidAt: z.iso.datetime().nullable(),
  status: invoiceStatusSchema,
});

export type Invoice = z.infer<typeof invoiceSchema>;

export const createInvoiceInputSchema = invoiceSchema
  .omit({
    id: true,
    paidAt: true,
    status: true,
  })
  .extend({
    description: z.string().min(1).max(MAX_INVOICE_DESCRIPTION_LENGTH),
  });

export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

export const updateInvoiceInputSchema = createInvoiceInputSchema.partial();

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceInputSchema>;

export const invoiceListQuerySchema = z.object({
  status: invoiceStatusSchema.optional(),
  clientId: z.uuid().optional(),
});

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

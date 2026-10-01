import {
  createInvoiceInputSchema,
  formatBRL,
  invoiceAmountCentsSchema,
  MAX_INVOICE_AMOUNT_CENTS,
} from '@pagmanager/contracts';
import { z } from 'zod';

import { parseBRL } from '@/lib/format';

const invoiceAmountInputSchema = z.string().transform((value, context) => {
  const amountCents = parseBRL(value);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    context.addIssue({ code: 'custom', message: 'Informe um valor válido.' });
    return z.NEVER;
  }

  const parsedAmount = invoiceAmountCentsSchema.safeParse(amountCents);
  if (!parsedAmount.success) {
    context.addIssue({
      code: 'custom',
      message: `O valor máximo por cobrança é ${formatBRL(MAX_INVOICE_AMOUNT_CENTS)}.`,
    });
    return z.NEVER;
  }

  return parsedAmount.data;
});

export const invoiceFormSchema = z
  .object({
    clientId: createInvoiceInputSchema.shape.clientId,
    description: createInvoiceInputSchema.shape.description,
    amount: invoiceAmountInputSchema,
    dueDate: createInvoiceInputSchema.shape.dueDate,
  })
  .transform(({ amount, ...rest }) => ({ ...rest, amountCents: amount }));

export type InvoiceFormInput = z.input<typeof invoiceFormSchema>;
export type InvoiceFormOutput = z.output<typeof invoiceFormSchema>;

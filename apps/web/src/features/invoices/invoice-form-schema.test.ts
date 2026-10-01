import {
  MAX_INVOICE_AMOUNT_CENTS,
  MAX_INVOICE_DESCRIPTION_LENGTH,
} from '@pagmanager/contracts';
import { describe, expect, it } from 'vitest';

import { invoiceFormSchema } from './invoice-form-schema';

const input = (amount: string) => ({
  clientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  description: 'Serviços',
  amount,
  dueDate: '2030-06-15',
});

describe('invoice form amount', () => {
  it.each([
    ['0,01', 1],
    ['123,45', 12345],
    ['21.474.836,47', MAX_INVOICE_AMOUNT_CENTS],
  ])('parses %s to exact cents', (amount, amountCents) => {
    const parsed = invoiceFormSchema.parse(input(amount));
    expect(parsed.amountCents).toBe(amountCents);
  });

  it('rejects an amount above the shared invoice limit with a Portuguese message', () => {
    const parsed = invoiceFormSchema.safeParse(input('21.474.836,48'));
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(
        /valor máximo.*21\.474\.836,47/i,
      );
    }
  });

  it('keeps the positive amount requirement of the form', () => {
    expect(invoiceFormSchema.safeParse(input('0,00')).success).toBe(false);
  });
});

describe('invoice form description', () => {
  it('accepts descriptions at the limit and rejects longer descriptions', () => {
    const description = 'D'.repeat(MAX_INVOICE_DESCRIPTION_LENGTH);
    expect(
      invoiceFormSchema.safeParse({ ...input('1,00'), description }).success,
    ).toBe(true);
    expect(
      invoiceFormSchema.safeParse({
        ...input('1,00'),
        description: `${description}D`,
      }).success,
    ).toBe(false);
  });
});

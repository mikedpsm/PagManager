import { describe, expect, it } from 'vitest';

import {
  clientListQuerySchema,
  clientSchema,
  createClientInputSchema,
  createInvoiceInputSchema,
  invoiceSchema,
  MAX_CLIENT_SEARCH_LENGTH,
  MAX_INVOICE_DESCRIPTION_LENGTH,
  MAX_USERNAME_LENGTH,
  registerStep1Schema,
  updateClientInputSchema,
  updateInvoiceInputSchema,
  userSchema,
} from '../src/index.js';

const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const validClientInput = {
  username: 'Cris',
  email: 'cris@example.com',
  cpf: '52998224725',
  phone: '11999999999',
};

describe('bounded input fields', () => {
  it('limits usernames on registration and client create/update', () => {
    const username = 'A'.repeat(MAX_USERNAME_LENGTH);
    const tooLongUsername = 'A'.repeat(MAX_USERNAME_LENGTH + 1);

    expect(
      registerStep1Schema.safeParse({
        username,
        email: 'user@example.com',
      }).success,
    ).toBe(true);
    expect(
      registerStep1Schema.safeParse({
        username: tooLongUsername,
        email: 'user@example.com',
      }).success,
    ).toBe(false);
    expect(
      createClientInputSchema.safeParse({
        ...validClientInput,
        username,
      }).success,
    ).toBe(true);
    expect(
      createClientInputSchema.safeParse({
        ...validClientInput,
        username: tooLongUsername,
      }).success,
    ).toBe(false);
    expect(updateClientInputSchema.safeParse({ username }).success).toBe(true);
    expect(
      updateClientInputSchema.safeParse({ username: tooLongUsername }).success,
    ).toBe(false);
  });

  it('limits descriptions on invoice create/update', () => {
    const description = 'D'.repeat(MAX_INVOICE_DESCRIPTION_LENGTH);
    const tooLongDescription = 'D'.repeat(MAX_INVOICE_DESCRIPTION_LENGTH + 1);
    const invoiceInput = {
      clientId: uuid,
      description,
      amountCents: 100,
      dueDate: '2024-01-15',
    };

    expect(createInvoiceInputSchema.safeParse(invoiceInput).success).toBe(true);
    expect(
      createInvoiceInputSchema.safeParse({
        ...invoiceInput,
        description: tooLongDescription,
      }).success,
    ).toBe(false);
    expect(updateInvoiceInputSchema.safeParse({ description }).success).toBe(
      true,
    );
    expect(
      updateInvoiceInputSchema.safeParse({
        description: tooLongDescription,
      }).success,
    ).toBe(false);
  });

  it('limits client search query length', () => {
    expect(
      clientListQuerySchema.safeParse({
        search: 'S'.repeat(MAX_CLIENT_SEARCH_LENGTH),
      }).success,
    ).toBe(true);
    expect(
      clientListQuerySchema.safeParse({
        search: 'S'.repeat(MAX_CLIENT_SEARCH_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});

describe('legacy response fields', () => {
  it('continues to parse stored usernames and descriptions over input limits', () => {
    const longUsername = 'U'.repeat(MAX_USERNAME_LENGTH + 1);
    const longDescription = 'D'.repeat(MAX_INVOICE_DESCRIPTION_LENGTH + 1);

    expect(
      userSchema.safeParse({
        id: uuid,
        username: longUsername,
        email: 'user@example.com',
      }).success,
    ).toBe(true);
    expect(
      clientSchema.safeParse({
        id: uuid,
        username: longUsername,
        email: 'client@example.com',
        cpf: '52998224725',
        phone: '11999999999',
        status: 'ok',
      }).success,
    ).toBe(true);
    expect(
      invoiceSchema.safeParse({
        id: uuid,
        clientId: uuid,
        description: longDescription,
        amountCents: 100,
        dueDate: '2024-01-15',
        paidAt: null,
        status: 'pending',
      }).success,
    ).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import {
  authResponseSchema,
  checkEmailInputSchema,
  checkEmailResponseSchema,
  clientListQuerySchema,
  clientSchema,
  createClientInputSchema,
  createInvoiceInputSchema,
  dashboardClientSummarySchema,
  dashboardSummarySchema,
  dashboardTotalsSchema,
  errorResponseSchema,
  invoiceListQuerySchema,
  invoiceSchema,
  loginInputSchema,
  registerInputSchema,
  registerStep1Schema,
  registerStep2Schema,
  updateClientInputSchema,
  updateInvoiceInputSchema,
  updateMeInputSchema,
  userSchema,
} from '../src/index.js';

const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const validUser = {
  id: uuid,
  username: 'Maicon',
  email: 'maicon@example.com',
};

const validClient = {
  id: uuid,
  username: 'Cris',
  email: 'cris@example.com',
  cpf: '52998224725',
  phone: '11999999999',
  status: 'ok',
};

const validInvoice = {
  id: uuid,
  clientId: uuid,
  description: 'Serviços de limpeza',
  amountCents: 90000,
  dueDate: '2024-01-15',
  paidAt: null,
  status: 'pending',
};

describe('auth schemas', () => {
  it('parses RegisterStep1', () => {
    expect(
      registerStep1Schema.safeParse({
        username: 'Maicon',
        email: 'maicon@example.com',
      }).success,
    ).toBe(true);
  });

  it('rejects RegisterStep1 without email', () => {
    expect(registerStep1Schema.safeParse({ username: 'Maicon' }).success).toBe(
      false,
    );
  });

  it('parses RegisterStep2 with matching passwords', () => {
    expect(
      registerStep2Schema.safeParse({
        passwd: '12345678',
        confirmPasswd: '12345678',
      }).success,
    ).toBe(true);
  });

  it('rejects RegisterStep2 with mismatched passwords', () => {
    expect(
      registerStep2Schema.safeParse({
        passwd: '12345678',
        confirmPasswd: '87654321',
      }).success,
    ).toBe(false);
  });

  it('rejects RegisterStep2 with short password', () => {
    expect(
      registerStep2Schema.safeParse({ passwd: '123', confirmPasswd: '123' })
        .success,
    ).toBe(false);
  });

  it('parses RegisterInput', () => {
    expect(
      registerInputSchema.safeParse({
        username: 'Maicon',
        email: 'maicon@example.com',
        passwd: '12345678',
      }).success,
    ).toBe(true);
  });

  it('parses LoginInput', () => {
    expect(
      loginInputSchema.safeParse({
        email: 'maicon@example.com',
        passwd: '12345678',
      }).success,
    ).toBe(true);
  });

  it('parses AuthResponse', () => {
    expect(
      authResponseSchema.safeParse({ token: 'abc', user: validUser }).success,
    ).toBe(true);
  });

  it('parses CheckEmailInput', () => {
    expect(
      checkEmailInputSchema.safeParse({ email: 'maicon@example.com' })
        .success,
    ).toBe(true);
  });

  it('rejects CheckEmailInput with invalid email', () => {
    expect(checkEmailInputSchema.safeParse({ email: 'not-an-email' }).success).toBe(
      false,
    );
  });

  it('parses CheckEmailResponse', () => {
    expect(checkEmailResponseSchema.safeParse({ available: true }).success).toBe(
      true,
    );
  });
});

describe('user schemas', () => {
  it('parses User', () => {
    expect(userSchema.safeParse(validUser).success).toBe(true);
  });

  it('parses User with cpf and phone', () => {
    expect(
      userSchema.safeParse({
        ...validUser,
        cpf: '52998224725',
        phone: '11999999999',
      }).success,
    ).toBe(true);
  });

  it('rejects User with invalid cpf', () => {
    expect(
      userSchema.safeParse({ ...validUser, cpf: '52998224724' }).success,
    ).toBe(false);
  });

  it('parses UpdateMeInput with all fields optional', () => {
    expect(updateMeInputSchema.safeParse({}).success).toBe(true);
  });

  it('parses UpdateMeInput with password and matching confirmation', () => {
    expect(
      updateMeInputSchema.safeParse({
        passwd: '12345678',
        confirmPasswd: '12345678',
      }).success,
    ).toBe(true);
  });

  it('rejects UpdateMeInput with mismatched confirmation', () => {
    expect(
      updateMeInputSchema.safeParse({
        passwd: '12345678',
        confirmPasswd: '87654321',
      }).success,
    ).toBe(false);
  });

  it('parses UpdateMeInput with cpf and phone', () => {
    expect(
      updateMeInputSchema.safeParse({
        cpf: '52998224725',
        phone: '11999999999',
      }).success,
    ).toBe(true);
  });
});

describe('client schemas', () => {
  it('parses Client', () => {
    expect(clientSchema.safeParse(validClient).success).toBe(true);
  });

  it('parses Client with overdue status', () => {
    expect(
      clientSchema.safeParse({ ...validClient, status: 'overdue' }).success,
    ).toBe(true);
  });

  it('rejects unknown client status', () => {
    expect(
      clientSchema.safeParse({ ...validClient, status: 'paid' }).success,
    ).toBe(false);
  });

  it('rejects Client with invalid cpf', () => {
    expect(
      clientSchema.safeParse({ ...validClient, cpf: '11111111111' }).success,
    ).toBe(false);
  });

  it('parses ClientListQuery', () => {
    expect(
      clientListQuerySchema.safeParse({ search: 'cris', status: 'overdue' })
        .success,
    ).toBe(true);
  });

  it('parses empty ClientListQuery', () => {
    expect(clientListQuerySchema.safeParse({}).success).toBe(true);
  });

  it('parses ClientListQuery with sort', () => {
    expect(
      clientListQuerySchema.safeParse({ sort: '-username' }).success,
    ).toBe(true);
  });

  it('rejects ClientListQuery with invalid sort', () => {
    expect(
      clientListQuerySchema.safeParse({ sort: 'email' }).success,
    ).toBe(false);
  });

  it('parses CreateClientInput without id and status', () => {
    const { id, status, ...input } = validClient;
    expect(createClientInputSchema.safeParse(input).success).toBe(true);
  });

  it('rejects CreateClientInput with invalid cpf', () => {
    const { id, status, ...input } = validClient;
    expect(
      createClientInputSchema.safeParse({ ...input, cpf: '11111111111' })
        .success,
    ).toBe(false);
  });

  it('parses UpdateClientInput with a partial payload', () => {
    expect(
      updateClientInputSchema.safeParse({ username: 'Nova Cris' }).success,
    ).toBe(true);
  });

  it('parses empty UpdateClientInput', () => {
    expect(updateClientInputSchema.safeParse({}).success).toBe(true);
  });
});

describe('invoice schemas', () => {
  it('parses Invoice', () => {
    expect(invoiceSchema.safeParse(validInvoice).success).toBe(true);
  });

  it('parses Invoice with paidAt and paid status', () => {
    expect(
      invoiceSchema.safeParse({
        ...validInvoice,
        paidAt: '2024-01-15T10:30:00Z',
        status: 'paid',
      }).success,
    ).toBe(true);
  });

  it('rejects non-integer amountCents', () => {
    expect(
      invoiceSchema.safeParse({ ...validInvoice, amountCents: 900.5 }).success,
    ).toBe(false);
  });

  it('rejects negative amountCents', () => {
    expect(
      invoiceSchema.safeParse({ ...validInvoice, amountCents: -1 }).success,
    ).toBe(false);
  });

  it('rejects non-ISO due date', () => {
    expect(
      invoiceSchema.safeParse({ ...validInvoice, dueDate: '15/01/2024' })
        .success,
    ).toBe(false);
  });

  it('rejects unknown invoice status', () => {
    expect(
      invoiceSchema.safeParse({ ...validInvoice, status: 'open' }).success,
    ).toBe(false);
  });

  it('parses InvoiceListQuery', () => {
    expect(
      invoiceListQuerySchema.safeParse({ status: 'overdue' }).success,
    ).toBe(true);
  });

  it('parses empty InvoiceListQuery', () => {
    expect(invoiceListQuerySchema.safeParse({}).success).toBe(true);
  });

  it('parses InvoiceListQuery with clientId', () => {
    expect(
      invoiceListQuerySchema.safeParse({ clientId: uuid }).success,
    ).toBe(true);
  });

  it('rejects InvoiceListQuery with invalid clientId', () => {
    expect(
      invoiceListQuerySchema.safeParse({ clientId: 'not-a-uuid' }).success,
    ).toBe(false);
  });

  it('parses CreateInvoiceInput without id, paidAt and status', () => {
    const { id, paidAt, status, ...input } = validInvoice;
    expect(createInvoiceInputSchema.safeParse(input).success).toBe(true);
  });

  it('rejects CreateInvoiceInput with negative amountCents', () => {
    const { id, paidAt, status, ...input } = validInvoice;
    expect(
      createInvoiceInputSchema.safeParse({ ...input, amountCents: -1 })
        .success,
    ).toBe(false);
  });

  it('parses UpdateInvoiceInput with a partial payload', () => {
    expect(
      updateInvoiceInputSchema.safeParse({ description: 'Nova descrição' })
        .success,
    ).toBe(true);
  });

  it('parses empty UpdateInvoiceInput', () => {
    expect(updateInvoiceInputSchema.safeParse({}).success).toBe(true);
  });
});

describe('dashboard schemas', () => {
  it('parses DashboardTotals', () => {
    expect(
      dashboardTotalsSchema.safeParse({
        paidCents: 100,
        pendingCents: 200,
        overdueCents: 300,
      }).success,
    ).toBe(true);
  });

  it('parses DashboardClientSummary', () => {
    const summary = {
      invoiceId: uuid,
      username: 'Cris',
      amountCents: 90000,
      dueDate: '2024-01-15',
    };
    expect(dashboardClientSummarySchema.safeParse(summary).success).toBe(true);
  });

  it('rejects DashboardClientSummary with non-ISO due date', () => {
    const summary = {
      invoiceId: uuid,
      username: 'Cris',
      amountCents: 90000,
      dueDate: '15/01/2024',
    };
    expect(dashboardClientSummarySchema.safeParse(summary).success).toBe(false);
  });

  it('parses DashboardSummary', () => {
    const summary = {
      totals: { paidCents: 100, pendingCents: 200, overdueCents: 300 },
      overdueClients: [
        {
          invoiceId: uuid,
          username: 'Cris',
          amountCents: 90000,
          dueDate: '2024-01-15',
        },
      ],
      upToDateClients: [
        {
          invoiceId: uuid,
          username: 'Ana',
          amountCents: 5000,
          dueDate: '2024-02-01',
        },
      ],
    };
    expect(dashboardSummarySchema.safeParse(summary).success).toBe(true);
  });

  it('rejects more than four clients in a list', () => {
    const five = [
      {
        invoiceId: uuid,
        username: 'Cris',
        amountCents: 90000,
        dueDate: '2024-01-15',
      },
      {
        invoiceId: uuid,
        username: 'Ana',
        amountCents: 5000,
        dueDate: '2024-02-01',
      },
      {
        invoiceId: uuid,
        username: 'Bia',
        amountCents: 3000,
        dueDate: '2024-03-01',
      },
      {
        invoiceId: uuid,
        username: 'Duda',
        amountCents: 2000,
        dueDate: '2024-04-01',
      },
      {
        invoiceId: uuid,
        username: 'Eva',
        amountCents: 1000,
        dueDate: '2024-05-01',
      },
    ];
    const summary = {
      totals: { paidCents: 0, pendingCents: 0, overdueCents: 0 },
      overdueClients: five,
      upToDateClients: [],
    };
    expect(dashboardSummarySchema.safeParse(summary).success).toBe(false);
  });
});

describe('error schema', () => {
  it('accepts arbitrary error codes and optional details', () => {
    expect(
      errorResponseSchema.safeParse({
        code: 'CPF_INVALID',
        message: 'CPF inválido',
      }).success,
    ).toBe(true);
    expect(
      errorResponseSchema.safeParse({
        code: 'CUSTOM_ERROR',
        message: 'Erro',
        details: { field: 'cpf' },
      }).success,
    ).toBe(true);
  });
});

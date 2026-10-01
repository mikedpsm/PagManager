import { MAX_INVOICE_AMOUNT_CENTS } from '@pagmanager/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { createApp } from '../../src/app.js';
import {
  authedRequest,
  closeTestApp,
  createTestApp,
  registerUser,
  type TestApp,
} from '../helpers/testApp.js';

describe('invoices routes', () => {
  let testApp: TestApp;
  let app: ReturnType<typeof createApp>;
  let tokenA: string;
  let tokenB: string;
  let clientAId: string;
  let clientBId: string;

  function authed(token: string) {
    return authedRequest(app, token);
  }

  async function register(email: string) {
    const { token } = await registerUser(app, { email });
    return token;
  }

  beforeAll(async () => {
    testApp = await createTestApp();
    ({ app } = testApp);
    tokenA = await register('inv-a@example.com');
    tokenB = await register('inv-b@example.com');

    const clientA = await authed(tokenA)('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Invoice Client A',
        email: 'inv-client-a@example.com',
        cpf: '00000000353',
        phone: '11999999999',
      }),
    });
    clientAId = (await clientA.json()).id;

    const clientB = await authed(tokenB)('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Invoice Client B',
        email: 'inv-client-b@example.com',
        cpf: '00000004006',
        phone: '11988888888',
      }),
    });
    clientBId = (await clientB.json()).id;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  const asA = () => authed(tokenA);
  const asB = () => authed(tokenB);

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/v1/invoices');
    expect(res.status).toBe(401);
  });

  it('rejects creating an invoice for a client not owned by the current user (404)', async () => {
    const res = await asA()('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientBId,
        description: 'Should fail',
        amountCents: 1000,
        dueDate: '2030-01-01',
      }),
    });
    expect(res.status).toBe(404);
  });

  it('rejects invalid input with 400', async () => {
    const res = await asA()('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        description: '',
        amountCents: -5,
        dueDate: 'not-a-date',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('creates and reads an invoice at the int32 amount limit', async () => {
    const create = await asA()('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        description: 'Maximum amount',
        amountCents: MAX_INVOICE_AMOUNT_CENTS,
        dueDate: '2030-06-15',
      }),
    });
    expect(create.status).toBe(201);
    const created = await create.json();
    expect(created.amountCents).toBe(MAX_INVOICE_AMOUNT_CENTS);

    const read = await asA()(`/api/v1/invoices/${created.id}`);
    expect(read.status).toBe(200);
    expect((await read.json()).amountCents).toBe(MAX_INVOICE_AMOUNT_CENTS);
  });

  it('rejects an amount above int32 without inserting an invoice', async () => {
    const before = await (await asA()('/api/v1/invoices')).json();
    const res = await asA()('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        description: 'Overflow amount',
        amountCents: MAX_INVOICE_AMOUNT_CENTS + 1,
        dueDate: '2030-06-15',
      }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('VALIDATION_ERROR');

    const after = await (await asA()('/api/v1/invoices')).json();
    expect(after.map((invoice: { id: string }) => invoice.id)).toEqual(
      before.map((invoice: { id: string }) => invoice.id),
    );
  });

  let invoiceId: string;

  it('creates an invoice for own client', async () => {
    const res = await asA()('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        description: 'First invoice',
        amountCents: 5000,
        dueDate: '2030-06-15',
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('pending');
    expect(body.paidAt).toBeNull();
    invoiceId = body.id;
  });

  it('scopes GET /:id to the owning user (404 for others)', async () => {
    const res = await asB()(`/api/v1/invoices/${invoiceId}`);
    expect(res.status).toBe(404);

    const okRes = await asA()(`/api/v1/invoices/${invoiceId}`);
    expect(okRes.status).toBe(200);
  });

  it('PATCH without dueDate leaves the existing dueDate untouched (regression fix)', async () => {
    const before = await (await asA()(`/api/v1/invoices/${invoiceId}`)).json();
    expect(before.dueDate).toBe('2030-06-15');

    const res = await asA()(`/api/v1/invoices/${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Updated description only' }),
    });
    expect(res.status).toBe(200);
    const after = await res.json();
    expect(after.description).toBe('Updated description only');
    expect(after.dueDate).toBe('2030-06-15');
  });

  it('PATCH can still explicitly change dueDate when provided', async () => {
    const res = await asA()(`/api/v1/invoices/${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ dueDate: '2031-01-01' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dueDate).toBe('2031-01-01');
  });

  it('validates PATCH amounts before writing and keeps partial updates', async () => {
    const create = await asA()('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        description: 'Patch boundary',
        amountCents: 1200,
        dueDate: '2032-04-05',
      }),
    });
    expect(create.status).toBe(201);
    const created = await create.json();

    const atLimit = await asA()(`/api/v1/invoices/${created.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ amountCents: MAX_INVOICE_AMOUNT_CENTS }),
    });
    expect(atLimit.status).toBe(200);
    expect((await atLimit.json()).amountCents).toBe(MAX_INVOICE_AMOUNT_CENTS);

    const beforeOverflow = await (
      await asA()(`/api/v1/invoices/${created.id}`)
    ).json();
    const overflow = await asA()(`/api/v1/invoices/${created.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ amountCents: MAX_INVOICE_AMOUNT_CENTS + 1 }),
    });
    expect(overflow.status).toBe(400);
    expect((await overflow.json()).code).toBe('VALIDATION_ERROR');

    const afterOverflow = await (
      await asA()(`/api/v1/invoices/${created.id}`)
    ).json();
    expect(afterOverflow).toMatchObject({
      amountCents: beforeOverflow.amountCents,
      dueDate: beforeOverflow.dueDate,
      clientId: beforeOverflow.clientId,
      description: beforeOverflow.description,
    });

    const descriptionOnly = await asA()(`/api/v1/invoices/${created.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Partial patch preserved' }),
    });
    expect(descriptionOnly.status).toBe(200);
    expect(await descriptionOnly.json()).toMatchObject({
      amountCents: MAX_INVOICE_AMOUNT_CENTS,
      dueDate: '2032-04-05',
      clientId: clientAId,
      description: 'Partial patch preserved',
    });
  });

  it('POST /:id/pay marks the invoice paid and is idempotent', async () => {
    const firstPay = await asA()(`/api/v1/invoices/${invoiceId}/pay`, {
      method: 'POST',
    });
    expect(firstPay.status).toBe(200);
    const firstBody = await firstPay.json();
    expect(firstBody.status).toBe('paid');
    expect(firstBody.paidAt).not.toBeNull();

    const secondPay = await asA()(`/api/v1/invoices/${invoiceId}/pay`, {
      method: 'POST',
    });
    expect(secondPay.status).toBe(200);
    const secondBody = await secondPay.json();
    expect(secondBody.paidAt).toBe(firstBody.paidAt);
  });

  it('lists invoices filtered by status and clientId', async () => {
    const res = await asA()(
      `/api/v1/invoices?clientId=${clientAId}&status=paid`,
    );
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(list.some((i: { id: string }) => i.id === invoiceId)).toBe(true);
  });

  it('DELETE removes the invoice scoped to the current user', async () => {
    const create = await asA()('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        description: 'To delete',
        amountCents: 100,
        dueDate: '2030-01-01',
      }),
    });
    const created = await create.json();

    const del = await asA()(`/api/v1/invoices/${created.id}`, {
      method: 'DELETE',
    });
    expect(del.status).toBe(204);

    const getRes = await asA()(`/api/v1/invoices/${created.id}`);
    expect(getRes.status).toBe(404);
  });
});

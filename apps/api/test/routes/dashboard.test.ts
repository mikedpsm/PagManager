import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { createApp } from '../../src/app.js';
import {
  authedRequest,
  closeTestApp,
  createTestApp,
  registerUser,
  type TestApp,
} from '../helpers/testApp.js';

describe('dashboard routes', () => {
  let testApp: TestApp;
  let app: ReturnType<typeof createApp>;
  let token: string;
  let clientId: string;

  const authed = (path: string, init: RequestInit = {}) =>
    authedRequest(app, token)(path, init);

  beforeAll(async () => {
    testApp = await createTestApp();
    ({ app } = testApp);

    ({ token } = await registerUser(app, {
      username: 'Dash User',
      email: 'dash@example.com',
    }));

    const clientRes = await authed('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Dash Client',
        email: 'dash-client@example.com',
        cpf: '00000000353',
        phone: '11999999999',
      }),
    });
    clientId = (await clientRes.json()).id;

    // Paid invoice
    await authed('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        description: 'Paid invoice',
        amountCents: 1000,
        dueDate: '2020-01-01',
      }),
    }).then(async (res) => {
      const { id } = await res.json();
      await authed(`/api/v1/invoices/${id}/pay`, { method: 'POST' });
    });

    // Overdue invoice (past due, unpaid)
    await authed('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        description: 'Overdue invoice',
        amountCents: 2000,
        dueDate: '2020-01-01',
      }),
    });

    // Pending invoice (future due, unpaid)
    await authed('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        description: 'Pending invoice',
        amountCents: 3000,
        dueDate: '2099-01-01',
      }),
    });
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/v1/dashboard/summary');
    expect(res.status).toBe(401);
  });

  it('returns totals and top-4 lists computed from actual invoice state', async () => {
    const res = await authed('/api/v1/dashboard/summary');
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.totals.paidCents).toBe(1000);
    expect(body.totals.overdueCents).toBe(2000);
    expect(body.totals.pendingCents).toBe(3000);

    expect(body.overdueClients.length).toBe(1);
    expect(body.overdueClients[0].username).toBe('Dash Client');
    expect(body.overdueClients[0].amountCents).toBe(2000);

    expect(body.upToDateClients.length).toBe(1);
    expect(body.upToDateClients[0].amountCents).toBe(3000);
  });
});

describe('dashboard totals above int32 range', () => {
  let testApp: TestApp;
  let ownerRequest: ReturnType<typeof authedRequest>;
  let otherRequest: ReturnType<typeof authedRequest>;
  let emptyRequest: ReturnType<typeof authedRequest>;

  beforeAll(async () => {
    testApp = await createTestApp();
    const { app } = testApp;

    const { token: ownerToken } = await registerUser(app, {
      username: 'Large Totals Owner',
      email: 'large-totals-owner@example.com',
    });
    ownerRequest = authedRequest(app, ownerToken);

    const { token: otherToken } = await registerUser(app, {
      username: 'Other Large Totals Owner',
      email: 'other-large-totals-owner@example.com',
    });
    otherRequest = authedRequest(app, otherToken);

    const { token: emptyToken } = await registerUser(app, {
      username: 'Empty Dashboard Owner',
      email: 'empty-dashboard-owner@example.com',
    });
    emptyRequest = authedRequest(app, emptyToken);

    const createClient = async (
      request: ReturnType<typeof authedRequest>,
      username: string,
      email: string,
      cpf: string,
    ) => {
      const response = await request('/api/v1/clients', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          cpf,
          phone: '11999999999',
        }),
      });
      expect(response.status).toBe(201);
      return (await response.json()).id as string;
    };

    const ownerClientId = await createClient(
      ownerRequest,
      'Large Totals Client',
      'large-totals-client@example.com',
      '00000000353',
    );
    const otherClientId = await createClient(
      otherRequest,
      'Other Large Totals Client',
      'other-large-totals-client@example.com',
      '00000004006',
    );

    const createInvoice = async (
      request: ReturnType<typeof authedRequest>,
      clientId: string,
      dueDate: string,
      pay = false,
    ) => {
      const response = await request('/api/v1/invoices', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          description: 'Large dashboard total invoice',
          amountCents: 1_500_000_000,
          dueDate,
        }),
      });
      expect(response.status).toBe(201);
      const invoice = await response.json();

      if (pay) {
        const paidResponse = await request(
          `/api/v1/invoices/${invoice.id}/pay`,
          { method: 'POST' },
        );
        expect(paidResponse.status).toBe(200);
        expect((await paidResponse.json()).amountCents).toBe(1_500_000_000);
      }

      return invoice;
    };

    // A paid past-due invoice belongs in the paid total only.
    await createInvoice(ownerRequest, ownerClientId, '2020-01-01', true);
    await createInvoice(ownerRequest, ownerClientId, '2020-01-01', true);

    // Five past-due invoices also exercise the four-row dashboard cap.
    for (let i = 0; i < 5; i += 1) {
      await createInvoice(ownerRequest, ownerClientId, '2020-01-01');
    }

    await createInvoice(ownerRequest, ownerClientId, '2099-01-01');
    await createInvoice(ownerRequest, ownerClientId, '2099-01-01');

    // This large amount must remain isolated to the second account.
    await createInvoice(otherRequest, otherClientId, '2099-01-01');
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('returns exact numeric totals and keeps large invoice summaries intact', async () => {
    const response = await ownerRequest('/api/v1/dashboard/summary');
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.totals).toEqual({
      paidCents: 3_000_000_000,
      pendingCents: 3_000_000_000,
      overdueCents: 7_500_000_000,
    });
    for (const total of Object.values(body.totals)) {
      expect(typeof total).toBe('number');
      expect(Number.isSafeInteger(total)).toBe(true);
    }

    expect(body.overdueClients).toHaveLength(4);
    expect(
      body.overdueClients.every(
        (invoice: { amountCents: number }) =>
          invoice.amountCents === 1_500_000_000,
      ),
    ).toBe(true);
    expect(body.upToDateClients).toHaveLength(2);
    expect(
      body.upToDateClients.every(
        (invoice: { amountCents: number }) =>
          invoice.amountCents === 1_500_000_000,
      ),
    ).toBe(true);

    const otherResponse = await otherRequest('/api/v1/dashboard/summary');
    expect(otherResponse.status).toBe(200);
    const otherBody = await otherResponse.json();
    expect(otherBody.totals).toEqual({
      paidCents: 0,
      pendingCents: 1_500_000_000,
      overdueCents: 0,
    });

    const emptyResponse = await emptyRequest('/api/v1/dashboard/summary');
    expect(emptyResponse.status).toBe(200);
    const emptyBody = await emptyResponse.json();
    expect(emptyBody.totals).toEqual({
      paidCents: 0,
      pendingCents: 0,
      overdueCents: 0,
    });
    expect(emptyBody.overdueClients).toEqual([]);
    expect(emptyBody.upToDateClients).toEqual([]);
  });
});

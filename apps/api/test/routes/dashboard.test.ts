import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
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

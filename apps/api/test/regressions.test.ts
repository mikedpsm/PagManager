/**
 * Canonical, explicit collection of the legacy-bug regression scenarios
 * called out in GitHub issue #5 (Phase 4 - API). Several of these are also
 * spot-tested inline in the individual `test/routes/*.test.ts` files - this
 * file exists so the full set is reviewable/auditable in one place, as its
 * own named `it(...)` per scenario.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import {
  authedRequest,
  closeTestApp,
  createTestApp,
  registerUser,
  type TestApp,
} from './helpers/testApp.js';

describe('legacy regression scenarios', () => {
  let testApp: TestApp;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('1. rejects duplicate email registration with 409, not silently allowed (legacy: wrong result-shape check)', async () => {
    const first = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Dup User',
        email: 'dup-regression@example.com',
        passwd: 'supersecret',
      }),
    });
    expect(first.status).toBe(201);

    const second = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Dup User 2',
        email: 'dup-regression@example.com',
        passwd: 'anothersecret',
      }),
    });
    expect(second.status).toBe(409);
    const body = await second.json();
    expect(body.code).toBe('CONFLICT');
  });

  it('2. register response body never contains the password hash field or any hash-like value', async () => {
    const password = 'supersecret-regression';
    const res = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'No Hash User',
        email: 'no-hash@example.com',
        passwd: password,
      }),
    });
    expect(res.status).toBe(201);
    const raw = JSON.stringify(await res.json());

    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('password');
    expect(raw).not.toContain(password);
    // Argon2/bcrypt hash prefixes should never leak into the response body.
    expect(raw).not.toMatch(/\$(argon2|2a|2b|2y)\$/);
  });

  it('3. PATCH /invoices/:id without dueDate preserves the existing due date exactly (legacy: always overwrote with new Date())', async () => {
    const { token } = await registerUser(app, {
      email: 'due-date-regression@example.com',
    });
    const authed = authedRequest(app, token);

    const clientRes = await authed('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Due Date Client',
        email: 'due-date-client@example.com',
        cpf: '00000000353',
        phone: '11999999999',
      }),
    });
    const client = await clientRes.json();

    const originalDueDate = '2030-06-15';
    const invoiceRes = await authed('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: client.id,
        description: 'Original invoice',
        amountCents: 5000,
        dueDate: originalDueDate,
      }),
    });
    const invoice = await invoiceRes.json();
    expect(invoice.dueDate).toBe(originalDueDate);

    const patchRes = await authed(`/api/v1/invoices/${invoice.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Only description changed' }),
    });
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();

    expect(patched.dueDate).toBe(originalDueDate);
    expect(patched.description).toBe('Only description changed');
  });

  it('4. invalid/malformed request payloads return clean 400s, never a 500, through the proper error handler', async () => {
    const malformedCases: Array<{ path: string; init: RequestInit }> = [
      {
        path: '/api/v1/auth/register',
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: '', email: 'not-an-email', passwd: '1' }),
        },
      },
      {
        path: '/api/v1/auth/login',
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'not-an-email' }),
        },
      },
      {
        path: '/api/v1/auth/register',
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{not valid json',
        },
      },
    ];

    for (const { path, init } of malformedCases) {
      const res = await app.request(path, init);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBeTruthy();
      expect(res.status).not.toBe(500);
    }
  });

  it('5. a CPF with leading zeros round-trips exactly through register/client-create and read-back (legacy: yup.number() truncation)', async () => {
    const leadingZeroCpf = '01234567890';

    const { token } = await registerUser(app, {
      email: 'cpf-regression@example.com',
    });
    const authed = authedRequest(app, token);

    // Client creation with a leading-zero CPF.
    const createRes = await authed('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'CPF Client',
        email: 'cpf-client-regression@example.com',
        cpf: leadingZeroCpf,
        phone: '11999999999',
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.cpf).toBe(leadingZeroCpf);
    expect(typeof created.cpf).toBe('string');

    // Read-back must not have truncated the leading zero.
    const getRes = await authed(`/api/v1/clients/${created.id}`);
    const fetched = await getRes.json();
    expect(fetched.cpf).toBe(leadingZeroCpf);

    // Same guarantee via PATCH /me.
    const meRes = await authed('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ cpf: leadingZeroCpf }),
    });
    expect(meRes.status).toBe(200);
    const me = await meRes.json();
    expect(me.cpf).toBe(leadingZeroCpf);
  });

  it('6. cross-user isolation: user A cannot read/update/delete user B data, and never sees B amounts in the dashboard', async () => {
    const { token: tokenA } = await registerUser(app, {
      email: 'iso-a@example.com',
    });
    const { token: tokenB } = await registerUser(app, {
      email: 'iso-b@example.com',
    });
    const asA = authedRequest(app, tokenA);
    const asB = authedRequest(app, tokenB);

    const clientAId = (
      await (
        await asA('/api/v1/clients', {
          method: 'POST',
          body: JSON.stringify({
            username: 'Iso Client A',
            email: 'iso-client-a@example.com',
            cpf: '00000001082',
            phone: '11999999999',
          }),
        })
      ).json()
    ).id;

    const clientBId = (
      await (
        await asB('/api/v1/clients', {
          method: 'POST',
          body: JSON.stringify({
            username: 'Iso Client B',
            email: 'iso-client-b@example.com',
            cpf: '00000004006',
            phone: '11988888888',
          }),
        })
      ).json()
    ).id;

    const invoiceB = await (
      await asB('/api/v1/invoices', {
        method: 'POST',
        body: JSON.stringify({
          clientId: clientBId,
          description: 'User B invoice',
          amountCents: 999_999,
          dueDate: '2020-01-01',
        }),
      })
    ).json();

    // A cannot read B's client (404, not 403 - never leak existence).
    expect((await asA(`/api/v1/clients/${clientBId}`)).status).toBe(404);
    // A cannot update B's client.
    expect(
      (
        await asA(`/api/v1/clients/${clientBId}`, {
          method: 'PATCH',
          body: JSON.stringify({ username: 'Hacked' }),
        })
      ).status,
    ).toBe(404);
    // A cannot delete B's client.
    expect(
      (await asA(`/api/v1/clients/${clientBId}`, { method: 'DELETE' })).status,
    ).toBe(404);

    // A cannot read/update/delete B's invoice.
    expect((await asA(`/api/v1/invoices/${invoiceB.id}`)).status).toBe(404);
    expect(
      (
        await asA(`/api/v1/invoices/${invoiceB.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ description: 'Hacked' }),
        })
      ).status,
    ).toBe(404);
    expect(
      (await asA(`/api/v1/invoices/${invoiceB.id}`, { method: 'DELETE' })).status,
    ).toBe(404);

    // A's dashboard totals never include any of B's amounts.
    await asA('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify({
        clientId: clientAId,
        description: 'User A invoice',
        amountCents: 1234,
        dueDate: '2020-01-01',
      }),
    });

    const dashboardA = await (await asA('/api/v1/dashboard/summary')).json();
    const totalCentsA =
      dashboardA.totals.paidCents +
      dashboardA.totals.pendingCents +
      dashboardA.totals.overdueCents;

    expect(totalCentsA).toBe(1234);
    expect(totalCentsA).not.toBe(999_999);
    expect(
      dashboardA.overdueClients.some(
        (entry: { amountCents: number }) => entry.amountCents === 999_999,
      ),
    ).toBe(false);
  });

  it('7. client/invoice status is computed dynamically from due-dates/paid-state, never trusted from a stale stored column', async () => {
    const { token } = await registerUser(app, {
      email: 'status-regression@example.com',
    });
    const authed = authedRequest(app, token);

    const client = await (
      await authed('/api/v1/clients', {
        method: 'POST',
        body: JSON.stringify({
          username: 'Status Client',
          email: 'status-client-regression@example.com',
          cpf: '00000002054',
          phone: '11999999999',
        }),
      })
    ).json();

    // Freshly created client with no invoices is reported "ok".
    expect(client.status).toBe('ok');

    const overdueInvoice = await (
      await authed('/api/v1/invoices', {
        method: 'POST',
        body: JSON.stringify({
          clientId: client.id,
          description: 'Overdue invoice',
          amountCents: 1000,
          dueDate: '2000-01-01',
        }),
      })
    ).json();

    // A brand-new invoice with a past due date is immediately "overdue" -
    // there is no stored status column being read back stale here.
    expect(overdueInvoice.status).toBe('overdue');

    const clientAfter = await (
      await authed(`/api/v1/clients/${client.id}`)
    ).json();
    expect(clientAfter.status).toBe('overdue');

    // Paying the invoice flips both the invoice and the client status live,
    // with no separate "recompute status" step required.
    await authed(`/api/v1/invoices/${overdueInvoice.id}/pay`, {
      method: 'POST',
    });

    const invoiceAfterPay = await (
      await authed(`/api/v1/invoices/${overdueInvoice.id}`)
    ).json();
    expect(invoiceAfterPay.status).toBe('paid');

    const clientAfterPay = await (
      await authed(`/api/v1/clients/${client.id}`)
    ).json();
    expect(clientAfterPay.status).toBe('ok');
  });
});

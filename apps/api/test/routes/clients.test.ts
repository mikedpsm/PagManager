import { clients, type Db, invoices } from '@pagmanager/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { createApp } from '../../src/app.js';
import {
  authedRequest,
  closeTestApp,
  createTestApp,
  registerUser,
  type TestApp,
} from '../helpers/testApp.js';

describe('clients routes', () => {
  let testApp: TestApp;
  let db: Db;
  let app: ReturnType<typeof createApp>;
  let tokenA: string;
  let tokenB: string;

  async function register(email: string) {
    const { token } = await registerUser(app, { email });
    return token;
  }

  beforeAll(async () => {
    testApp = await createTestApp();
    ({ db, app } = testApp);
    tokenA = await register('user-a@example.com');
    tokenB = await register('user-b@example.com');
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  const asA = () => authedRequest(app, tokenA);
  const asB = () => authedRequest(app, tokenB);

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/v1/clients');
    expect(res.status).toBe(401);
  });

  it('creates a client with a leading-zero CPF preserved as a string', async () => {
    const res = await asA()('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Client One',
        email: 'client-one@example.com',
        cpf: '00000000353',
        phone: '11999999999',
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.cpf).toBe('00000000353');
    expect(body.status).toBe('ok');
  });

  it('rejects a duplicate CPF with 409 (real duplicate check)', async () => {
    const res = await asA()('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Client Dup',
        email: 'client-dup@example.com',
        cpf: '00000000353',
        phone: '11988888888',
      }),
    });
    expect(res.status).toBe(409);
  });

  it('rejects invalid input with 400', async () => {
    const res = await asA()('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: '',
        email: 'not-an-email',
        cpf: 'invalid',
        phone: '11999999999',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('lists only the current user own clients', async () => {
    await asB()('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Client B',
        email: 'client-b@example.com',
        cpf: '00000004006',
        phone: '11977777777',
      }),
    });

    const resA = await asA()('/api/v1/clients');
    const listA = await resA.json();
    expect(
      listA.some(
        (c: { email: string }) => c.email === 'client-one@example.com',
      ),
    ).toBe(true);
    expect(
      listA.some((c: { email: string }) => c.email === 'client-b@example.com'),
    ).toBe(false);
  });

  it('returns 404 (not 403) when getting another user client by id', async () => {
    const listB = await (await asB()('/api/v1/clients')).json();
    const clientBId = listB[0].id;

    const res = await asA()(`/api/v1/clients/${clientBId}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent client id', async () => {
    const res = await asA()(
      '/api/v1/clients/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(404);
  });

  it('PATCH updates only provided fields and rejects duplicate email/cpf', async () => {
    const listA = await (await asA()('/api/v1/clients')).json();
    const clientId = listA.find(
      (c: { email: string }) => c.email === 'client-one@example.com',
    ).id;

    const patchRes = await asA()(`/api/v1/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify({ phone: '11900000000' }),
    });
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.phone).toBe('11900000000');
    expect(patched.username).toBe('Client One');

    const dupRes = await asA()(`/api/v1/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify({ cpf: '00000004006' }),
    });
    expect(dupRes.status).toBe(409);
  });

  it('computes status as overdue via a correlated invoice check, not a stored flag', async () => {
    const listA = await (await asA()('/api/v1/clients')).json();
    const clientId = listA.find(
      (c: { email: string }) => c.email === 'client-one@example.com',
    ).id;

    await db.client.insert(invoices).values({
      clientId,
      description: 'Overdue invoice',
      amountCents: 1000,
      dueDate: '2000-01-01',
    });

    // The stored `clients.status` column still defaults to 'ok' - only the
    // live, computed EXISTS-based status should report 'overdue'.
    const storedRows = await db.client
      .select({ status: clients.status })
      .from(clients)
      .where(eq(clients.id, clientId));
    expect(storedRows[0]?.status).toBe('ok');

    const res = await asA()(`/api/v1/clients/${clientId}`);
    const body = await res.json();
    expect(body.status).toBe('overdue');

    const filtered = await asA()('/api/v1/clients?status=overdue');
    const filteredList = await filtered.json();
    expect(filteredList.some((c: { id: string }) => c.id === clientId)).toBe(
      true,
    );
  });

  it('DELETE removes the client scoped to the current user', async () => {
    const create = await asA()('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'To Delete',
        email: 'to-delete@example.com',
        cpf: '00000007790',
        phone: '11966666666',
      }),
    });
    const created = await create.json();

    const del = await asA()(`/api/v1/clients/${created.id}`, {
      method: 'DELETE',
    });
    expect(del.status).toBe(204);

    const getRes = await asA()(`/api/v1/clients/${created.id}`);
    expect(getRes.status).toBe(404);
  });
});

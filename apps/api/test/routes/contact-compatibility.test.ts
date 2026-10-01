import { clients, users } from '@pagmanager/db';
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

describe('contact compatibility routes', () => {
  let testApp: TestApp;
  let db: TestApp['db'];
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    testApp = await createTestApp();
    ({ db, app } = testApp);
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('logs in and reads legacy user contact data while keeping profile edits strict and partial', async () => {
    const registered = await registerUser(app, {
      email: 'legacy-user@example.test',
      username: 'Usuário legado',
      passwd: 'legacy-password',
    });
    const userId = registered.user.id as string;
    await db.client
      .update(users)
      .set({ phone: '123' })
      .where(eq(users.id, userId));

    const login = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'legacy-user@example.test',
        passwd: 'legacy-password',
      }),
    });
    expect(login.status).toBe(200);
    const loginBody = await login.json();
    expect(loginBody.user.phone).toBe('123');

    const asUser = authedRequest(app, loginBody.token as string);
    const me = await asUser('/api/v1/me');
    expect(me.status).toBe(200);
    expect((await me.json()).phone).toBe('123');

    const partialPatch = await asUser('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'Nome atualizado' }),
    });
    expect(partialPatch.status).toBe(200);
    expect((await partialPatch.json()).phone).toBe('123');

    const invalidPatch = await asUser('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ phone: '123' }),
    });
    expect(invalidPatch.status).toBe(400);
    const invalidBody = await invalidPatch.json();
    expect(invalidBody.code).toBe('VALIDATION_ERROR');
    expect(invalidBody.message).toBe('Invalid request');
    expect(JSON.stringify(invalidBody.details)).toContain(
      'Informe um telefone com DDD',
    );

    const unchanged = await db.client
      .select({ phone: users.phone })
      .from(users)
      .where(eq(users.id, userId));
    expect(unchanged[0]?.phone).toBe('123');

    const validPatch = await asUser('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify({ phone: '(11) 98888-7777' }),
    });
    expect(validPatch.status).toBe(200);
    expect((await validPatch.json()).phone).toBe('11988887777');
    const normalized = await db.client
      .select({ phone: users.phone })
      .from(users)
      .where(eq(users.id, userId));
    expect(normalized[0]?.phone).toBe('11988887777');
  });

  it('lists legacy clients unchanged, scopes them by owner, and validates only contact updates', async () => {
    const userA = await registerUser(app, {
      email: 'legacy-client-owner@example.test',
    });
    const userB = await registerUser(app, {
      email: 'other-client-owner@example.test',
    });
    const userAId = userA.user.id as string;
    const userBId = userB.user.id as string;
    const legacyClientId = 'a1111111-1111-4111-8111-111111111111';
    const otherClientId = 'b1111111-1111-4111-8111-111111111111';
    const currentClientId = 'a2222222-2222-4222-8222-222222222222';

    await db.client.insert(clients).values([
      {
        id: legacyClientId,
        userId: userAId,
        username: 'Contato legado',
        email: 'legacy-contact@example.test',
        cpf: '52998224725',
        phone: '123',
        cep: '01001',
      },
      {
        id: currentClientId,
        userId: userAId,
        username: 'Contato válido',
        email: 'valid-contact@example.test',
        cpf: '00000000353',
        phone: '11988887777',
        cep: '01001000',
      },
      {
        id: otherClientId,
        userId: userBId,
        username: 'Contato de outra conta',
        email: 'private-contact@example.test',
        cpf: '00000001082',
        phone: '+1 212 555 1234',
        cep: 'not-a-postal-code',
      },
    ]);

    const asA = authedRequest(app, userA.token);
    const list = await asA('/api/v1/clients');
    expect(list.status).toBe(200);
    const listBody = await list.json();
    expect(listBody).toHaveLength(2);
    expect(
      listBody.some((client: { id: string }) => client.id === otherClientId),
    ).toBe(false);
    const listedLegacy = listBody.find(
      (client: { id: string }) => client.id === legacyClientId,
    );
    expect(listedLegacy.phone).toBe('123');
    expect(listedLegacy.cep).toBe('01001');

    const detail = await asA(`/api/v1/clients/${legacyClientId}`);
    expect(detail.status).toBe(200);
    const detailBody = await detail.json();
    expect(detailBody.phone).toBe('123');
    expect(detailBody.cep).toBe('01001');
    expect((await asA(`/api/v1/clients/${otherClientId}`)).status).toBe(404);

    const partialPatch = await asA(`/api/v1/clients/${legacyClientId}`, {
      method: 'PATCH',
      body: JSON.stringify({ username: 'Nome alterado' }),
    });
    expect(partialPatch.status).toBe(200);
    const partialBody = await partialPatch.json();
    expect(partialBody.phone).toBe('123');
    expect(partialBody.cep).toBe('01001');

    for (const [field, value, message] of [
      ['phone', '123', 'Informe um telefone com DDD'],
      ['cep', '01001', 'Informe um CEP com 8 dígitos'],
    ] as const) {
      const invalidPatch = await asA(`/api/v1/clients/${legacyClientId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      });
      expect(invalidPatch.status).toBe(400);
      const invalidBody = await invalidPatch.json();
      expect(invalidBody.code).toBe('VALIDATION_ERROR');
      expect(invalidBody.message).toBe('Invalid request');
      expect(JSON.stringify(invalidBody.details)).toContain(message);
    }

    const unchanged = await db.client
      .select({ phone: clients.phone, cep: clients.cep })
      .from(clients)
      .where(eq(clients.id, legacyClientId));
    expect(unchanged[0]).toEqual({ phone: '123', cep: '01001' });

    const validPatch = await asA(`/api/v1/clients/${legacyClientId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        phone: '(11) 98888-7777',
        cep: '01001-000',
      }),
    });
    expect(validPatch.status).toBe(200);
    const validBody = await validPatch.json();
    expect(validBody.phone).toBe('11988887777');
    expect(validBody.cep).toBe('01001000');

    const invalidPhoneCreate = await asA('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Telefone inválido',
        email: 'invalid-phone@example.test',
        cpf: '00000004006',
        phone: '123',
      }),
    });
    expect(invalidPhoneCreate.status).toBe(400);
    expect((await invalidPhoneCreate.json()).code).toBe('VALIDATION_ERROR');

    const invalidCepCreate = await asA('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'CEP inválido',
        email: 'invalid-cep@example.test',
        cpf: '00000004006',
        phone: '11999999999',
        cep: '01001',
      }),
    });
    expect(invalidCepCreate.status).toBe(400);
    expect((await invalidCepCreate.json()).code).toBe('VALIDATION_ERROR');

    const maskedCreate = await asA('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify({
        username: 'Novo contato',
        email: 'masked-contact@example.test',
        cpf: '00000004006',
        phone: '(11) 3333-4444',
        cep: '01001-000',
      }),
    });
    expect(maskedCreate.status).toBe(201);
    const maskedBody = await maskedCreate.json();
    expect(maskedBody.phone).toBe('1133334444');
    expect(maskedBody.cep).toBe('01001000');
  });
});

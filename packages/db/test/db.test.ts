import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import type { Db } from '../src/db.js';
import {
  clients,
  createDb,
  createInMemoryDb,
  initializeDb,
  invoices,
  runMigrations,
  seed,
  users,
} from '../src/index.js';
import { demoUser } from '../src/seed.js';

async function migrateAndSeed(db: Db): Promise<void> {
  await runMigrations(db);
  await seed(db);
}

async function expectSeededData(db: Db): Promise<void> {
  const userRows = await db.client.select().from(users);
  expect(userRows).toHaveLength(1);
  expect(userRows[0]).toMatchObject({
    id: demoUser.id,
    username: 'Demo User',
    email: 'demo@pagmanager.dev',
    cpf: null,
    phone: null,
    passwordHash: '!disabled!demo-user-has-no-password',
  });

  const clientRows = await db.client.select().from(clients);
  expect(clientRows).toHaveLength(3);
  expect(clientRows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        userId: demoUser.id,
        username: 'Cris Vieira',
        email: 'cris.vieira@yahoo.net',
        cpf: '96266121967',
        phone: '11943428497',
        city: 'Campo Grande',
        cep: '91511-011',
        uf: 'MS',
        street: 'Rua 51',
        region: 'Norte',
        complement: 'Nmr 16',
        status: 'overdue',
      }),
      expect.objectContaining({
        userId: demoUser.id,
        username: 'Camilla Straider',
        email: 'cami-stdr@protonmail.edu',
        cpf: '89940018237',
        phone: '672234307',
        city: 'São Bernardo do Campo',
        cep: '62368-470',
        uf: 'SP',
        street: 'Rua Cruz Solitária',
        region: 'Sul',
        complement: 'Ao lado do mercado',
        status: 'ok',
      }),
      expect.objectContaining({
        userId: demoUser.id,
        username: 'Dio Costa',
        email: 'dicosta@hotmail.net',
        cpf: '02180514173',
        phone: '61958096329',
        city: 'Manaus',
        cep: '60770-851',
        uf: 'AM',
        street: 'Rua General Arqueiro',
        region: 'Centro',
        complement: 'P.O. Box 481, apt 9256',
        status: 'overdue',
      }),
    ]),
  );

  const invoiceRows = await db.client.select().from(invoices);
  expect(invoiceRows).toHaveLength(3);
  expect(invoiceRows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        description: 'Compra de 02 lotes de Red Bull',
        amountCents: 50000,
        dueDate: '2019-02-11',
        paidAt: null,
        status: 'pending',
      }),
      expect.objectContaining({
        description: 'Serviços de limpeza',
        amountCents: 90000,
        dueDate: '2022-05-21',
        paidAt: null,
        status: 'pending',
      }),
      expect.objectContaining({
        description: 'Construção de um castelo Lego',
        amountCents: 200000,
        dueDate: '2020-09-03',
        paidAt: null,
        status: 'paid',
      }),
    ]),
  );
}

describe('in-memory PGlite', () => {
  it('migrates and seeds the demo data', async () => {
    const db = createInMemoryDb();
    try {
      await migrateAndSeed(db);
      await expectSeededData(db);
    } finally {
      await db.close();
    }
  });

  it('seed is idempotent', async () => {
    const db = createInMemoryDb();
    try {
      await migrateAndSeed(db);
      await seed(db);
      await seed(db);
      const [userRows, clientRows, invoiceRows] = await Promise.all([
        db.client.select().from(users),
        db.client.select().from(clients),
        db.client.select().from(invoices),
      ]);
      expect(userRows).toHaveLength(1);
      expect(clientRows).toHaveLength(3);
      expect(invoiceRows).toHaveLength(3);
    } finally {
      await db.close();
    }
  });

  it('user citext email is case-insensitive for lookup and uniqueness', async () => {
    const db = createInMemoryDb();
    try {
      await migrateAndSeed(db);
      const found = await db.client
        .select()
        .from(users)
        .where(eq(users.email, 'DEMO@PAGMANAGER.DEV'));
      expect(found).toHaveLength(1);
      expect(found[0]?.username).toBe('Demo User');
      await expect(
        db.client.insert(users).values({
          id: '00000000-0000-4000-8000-000000000009',
          username: 'Duplicate User',
          email: 'DEMO@PAGMANAGER.DEV',
          passwordHash: '!disabled!demo-user-has-no-password',
        }),
      ).rejects.toThrow();
    } finally {
      await db.close();
    }
  });

  it('citext emails are case-insensitive for lookup and uniqueness', async () => {
    const db = createInMemoryDb();
    try {
      await migrateAndSeed(db);
      const found = await db.client
        .select()
        .from(clients)
        .where(eq(clients.email, 'CRIS.VIEIRA@YAHOO.NET'));
      expect(found).toHaveLength(1);
      expect(found[0]?.username).toBe('Cris Vieira');

      await expect(
        db.client.insert(clients).values({
          id: '00000000-0000-4000-8000-000000000199',
          userId: demoUser.id,
          username: 'Duplicate Email',
          email: 'Cris.Vieira@Yahoo.Net',
          cpf: '11111111111',
          phone: '00000000000',
          status: 'ok',
        }),
      ).rejects.toThrow();
    } finally {
      await db.close();
    }
  });

  it('deleting a client cascades to its invoices', async () => {
    const db = createInMemoryDb();
    try {
      await migrateAndSeed(db);
      await db.client
        .delete(clients)
        .where(eq(clients.id, '00000000-0000-4000-8000-000000000103'));
      const invoiceRows = await db.client.select().from(invoices);
      expect(invoiceRows).toHaveLength(2);
      expect(
        invoiceRows.some(
          (invoice) => invoice.description === 'Construção de um castelo Lego',
        ),
      ).toBe(false);
    } finally {
      await db.close();
    }
  });

  it('rejects negative invoice amounts via check constraint', async () => {
    const db = createInMemoryDb();
    try {
      await migrateAndSeed(db);
      await expect(
        db.client.insert(invoices).values({
          id: '00000000-0000-4000-8000-000000000299',
          clientId: '00000000-0000-4000-8000-000000000101',
          description: 'Negative amount',
          amountCents: -1,
          dueDate: '2020-01-01',
          status: 'pending',
        }),
      ).rejects.toThrow();
    } finally {
      await db.close();
    }
  });

  it('createDb without DATABASE_URL uses persistent PGlite under DATA_DIR/pglite', async () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'pagmanager-db-'));
    try {
      const dataDir = path.join(tmpDir, 'nested', 'data');
      const db = createDb({ DATA_DIR: dataDir });
      expect(db.driver).toBe('pglite');
      await migrateAndSeed(db);
      await expectSeededData(db);
      await db.close();
      expect(existsSync(path.join(dataDir, 'pglite'))).toBe(true);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('initializeDb applies migrations and returns a usable DB', async () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'pagmanager-init-'));
    try {
      const db = await initializeDb({ DATA_DIR: tmpDir });
      try {
        expect(db.driver).toBe('pglite');
        await db.client.insert(users).values(demoUser);
        const rows = await db.client.select().from(users);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ email: demoUser.email });
      } finally {
        await db.close();
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;

describePostgres('real Postgres via postgres.js', () => {
  const url = databaseUrl as string;

  it('migrates and seeds the demo data', async () => {
    const db = createDb({ DATABASE_URL: url });
    try {
      await migrateAndSeed(db);
      await expectSeededData(db);
    } finally {
      await db.close();
    }
  });

  it('seed is idempotent', async () => {
    const db = createDb({ DATABASE_URL: url });
    try {
      await migrateAndSeed(db);
      await seed(db);
      const [userRows, clientRows, invoiceRows] = await Promise.all([
        db.client.select().from(users),
        db.client.select().from(clients),
        db.client.select().from(invoices),
      ]);
      expect(userRows).toHaveLength(1);
      expect(clientRows).toHaveLength(3);
      expect(invoiceRows).toHaveLength(3);
    } finally {
      await db.close();
    }
  });
});

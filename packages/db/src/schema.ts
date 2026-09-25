import { sql } from 'drizzle-orm';
import {
  check,
  customType,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

export const clientStatusEnum = pgEnum('client_status', ['overdue', 'ok']);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'paid',
  'pending',
  'overdue',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull(),
  email: citext('email').notNull().unique(),
  cpf: text('cpf'),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: text('username').notNull(),
    email: citext('email').notNull().unique(),
    cpf: text('cpf').notNull().unique(),
    phone: text('phone').notNull(),
    city: text('city'),
    cep: text('cep'),
    uf: text('uf'),
    street: text('street'),
    region: text('region'),
    complement: text('complement'),
    status: clientStatusEnum('status').notNull().default('ok'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('clients_status_idx').on(table.status)],
);

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    amountCents: integer('amount_cents').notNull(),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    status: invoiceStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('invoices_client_id_idx').on(table.clientId),
    index('invoices_status_idx').on(table.status),
    index('invoices_due_date_idx').on(table.dueDate),
    check('invoices_amount_cents_nonnegative', sql`${table.amountCents} >= 0`),
  ],
);

export const schema = { users, clients, invoices };

export type Schema = typeof schema;

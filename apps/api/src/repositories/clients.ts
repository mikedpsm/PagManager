import type { Db } from '@pagmanager/db';
import { clients, invoices } from '@pagmanager/db';
import type { ClientListQuery, ClientStatus } from '@pagmanager/contracts';
import { and, asc, desc, eq, ilike, ne, or, type SQL, sql } from 'drizzle-orm';

import { client } from '../db-client.js';

/**
 * Correlated EXISTS subquery: true when the given client has at least one
 * unpaid invoice whose due date has already passed. This is the single
 * source of truth for "overdue" status - we never trust a stored/cached
 * status column, since it can drift out of sync as invoices are paid or
 * their due dates pass.
 */
function overdueExistsCondition(): SQL {
  return sql`exists (
    select 1 from ${invoices}
    where ${invoices.clientId} = ${clients.id}
      and ${invoices.paidAt} is null
      and ${invoices.dueDate} < current_date
  )`;
}

const computedStatus = sql<ClientStatus>`(case when ${overdueExistsCondition()} then 'overdue' else 'ok' end)`;

function clientColumns() {
  return {
    id: clients.id,
    username: clients.username,
    email: clients.email,
    cpf: clients.cpf,
    phone: clients.phone,
    city: clients.city,
    cep: clients.cep,
    uf: clients.uf,
    street: clients.street,
    region: clients.region,
    complement: clients.complement,
    status: computedStatus.as('status'),
  };
}

export interface ClientRow {
  id: string;
  username: string;
  email: string;
  cpf: string;
  phone: string;
  city: string | null;
  cep: string | null;
  uf: string | null;
  street: string | null;
  region: string | null;
  complement: string | null;
  status: ClientStatus;
}

export async function listClients(
  db: Db,
  userId: string,
  query: ClientListQuery,
): Promise<ClientRow[]> {
  const conditions: SQL[] = [eq(clients.userId, userId)];

  if (query.search) {
    const term = `%${query.search}%`;
    const searchCondition = or(
      ilike(clients.username, term),
      ilike(clients.email, term),
      ilike(clients.cpf, term),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (query.status === 'overdue') {
    conditions.push(overdueExistsCondition());
  } else if (query.status === 'ok') {
    conditions.push(sql`not (${overdueExistsCondition()})`);
  }

  const orderBy =
    query.sort === '-username' ? desc(clients.username) : asc(clients.username);

  return db.client
    .select(clientColumns())
    .from(clients)
    .where(and(...conditions))
    .orderBy(orderBy) as Promise<ClientRow[]>;
}

export async function findClientById(
  db: Db,
  userId: string,
  id: string,
): Promise<ClientRow | undefined> {
  const rows = (await db.client
    .select(clientColumns())
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .limit(1)) as ClientRow[];
  return rows[0];
}

export async function findClientByCpfOrEmail(
  db: Db,
  params: { cpf?: string; email?: string; excludeId?: string },
): Promise<boolean> {
  const { cpf, email, excludeId } = params;
  const matchConditions: SQL[] = [];
  if (cpf) matchConditions.push(eq(clients.cpf, cpf));
  if (email) matchConditions.push(eq(clients.email, email));
  if (matchConditions.length === 0) return false;

  const orCondition = or(...matchConditions);
  const conditions: SQL[] = orCondition ? [orCondition] : [];
  if (excludeId) conditions.push(ne(clients.id, excludeId));

  const rows = await db.client
    .select({ id: clients.id })
    .from(clients)
    .where(and(...conditions))
    .limit(1);

  return rows.length > 0;
}

export interface CreateClientData {
  userId: string;
  username: string;
  email: string;
  cpf: string;
  phone: string;
  city?: string;
  cep?: string;
  uf?: string;
  street?: string;
  region?: string;
  complement?: string;
}

export async function insertClient(
  db: Db,
  data: CreateClientData,
): Promise<{ id: string }> {
  const [row] = await client(db)
    .insert(clients)
    .values(data)
    .returning({ id: clients.id });
  if (!row) throw new Error('Failed to insert client');
  return row;
}

export interface UpdateClientData {
  username?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  city?: string;
  cep?: string;
  uf?: string;
  street?: string;
  region?: string;
  complement?: string;
}

export async function updateClientById(
  db: Db,
  userId: string,
  id: string,
  data: UpdateClientData,
): Promise<void> {
  if (Object.keys(data).length === 0) return;
  await db.client
    .update(clients)
    .set(data)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

export async function deleteClientById(
  db: Db,
  userId: string,
  id: string,
): Promise<void> {
  await db.client
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

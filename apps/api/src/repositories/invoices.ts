import type { InvoiceListQuery, InvoiceStatus } from '@pagmanager/contracts';
import type { Db } from '@pagmanager/db';
import { clients, invoices } from '@pagmanager/db';
import { and, asc, eq, type SQL, sql } from 'drizzle-orm';

import { client } from '../db-client.js';

/**
 * Invoice status is always derived from paid_at/due_date rather than trusted
 * from the stored `status` column, so it can never drift out of sync.
 */
const computedStatus = sql<InvoiceStatus>`(case
  when ${invoices.paidAt} is not null then 'paid'
  when ${invoices.dueDate} < current_date then 'overdue'
  else 'pending'
end)`;

function invoiceColumns() {
  return {
    id: invoices.id,
    clientId: invoices.clientId,
    description: invoices.description,
    amountCents: invoices.amountCents,
    dueDate: invoices.dueDate,
    paidAt: invoices.paidAt,
    status: computedStatus.as('status'),
  };
}

export interface InvoiceRow {
  id: string;
  clientId: string;
  description: string;
  amountCents: number;
  dueDate: string;
  paidAt: Date | null;
  status: InvoiceStatus;
}

/** Every invoice query is scoped to the current user's clients only. */
function ownershipCondition(userId: string): SQL {
  return sql`exists (
    select 1 from ${clients}
    where ${clients.id} = ${invoices.clientId}
      and ${clients.userId} = ${userId}
  )`;
}

function statusCondition(status: InvoiceStatus): SQL {
  if (status === 'paid') {
    return sql`${invoices.paidAt} is not null`;
  }
  if (status === 'overdue') {
    return sql`${invoices.paidAt} is null and ${invoices.dueDate} < current_date`;
  }
  return sql`${invoices.paidAt} is null and ${invoices.dueDate} >= current_date`;
}

export async function listInvoices(
  db: Db,
  userId: string,
  query: InvoiceListQuery,
): Promise<InvoiceRow[]> {
  const conditions: SQL[] = [ownershipCondition(userId)];

  if (query.status) {
    conditions.push(statusCondition(query.status));
  }
  if (query.clientId) {
    conditions.push(eq(invoices.clientId, query.clientId));
  }

  return db.client
    .select(invoiceColumns())
    .from(invoices)
    .where(and(...conditions))
    .orderBy(asc(invoices.dueDate)) as Promise<InvoiceRow[]>;
}

export async function findInvoiceById(
  db: Db,
  userId: string,
  id: string,
): Promise<InvoiceRow | undefined> {
  const rows = (await db.client
    .select(invoiceColumns())
    .from(invoices)
    .where(and(eq(invoices.id, id), ownershipCondition(userId)))
    .limit(1)) as InvoiceRow[];
  return rows[0];
}

export async function clientBelongsToUser(
  db: Db,
  userId: string,
  clientId: string,
): Promise<boolean> {
  const rows = await db.client
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export interface CreateInvoiceData {
  clientId: string;
  description: string;
  amountCents: number;
  dueDate: string;
}

export async function insertInvoice(
  db: Db,
  data: CreateInvoiceData,
): Promise<{ id: string }> {
  const [row] = await client(db)
    .insert(invoices)
    .values({ ...data, status: 'pending' })
    .returning({ id: invoices.id });
  if (!row) throw new Error('Failed to insert invoice');
  return row;
}

export interface UpdateInvoiceData {
  description?: string;
  amountCents?: number;
  dueDate?: string;
  clientId?: string;
}

export async function updateInvoiceById(
  db: Db,
  userId: string,
  id: string,
  data: UpdateInvoiceData,
): Promise<void> {
  if (Object.keys(data).length === 0) return;
  await db.client
    .update(invoices)
    .set(data)
    .where(and(eq(invoices.id, id), ownershipCondition(userId)));
}

export async function markInvoicePaid(
  db: Db,
  userId: string,
  id: string,
): Promise<void> {
  await db.client
    .update(invoices)
    .set({ paidAt: new Date(), status: 'paid' })
    .where(
      and(
        eq(invoices.id, id),
        ownershipCondition(userId),
        sql`${invoices.paidAt} is null`,
      ),
    );
}

export async function deleteInvoiceById(
  db: Db,
  userId: string,
  id: string,
): Promise<void> {
  await db.client
    .delete(invoices)
    .where(and(eq(invoices.id, id), ownershipCondition(userId)));
}

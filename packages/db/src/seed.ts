import type { InferInsertModel } from 'drizzle-orm';

import type { Db } from './db.js';
import {
  clients as clientsTable,
  invoices as invoicesTable,
  users as usersTable,
} from './schema.js';

type NewUser = InferInsertModel<typeof usersTable>;
type NewClient = InferInsertModel<typeof clientsTable>;
type NewInvoice = InferInsertModel<typeof invoicesTable>;

export const DISABLED_PASSWORD_HASH = '!disabled!demo-user-has-no-password';

export const demoUser: NewUser = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'Demo User',
  email: 'demo@pagmanager.dev',
  cpf: null,
  phone: null,
  passwordHash: DISABLED_PASSWORD_HASH,
};

export const seedClients: NewClient[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    userId: demoUser.id!,
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
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    userId: demoUser.id!,
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
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    userId: demoUser.id!,
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
  },
];

export const seedInvoices: NewInvoice[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    clientId: '00000000-0000-4000-8000-000000000101',
    description: 'Compra de 02 lotes de Red Bull',
    amountCents: 50000,
    dueDate: '2019-02-11',
    paidAt: null,
    status: 'pending',
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    clientId: '00000000-0000-4000-8000-000000000102',
    description: 'Serviços de limpeza',
    amountCents: 90000,
    dueDate: '2022-05-21',
    paidAt: null,
    status: 'pending',
  },
  {
    id: '00000000-0000-4000-8000-000000000203',
    clientId: '00000000-0000-4000-8000-000000000103',
    description: 'Construção de um castelo Lego',
    amountCents: 200000,
    dueDate: '2020-09-03',
    paidAt: null,
    status: 'paid',
  },
];

export async function seed(database: Db): Promise<void> {
  await database.client
    .insert(usersTable)
    .values(demoUser)
    .onConflictDoNothing();
  await database.client
    .insert(clientsTable)
    .values(seedClients)
    .onConflictDoNothing();
  await database.client
    .insert(invoicesTable)
    .values(seedInvoices)
    .onConflictDoNothing();
}

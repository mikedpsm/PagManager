import { OpenAPIHono } from '@hono/zod-openapi';
import {
  clientListQuerySchema,
  clientSchema,
  createClientInputSchema,
  normalizeCpf,
  updateClientInputSchema,
} from '@pagmanager/contracts';
import { AppError } from '../errors.js';
import {
  type ClientRow,
  deleteClientById,
  findClientByCpfOrEmail,
  findClientById,
  insertClient,
  listClients,
  updateClientById,
} from '../repositories/clients.js';
import type { AppDeps, AppEnv } from '../types.js';

function toResponse(row: ClientRow) {
  return clientSchema.parse({
    id: row.id,
    username: row.username,
    email: row.email,
    cpf: row.cpf,
    phone: row.phone,
    city: row.city ?? undefined,
    cep: row.cep ?? undefined,
    uf: row.uf ?? undefined,
    street: row.street ?? undefined,
    region: row.region ?? undefined,
    complement: row.complement ?? undefined,
    status: row.status,
  });
}

export function createClientsRoutes(deps: AppDeps) {
  const clients = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });

  clients.get('/', async (c) => {
    const user = c.get('user');
    const query = clientListQuerySchema.parse(c.req.query());
    const rows = await listClients(deps.db, user.id, query);
    return c.json(rows.map(toResponse), 200);
  });

  clients.get('/:id', async (c) => {
    const user = c.get('user');
    const row = await findClientById(deps.db, user.id, c.req.param('id'));
    if (!row) {
      throw AppError.notFound('Client not found');
    }
    return c.json(toResponse(row), 200);
  });

  clients.post('/', async (c) => {
    const user = c.get('user');
    const input = createClientInputSchema.parse(await c.req.json());
    const cpf = normalizeCpf(input.cpf);

    // Note: clients.cpf and clients.email are globally unique columns in the
    // schema (not scoped per user), so duplicate checks here are
    // intentionally global rather than scoped by userId - scoping them would
    // let a request pass this check only to fail with a raw 23505 unique
    // violation from Postgres, which is worse UX than a clean 409 up front.
    if (await findClientByCpfOrEmail(deps.db, { cpf, email: input.email })) {
      throw AppError.conflict(
        'A client with the same CPF or email already exists',
      );
    }

    const { id } = await insertClient(deps.db, {
      userId: user.id,
      username: input.username,
      email: input.email,
      cpf,
      phone: input.phone,
      city: input.city,
      cep: input.cep,
      uf: input.uf,
      street: input.street,
      region: input.region,
      complement: input.complement,
    });

    const row = await findClientById(deps.db, user.id, id);
    if (!row) {
      throw new Error('Failed to load newly created client');
    }
    return c.json(toResponse(row), 201);
  });

  clients.patch('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const existing = await findClientById(deps.db, user.id, id);
    if (!existing) {
      throw AppError.notFound('Client not found');
    }

    const input = updateClientInputSchema.parse(await c.req.json());
    const cpf = input.cpf !== undefined ? normalizeCpf(input.cpf) : undefined;

    if (cpf !== undefined || input.email !== undefined) {
      const duplicate = await findClientByCpfOrEmail(deps.db, {
        cpf,
        email: input.email,
        excludeId: id,
      });
      if (duplicate) {
        throw AppError.conflict(
          'A client with the same CPF or email already exists',
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (input.username !== undefined) updates.username = input.username;
    if (input.email !== undefined) updates.email = input.email;
    if (cpf !== undefined) updates.cpf = cpf;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.city !== undefined) updates.city = input.city;
    if (input.cep !== undefined) updates.cep = input.cep;
    if (input.uf !== undefined) updates.uf = input.uf;
    if (input.street !== undefined) updates.street = input.street;
    if (input.region !== undefined) updates.region = input.region;
    if (input.complement !== undefined) updates.complement = input.complement;

    await updateClientById(deps.db, user.id, id, updates);

    const updated = await findClientById(deps.db, user.id, id);
    if (!updated) {
      throw AppError.notFound('Client not found');
    }
    return c.json(toResponse(updated), 200);
  });

  clients.delete('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const existing = await findClientById(deps.db, user.id, id);
    if (!existing) {
      throw AppError.notFound('Client not found');
    }
    await deleteClientById(deps.db, user.id, id);
    return c.body(null, 204);
  });

  return clients;
}

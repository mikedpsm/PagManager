import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  clientListQuerySchema,
  clientSchema,
  createClientInputSchema,
  normalizeCpf,
  updateClientInputSchema,
} from '@pagmanager/contracts';
import { z } from 'zod';
import { authMiddleware } from '../auth/middleware.js';
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
import { validateRequest } from '../validation.js';
import {
  bearerAuthSecurity,
  conflictErrorResponse,
  internalErrorResponse,
  jsonResponse,
  notFoundErrorResponse,
  unauthorizedErrorResponse,
  validationErrorResponse,
} from './openapi.js';

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
  clients.use('*', authMiddleware(deps));

  const clientIdSchema = z.object({ id: z.uuid() });
  const createClientRequestSchema = createClientInputSchema.extend({
    phone: createClientInputSchema.shape.phone.describe(
      'Use 10 or 11 digits including the DDD, either as digits or formatted as "(DD) 1234-5678" or "(DD) 91234-5678". Formatting is normalized to digits before storage.',
    ),
    cep: createClientInputSchema.shape.cep.describe(
      'An optional Brazilian CEP. Accepts an empty string or 8 digits, optionally with a hyphen after the first 5 digits; formatting is normalized to digits before storage.',
    ),
  });
  const updateClientRequestSchema = updateClientInputSchema.extend({
    phone: updateClientInputSchema.shape.phone.describe(
      'When supplied, use 10 or 11 digits including the DDD, either as digits or formatted as "(DD) 1234-5678" or "(DD) 91234-5678". Formatting is normalized to digits before storage.',
    ),
    cep: updateClientInputSchema.shape.cep.describe(
      'When supplied, accepts an empty string or 8 digits, optionally with a hyphen after the first 5 digits; formatting is normalized to digits before storage.',
    ),
  });

  const listClientsOperation = createRoute({
    method: 'get',
    path: '/',
    operationId: 'listClients',
    tags: ['Clients'],
    summary: "List the authenticated user's clients",
    security: bearerAuthSecurity,
    request: { query: clientListQuerySchema },
    responses: {
      200: jsonResponse(z.array(clientSchema), 'The matching clients.'),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...internalErrorResponse,
    },
  });

  const getClientOperation = createRoute({
    method: 'get',
    path: '/{id}',
    operationId: 'getClient',
    tags: ['Clients'],
    summary: 'Get one client',
    security: bearerAuthSecurity,
    request: { params: clientIdSchema },
    responses: {
      200: jsonResponse(clientSchema, 'The requested client.'),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...notFoundErrorResponse,
      ...internalErrorResponse,
    },
  });

  const createClientOperation = createRoute({
    method: 'post',
    path: '/',
    operationId: 'createClient',
    tags: ['Clients'],
    summary: 'Create a client',
    security: bearerAuthSecurity,
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: createClientRequestSchema },
        },
      },
    },
    responses: {
      201: jsonResponse(clientSchema, 'The created client.'),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...conflictErrorResponse,
      ...internalErrorResponse,
    },
  });

  const updateClientOperation = createRoute({
    method: 'patch',
    path: '/{id}',
    operationId: 'updateClient',
    tags: ['Clients'],
    summary: 'Update the supplied client fields',
    security: bearerAuthSecurity,
    request: {
      params: clientIdSchema,
      body: {
        description:
          'Optional. Omit the body or send an empty object for a no-op; if Content-Type is application/json, the body must be valid JSON.',
        content: {
          'application/json': { schema: updateClientRequestSchema },
        },
      },
    },
    responses: {
      200: jsonResponse(clientSchema, 'The updated client.'),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...notFoundErrorResponse,
      ...conflictErrorResponse,
      ...internalErrorResponse,
    },
  });

  const deleteClientOperation = createRoute({
    method: 'delete',
    path: '/{id}',
    operationId: 'deleteClient',
    tags: ['Clients'],
    summary: 'Delete a client',
    security: bearerAuthSecurity,
    request: { params: clientIdSchema },
    responses: {
      204: { description: 'The client was deleted.' },
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...notFoundErrorResponse,
      ...internalErrorResponse,
    },
  });

  clients.openAPIRegistry.registerPath(listClientsOperation);
  clients.openAPIRegistry.registerPath(getClientOperation);
  clients.openAPIRegistry.registerPath(createClientOperation);
  clients.openAPIRegistry.registerPath(updateClientOperation);
  clients.openAPIRegistry.registerPath(deleteClientOperation);

  const routes = clients
    .get(
      listClientsOperation.getRoutingPath(),
      validateRequest('query', clientListQuerySchema),
      async (c) => {
        const user = c.get('user');
        const query = c.req.valid('query');
        const rows = await listClients(deps.db, user.id, query);
        return c.json(rows.map(toResponse), 200);
      },
    )

    .get(
      getClientOperation.getRoutingPath(),
      validateRequest('param', clientIdSchema),
      async (c) => {
        const user = c.get('user');
        const { id } = c.req.valid('param');
        const row = await findClientById(deps.db, user.id, id);
        if (!row) {
          throw AppError.notFound('Client not found');
        }
        return c.json(toResponse(row), 200);
      },
    )

    .post(
      createClientOperation.getRoutingPath(),
      validateRequest('json', createClientInputSchema),
      async (c) => {
        const user = c.get('user');
        const input = c.req.valid('json');
        const cpf = normalizeCpf(input.cpf);

        // Note: clients.cpf and clients.email are globally unique columns in the
        // schema (not scoped per user), so duplicate checks here are
        // intentionally global rather than scoped by userId - scoping them would
        // let a request pass this check only to fail with a raw 23505 unique
        // violation from Postgres, which is worse UX than a clean 409 up front.
        if (
          await findClientByCpfOrEmail(deps.db, { cpf, email: input.email })
        ) {
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
      },
    )

    .patch(
      updateClientOperation.getRoutingPath(),
      validateRequest('param', clientIdSchema),
      validateRequest('json', updateClientInputSchema),
      async (c) => {
        const user = c.get('user');
        const { id } = c.req.valid('param');
        const existing = await findClientById(deps.db, user.id, id);
        if (!existing) {
          throw AppError.notFound('Client not found');
        }

        const input = c.req.valid('json');
        const cpf =
          input.cpf !== undefined ? normalizeCpf(input.cpf) : undefined;

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
        if (input.complement !== undefined)
          updates.complement = input.complement;

        await updateClientById(deps.db, user.id, id, updates);

        const updated = await findClientById(deps.db, user.id, id);
        if (!updated) {
          throw AppError.notFound('Client not found');
        }
        return c.json(toResponse(updated), 200);
      },
    )

    .delete(
      deleteClientOperation.getRoutingPath(),
      validateRequest('param', clientIdSchema),
      async (c) => {
        const user = c.get('user');
        const { id } = c.req.valid('param');
        const existing = await findClientById(deps.db, user.id, id);
        if (!existing) {
          throw AppError.notFound('Client not found');
        }
        await deleteClientById(deps.db, user.id, id);
        return c.body(null, 204);
      },
    );

  return routes;
}

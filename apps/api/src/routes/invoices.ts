import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  createInvoiceInputSchema,
  invoiceListQuerySchema,
  invoiceSchema,
  updateInvoiceInputSchema,
} from '@pagmanager/contracts';
import { z } from 'zod';
import { authMiddleware } from '../auth/middleware.js';
import { AppError } from '../errors.js';
import {
  clientBelongsToUser,
  deleteInvoiceById,
  findInvoiceById,
  type InvoiceRow,
  insertInvoice,
  listInvoices,
  markInvoicePaid,
  updateInvoiceById,
} from '../repositories/invoices.js';
import type { AppDeps, AppEnv } from '../types.js';
import { validateRequest } from '../validation.js';
import {
  bearerAuthSecurity,
  internalErrorResponse,
  jsonResponse,
  notFoundErrorResponse,
  unauthorizedErrorResponse,
  validationErrorResponse,
} from './openapi.js';

function toResponse(row: InvoiceRow) {
  return invoiceSchema.parse({
    id: row.id,
    clientId: row.clientId,
    description: row.description,
    amountCents: row.amountCents,
    dueDate: row.dueDate,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    status: row.status,
  });
}

export function createInvoicesRoutes(deps: AppDeps) {
  const invoices = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });
  invoices.use('*', authMiddleware(deps));

  const invoiceIdSchema = z.object({ id: z.uuid() });

  const listInvoicesOperation = createRoute({
    method: 'get',
    path: '/',
    operationId: 'listInvoices',
    tags: ['Invoices'],
    summary: "List the authenticated user's invoices",
    security: bearerAuthSecurity,
    request: { query: invoiceListQuerySchema },
    responses: {
      200: jsonResponse(z.array(invoiceSchema), 'The matching invoices.'),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...internalErrorResponse,
    },
  });

  const getInvoiceOperation = createRoute({
    method: 'get',
    path: '/{id}',
    operationId: 'getInvoice',
    tags: ['Invoices'],
    summary: 'Get one invoice',
    security: bearerAuthSecurity,
    request: { params: invoiceIdSchema },
    responses: {
      200: jsonResponse(invoiceSchema, 'The requested invoice.'),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...notFoundErrorResponse,
      ...internalErrorResponse,
    },
  });

  const createInvoiceOperation = createRoute({
    method: 'post',
    path: '/',
    operationId: 'createInvoice',
    tags: ['Invoices'],
    summary: "Create an invoice for one of the user's clients",
    security: bearerAuthSecurity,
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: createInvoiceInputSchema },
        },
      },
    },
    responses: {
      201: jsonResponse(invoiceSchema, 'The created invoice.'),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...notFoundErrorResponse,
      ...internalErrorResponse,
    },
  });

  const updateInvoiceOperation = createRoute({
    method: 'patch',
    path: '/{id}',
    operationId: 'updateInvoice',
    tags: ['Invoices'],
    summary: 'Update the supplied invoice fields',
    security: bearerAuthSecurity,
    request: {
      params: invoiceIdSchema,
      body: {
        description:
          'Optional. Omit the body or send an empty object for a no-op; if Content-Type is application/json, the body must be valid JSON.',
        content: {
          'application/json': { schema: updateInvoiceInputSchema },
        },
      },
    },
    responses: {
      200: jsonResponse(invoiceSchema, 'The updated invoice.'),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...notFoundErrorResponse,
      ...internalErrorResponse,
    },
  });

  const payInvoiceOperation = createRoute({
    method: 'post',
    path: '/{id}/pay',
    operationId: 'payInvoice',
    tags: ['Invoices'],
    summary: 'Mark an invoice paid',
    description:
      'Paying an invoice that is already paid returns the current invoice unchanged.',
    security: bearerAuthSecurity,
    request: { params: invoiceIdSchema },
    responses: {
      200: jsonResponse(
        invoiceSchema,
        'The paid invoice, including idempotent repeat requests.',
      ),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...notFoundErrorResponse,
      ...internalErrorResponse,
    },
  });

  const deleteInvoiceOperation = createRoute({
    method: 'delete',
    path: '/{id}',
    operationId: 'deleteInvoice',
    tags: ['Invoices'],
    summary: 'Delete an invoice',
    security: bearerAuthSecurity,
    request: { params: invoiceIdSchema },
    responses: {
      204: { description: 'The invoice was deleted.' },
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...notFoundErrorResponse,
      ...internalErrorResponse,
    },
  });

  invoices.openAPIRegistry.registerPath(listInvoicesOperation);
  invoices.openAPIRegistry.registerPath(getInvoiceOperation);
  invoices.openAPIRegistry.registerPath(createInvoiceOperation);
  invoices.openAPIRegistry.registerPath(updateInvoiceOperation);
  invoices.openAPIRegistry.registerPath(payInvoiceOperation);
  invoices.openAPIRegistry.registerPath(deleteInvoiceOperation);

  const routes = invoices
    .get(
      listInvoicesOperation.getRoutingPath(),
      validateRequest('query', invoiceListQuerySchema),
      async (c) => {
        const user = c.get('user');
        const query = c.req.valid('query');
        const rows = await listInvoices(deps.db, user.id, query);
        return c.json(rows.map(toResponse), 200);
      },
    )

    .get(
      getInvoiceOperation.getRoutingPath(),
      validateRequest('param', invoiceIdSchema),
      async (c) => {
        const user = c.get('user');
        const { id } = c.req.valid('param');
        const row = await findInvoiceById(deps.db, user.id, id);
        if (!row) {
          throw AppError.notFound('Invoice not found');
        }
        return c.json(toResponse(row), 200);
      },
    )

    .post(
      createInvoiceOperation.getRoutingPath(),
      validateRequest('json', createInvoiceInputSchema),
      async (c) => {
        const user = c.get('user');
        const input = c.req.valid('json');

        if (!(await clientBelongsToUser(deps.db, user.id, input.clientId))) {
          throw AppError.notFound('Client not found');
        }

        const { id } = await insertInvoice(deps.db, {
          clientId: input.clientId,
          description: input.description,
          amountCents: input.amountCents,
          dueDate: input.dueDate,
        });

        const row = await findInvoiceById(deps.db, user.id, id);
        if (!row) {
          throw new Error('Failed to load newly created invoice');
        }
        return c.json(toResponse(row), 201);
      },
    )

    .patch(
      updateInvoiceOperation.getRoutingPath(),
      validateRequest('param', invoiceIdSchema),
      validateRequest('json', updateInvoiceInputSchema),
      async (c) => {
        const user = c.get('user');
        const { id } = c.req.valid('param');
        const existing = await findInvoiceById(deps.db, user.id, id);
        if (!existing) {
          throw AppError.notFound('Invoice not found');
        }

        const input = c.req.valid('json');

        if (
          input.clientId !== undefined &&
          !(await clientBelongsToUser(deps.db, user.id, input.clientId))
        ) {
          throw AppError.notFound('Client not found');
        }

        // Critical regression fix: build `.set()` only from keys explicitly
        // present in the validated input. The legacy `editInvoice` always
        // overwrote `duedate` with `new Date()` even when the request omitted
        // it entirely, silently corrupting due dates on unrelated edits.
        const updates: Record<string, unknown> = {};
        if (input.description !== undefined)
          updates.description = input.description;
        if (input.amountCents !== undefined)
          updates.amountCents = input.amountCents;
        if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
        if (input.clientId !== undefined) updates.clientId = input.clientId;

        await updateInvoiceById(deps.db, user.id, id, updates);

        const updated = await findInvoiceById(deps.db, user.id, id);
        if (!updated) {
          throw AppError.notFound('Invoice not found');
        }
        return c.json(toResponse(updated), 200);
      },
    )

    .post(
      payInvoiceOperation.getRoutingPath(),
      validateRequest('param', invoiceIdSchema),
      async (c) => {
        const user = c.get('user');
        const { id } = c.req.valid('param');
        const existing = await findInvoiceById(deps.db, user.id, id);
        if (!existing) {
          throw AppError.notFound('Invoice not found');
        }

        // Idempotent: paying an already-paid invoice is a no-op success rather
        // than an error, and does not bump its paid_at timestamp.
        if (!existing.paidAt) {
          await markInvoicePaid(deps.db, user.id, id);
        }

        const updated = await findInvoiceById(deps.db, user.id, id);
        if (!updated) {
          throw AppError.notFound('Invoice not found');
        }
        return c.json(toResponse(updated), 200);
      },
    )

    .delete(
      deleteInvoiceOperation.getRoutingPath(),
      validateRequest('param', invoiceIdSchema),
      async (c) => {
        const user = c.get('user');
        const { id } = c.req.valid('param');
        const existing = await findInvoiceById(deps.db, user.id, id);
        if (!existing) {
          throw AppError.notFound('Invoice not found');
        }
        await deleteInvoiceById(deps.db, user.id, id);
        return c.body(null, 204);
      },
    );

  return routes;
}

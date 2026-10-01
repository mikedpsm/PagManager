import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  normalizeCpf,
  updateMeInputSchema,
  userSchema,
} from '@pagmanager/contracts';
import { users } from '@pagmanager/db';
import { and, eq, ne, or, type SQL } from 'drizzle-orm';
import { authMiddleware } from '../auth/middleware.js';
import { client } from '../db-client.js';
import { AppError } from '../errors.js';
import { hashPassword } from '../security/password.js';
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

export function createMeRoutes(deps: AppDeps) {
  const me = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });
  me.use('*', authMiddleware(deps));

  const getMeOperation = createRoute({
    method: 'get',
    path: '/',
    operationId: 'getMe',
    tags: ['Me'],
    summary: 'Get the authenticated user profile',
    security: bearerAuthSecurity,
    responses: {
      200: jsonResponse(userSchema, 'The current user profile.'),
      ...unauthorizedErrorResponse,
      ...internalErrorResponse,
    },
  });

  const updateMeOperation = createRoute({
    method: 'patch',
    path: '/',
    operationId: 'updateMe',
    tags: ['Me'],
    summary: 'Update supplied profile fields',
    description:
      'All fields are optional. The body may be omitted; omission or an empty object leaves the profile unchanged. When Content-Type is application/json, provide valid JSON. When supplied, phone accepts 10 or 11 digits including the DDD, either as digits or in the conventional parenthesized format; formatting is normalized before storage.',
    security: bearerAuthSecurity,
    request: {
      body: {
        description:
          'Optional. Omit the body or send an empty object for a no-op; if Content-Type is application/json, the body must be valid JSON.',
        content: {
          'application/json': { schema: updateMeInputSchema },
        },
      },
    },
    responses: {
      200: jsonResponse(userSchema, 'The updated user profile.'),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...notFoundErrorResponse,
      ...conflictErrorResponse,
      ...internalErrorResponse,
    },
  });

  me.openAPIRegistry.registerPath(getMeOperation);
  me.openAPIRegistry.registerPath(updateMeOperation);

  const routes = me
    .get(getMeOperation.getRoutingPath(), (c) => {
      const user = c.get('user');
      return c.json(
        userSchema.parse({
          id: user.id,
          username: user.username,
          email: user.email,
          cpf: user.cpf ?? undefined,
          phone: user.phone ?? undefined,
        }),
        200,
      );
    })

    .patch(
      updateMeOperation.getRoutingPath(),
      validateRequest('json', updateMeInputSchema),
      async (c) => {
        const currentUser = c.get('user');
        const input = c.req.valid('json');

        const normalizedCpf =
          input.cpf !== undefined ? normalizeCpf(input.cpf) : undefined;

        const matchConditions: SQL[] = [];
        if (input.email !== undefined)
          matchConditions.push(eq(users.email, input.email));
        if (normalizedCpf !== undefined)
          matchConditions.push(eq(users.cpf, normalizedCpf));

        if (matchConditions.length > 0) {
          const duplicateCondition = or(...matchConditions);
          const rows = await deps.db.client
            .select({ id: users.id })
            .from(users)
            .where(and(duplicateCondition, ne(users.id, currentUser.id)))
            .limit(1);
          if (rows.length > 0) {
            throw AppError.conflict('Email or CPF already in use');
          }
        }

        const updates: Record<string, unknown> = {};
        if (input.username !== undefined) updates.username = input.username;
        if (input.email !== undefined) updates.email = input.email;
        if (normalizedCpf !== undefined) updates.cpf = normalizedCpf;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.passwd !== undefined) {
          updates.passwordHash = await hashPassword(input.passwd);
        }

        if (Object.keys(updates).length === 0) {
          return c.json(
            userSchema.parse({
              id: currentUser.id,
              username: currentUser.username,
              email: currentUser.email,
              cpf: currentUser.cpf ?? undefined,
              phone: currentUser.phone ?? undefined,
            }),
            200,
          );
        }

        const [updated] = await client(deps.db)
          .update(users)
          .set(updates)
          .where(eq(users.id, currentUser.id))
          .returning({
            id: users.id,
            username: users.username,
            email: users.email,
            cpf: users.cpf,
            phone: users.phone,
          });

        if (!updated) {
          throw AppError.notFound('User not found');
        }

        return c.json(
          userSchema.parse({
            id: updated.id,
            username: updated.username,
            email: updated.email,
            cpf: updated.cpf ?? undefined,
            phone: updated.phone ?? undefined,
          }),
          200,
        );
      },
    );

  return routes;
}

import { getConnInfo } from '@hono/node-server/conninfo';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  authResponseSchema,
  checkEmailInputSchema,
  checkEmailResponseSchema,
  errorResponseSchema,
  loginInputSchema,
  registerInputSchema,
} from '@pagmanager/contracts';
import { users } from '@pagmanager/db';
import { eq } from 'drizzle-orm';
import type { Context, MiddlewareHandler } from 'hono';
import { signAuthToken } from '../auth/jwt.js';
import { client } from '../db-client.js';
import { AppError } from '../errors.js';
import { IpRateLimiter } from '../security/ip-rate-limiter.js';
import { hashPassword, verifyPassword } from '../security/password.js';
import type { AppDeps, AppEnv } from '../types.js';
import { validateRequest } from '../validation.js';
import {
  conflictErrorResponse,
  internalErrorResponse,
  jsonResponse,
  unauthorizedErrorResponse,
  validationErrorResponse,
} from './openapi.js';

const RATE_LIMIT_ERROR = {
  code: 'RATE_LIMITED',
  message: 'Too many requests. Please try again later.',
} as const;

const rateLimitErrorResponse = {
  429: jsonResponse(errorResponseSchema, 'Too many requests.'),
};

function remoteIpAddress(c: Context<AppEnv>): string {
  try {
    // Use the socket address exposed by @hono/node-server. Forwarded headers
    // are client-controlled unless a trusted proxy explicitly normalizes them.
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    // Hono's in-memory Request adapter (used by route tests) has no socket.
    return 'unknown';
  }
}

function rateLimitMiddleware(
  limiter: IpRateLimiter,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const decision = limiter.consume(remoteIpAddress(c));
    if (!decision.allowed) {
      return c.json(RATE_LIMIT_ERROR, 429, {
        'Retry-After': String(decision.retryAfterSeconds),
      });
    }
    await next();
  };
}

async function emailExists(deps: AppDeps, email: string): Promise<boolean> {
  const rows = await deps.db.client
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows.length > 0;
}

export function createAuthRoutes(deps: AppDeps) {
  // Limits are per connection IP and isolated by endpoint and app instance.
  // The Node adapter supplies the remote socket IP; untrusted forwarded
  // headers are intentionally ignored.
  const registerRateLimit = new IpRateLimiter(5, 60 * 60 * 1000);
  const loginRateLimit = new IpRateLimiter(10, 15 * 60 * 1000);
  const checkEmailRateLimit = new IpRateLimiter(20, 15 * 60 * 1000);

  const auth = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });

  const registerOperation = createRoute({
    method: 'post',
    path: '/register',
    operationId: 'registerAuth',
    tags: ['Auth'],
    summary: 'Register a user',
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: registerInputSchema },
        },
      },
    },
    responses: {
      201: jsonResponse(
        authResponseSchema,
        'The user and access token were created.',
      ),
      ...validationErrorResponse,
      ...conflictErrorResponse,
      ...rateLimitErrorResponse,
      ...internalErrorResponse,
    },
  });

  const loginOperation = createRoute({
    method: 'post',
    path: '/login',
    operationId: 'loginAuth',
    tags: ['Auth'],
    summary: 'Log in with email and password',
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: loginInputSchema },
        },
      },
    },
    responses: {
      200: jsonResponse(
        authResponseSchema,
        'An access token and user profile.',
      ),
      ...validationErrorResponse,
      ...unauthorizedErrorResponse,
      ...rateLimitErrorResponse,
      ...internalErrorResponse,
    },
  });

  const checkEmailOperation = createRoute({
    method: 'post',
    path: '/check-email',
    operationId: 'checkAuthEmail',
    tags: ['Auth'],
    summary: 'Check whether an email can be registered',
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: checkEmailInputSchema },
        },
      },
    },
    responses: {
      200: jsonResponse(checkEmailResponseSchema, 'Email availability.'),
      ...validationErrorResponse,
      ...rateLimitErrorResponse,
      ...internalErrorResponse,
    },
  });

  auth.openAPIRegistry.registerPath(registerOperation);
  auth.openAPIRegistry.registerPath(loginOperation);
  auth.openAPIRegistry.registerPath(checkEmailOperation);

  const routes = auth
    .post(
      registerOperation.getRoutingPath(),
      rateLimitMiddleware(registerRateLimit),
      validateRequest('json', registerInputSchema),
      async (c) => {
        const input = c.req.valid('json');

        // Real duplicate check: select + length check (the legacy implementation
        // checked `.rowCount` on a plain array, which is always `undefined` and
        // therefore never truthy - duplicates silently slipped through).
        if (await emailExists(deps, input.email)) {
          throw AppError.conflict('Email already in use');
        }

        const passwordHash = await hashPassword(input.passwd);

        const [inserted] = await client(deps.db)
          .insert(users)
          .values({
            username: input.username,
            email: input.email,
            passwordHash,
          })
          .returning({
            id: users.id,
            username: users.username,
            email: users.email,
            cpf: users.cpf,
            phone: users.phone,
          });

        if (!inserted) {
          throw new Error('Failed to insert user');
        }

        const token = await signAuthToken(inserted.id, deps.env.jwtSecret);

        const body = authResponseSchema.parse({
          token,
          user: {
            id: inserted.id,
            username: inserted.username,
            email: inserted.email,
            cpf: inserted.cpf ?? undefined,
            phone: inserted.phone ?? undefined,
          },
        });

        return c.json(body, 201);
      },
    )

    .post(
      loginOperation.getRoutingPath(),
      rateLimitMiddleware(loginRateLimit),
      validateRequest('json', loginInputSchema),
      async (c) => {
        const input = c.req.valid('json');

        const rows = await deps.db.client
          .select({
            id: users.id,
            username: users.username,
            email: users.email,
            cpf: users.cpf,
            phone: users.phone,
            passwordHash: users.passwordHash,
          })
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        const found = rows[0];

        // Never reveal whether the email or the password was the problem - a
        // single generic error avoids leaking which accounts exist.
        if (!found) {
          throw AppError.unauthorized('Invalid email or password');
        }

        const passwordValid = await verifyPassword(
          input.passwd,
          found.passwordHash,
        );
        if (!passwordValid) {
          throw AppError.unauthorized('Invalid email or password');
        }

        const token = await signAuthToken(found.id, deps.env.jwtSecret);

        const body = authResponseSchema.parse({
          token,
          user: {
            id: found.id,
            username: found.username,
            email: found.email,
            cpf: found.cpf ?? undefined,
            phone: found.phone ?? undefined,
          },
        });

        return c.json(body, 200);
      },
    )

    .post(
      checkEmailOperation.getRoutingPath(),
      rateLimitMiddleware(checkEmailRateLimit),
      validateRequest('json', checkEmailInputSchema),
      async (c) => {
        const input = c.req.valid('json');
        const exists = await emailExists(deps, input.email);
        return c.json(
          checkEmailResponseSchema.parse({ available: !exists }),
          200,
        );
      },
    );

  return routes;
}

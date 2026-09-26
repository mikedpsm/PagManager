import {
  authResponseSchema,
  checkEmailInputSchema,
  checkEmailResponseSchema,
  loginInputSchema,
  registerInputSchema,
} from '@pagmanager/contracts';
import { users } from '@pagmanager/db';
import { eq } from 'drizzle-orm';
import { OpenAPIHono } from '@hono/zod-openapi';

import { signAuthToken } from '../auth/jwt.js';
import { client } from '../db-client.js';
import { hashPassword, verifyPassword } from '../security/password.js';
import { AppError } from '../errors.js';
import type { AppDeps, AppEnv } from '../types.js';

async function emailExists(deps: AppDeps, email: string): Promise<boolean> {
  const rows = await deps.db.client
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows.length > 0;
}

export function createAuthRoutes(deps: AppDeps) {
  const auth = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });

  auth.post('/register', async (c) => {
    const input = registerInputSchema.parse(await c.req.json());

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
  });

  auth.post('/login', async (c) => {
    const input = loginInputSchema.parse(await c.req.json());

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
  });

  auth.post('/check-email', async (c) => {
    const input = checkEmailInputSchema.parse(await c.req.json());
    const exists = await emailExists(deps, input.email);
    return c.json(
      checkEmailResponseSchema.parse({ available: !exists }),
      200,
    );
  });

  return auth;
}

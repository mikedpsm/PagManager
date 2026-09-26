import { users } from '@pagmanager/db';
import { eq } from 'drizzle-orm';
import type { MiddlewareHandler } from 'hono';
import { AppError } from '../errors.js';
import type { AppDeps, AppEnv } from '../types.js';
import { verifyAuthToken } from './jwt.js';

const BEARER_PREFIX = 'Bearer ';

export function authMiddleware(deps: AppDeps): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const header = c.req.header('Authorization');

    if (!header?.startsWith(BEARER_PREFIX)) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    if (!token) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }

    let payload: Awaited<ReturnType<typeof verifyAuthToken>>;
    try {
      payload = await verifyAuthToken(token, deps.env.jwtSecret);
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }

    const rows = await deps.db.client
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        cpf: users.cpf,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    const user = rows[0];
    if (!user) {
      throw AppError.unauthorized('User no longer exists');
    }

    c.set('user', user);
    await next();
  };
}

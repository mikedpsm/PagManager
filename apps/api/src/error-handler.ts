import type { Context, Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import { AppError } from './errors.js';
import { MAX_REQUEST_BODY_DISPLAY } from './request-limits.js';
import { logSafeError } from './safe-logger.js';

interface PgErrorLike {
  code?: string;
  constraint_name?: string;
  detail?: string;
}

function isPgUniqueViolation(err: unknown): err is PgErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as PgErrorLike).code === '23505'
  );
}

function errorResponse(
  c: Context,
  status: 400 | 401 | 403 | 404 | 409 | 413 | 500,
  code: string,
  message: string,
  details?: unknown,
) {
  return c.json(
    {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    status,
  );
}

export function registerErrorHandler(
  // biome-ignore lint/suspicious/noExplicitAny: Hono's app generics vary by caller.
  app: Hono<any>,
  nodeEnv: 'development' | 'test' | 'production' = 'development',
): void {
  app.onError((err, c) => {
    if (err instanceof z.ZodError) {
      return errorResponse(
        c,
        400,
        'VALIDATION_ERROR',
        'Invalid request',
        z.treeifyError(err),
      );
    }

    if (err instanceof HTTPException && err.status === 400) {
      return errorResponse(c, 400, 'VALIDATION_ERROR', 'Invalid request');
    }

    if (err instanceof HTTPException && err.status === 413) {
      return errorResponse(
        c,
        413,
        'PAYLOAD_TOO_LARGE',
        `Request body must not exceed ${MAX_REQUEST_BODY_DISPLAY}`,
      );
    }

    if (err instanceof SyntaxError) {
      // Malformed JSON bodies throw a plain SyntaxError from `c.req.json()`
      // (JSON.parse) - this must be a clean 400, never bubble up as a 500.
      return errorResponse(c, 400, 'VALIDATION_ERROR', 'Invalid JSON body');
    }

    if (err instanceof AppError) {
      return errorResponse(
        c,
        err.status as 400 | 401 | 403 | 404 | 409 | 500,
        err.code,
        err.message,
        err.details,
      );
    }

    if (isPgUniqueViolation(err)) {
      return errorResponse(
        c,
        409,
        'CONFLICT',
        'A record with the same unique value already exists',
      );
    }

    logSafeError('request_error', err, nodeEnv);
    return errorResponse(
      c,
      500,
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
    );
  });
}

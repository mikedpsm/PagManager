import { errorResponseSchema } from '@pagmanager/contracts';
import type { ZodType } from 'zod';

export function jsonResponse<Schema extends ZodType>(
  schema: Schema,
  description: string,
) {
  return {
    description,
    content: {
      'application/json': { schema },
    },
  };
}

export const validationErrorResponse = {
  400: jsonResponse(errorResponseSchema, 'Invalid request.'),
};

export const unauthorizedErrorResponse = {
  401: jsonResponse(errorResponseSchema, 'Authentication is required.'),
};

export const notFoundErrorResponse = {
  404: jsonResponse(
    errorResponseSchema,
    'The requested resource was not found.',
  ),
};

export const conflictErrorResponse = {
  409: jsonResponse(
    errorResponseSchema,
    'The request conflicts with an existing resource.',
  ),
};

export const internalErrorResponse = {
  500: jsonResponse(errorResponseSchema, 'The request could not be completed.'),
};

export const bearerAuthSecurity = [{ BearerAuth: [] }];

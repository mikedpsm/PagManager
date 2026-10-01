import { z } from 'zod';

/** Empty CEP remains valid because the client address is optional. */
export const cepSchema = z
  .string()
  .refine((value) => value === '' || /^\d{5}-?\d{3}$/.test(value), {
    error: 'Informe um CEP com 8 dígitos.',
  })
  .transform((value) => value.replace(/\D/g, ''));

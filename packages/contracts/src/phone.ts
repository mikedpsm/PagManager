import { z } from 'zod';

/** Brazilian national number, with optional conventional display punctuation. */
export const phoneSchema = z
  .string()
  .refine((value) => /^(?:\d{10,11}|\(\d{2}\) \d{4,5}-\d{4})$/.test(value), {
    error: 'Informe um telefone com DDD e 10 ou 11 dígitos.',
  })
  .transform((value) => value.replace(/\D/g, ''));

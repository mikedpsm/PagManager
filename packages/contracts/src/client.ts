import { z } from 'zod';

import { cpfSchema } from './cpf.js';

export const clientStatusSchema = z.enum(['overdue', 'ok']);

export type ClientStatus = z.infer<typeof clientStatusSchema>;

export const clientSchema = z.object({
  id: z.uuid(),
  username: z.string().min(1),
  email: z.email(),
  cpf: cpfSchema,
  phone: z.string().min(1),
  city: z.string().optional(),
  cep: z.string().optional(),
  uf: z.string().max(2).optional(),
  street: z.string().optional(),
  region: z.string().optional(),
  complement: z.string().optional(),
  status: clientStatusSchema,
});

export type Client = z.infer<typeof clientSchema>;

export const createClientInputSchema = clientSchema.omit({
  id: true,
  status: true,
});

export type CreateClientInput = z.infer<typeof createClientInputSchema>;

export const updateClientInputSchema = createClientInputSchema.partial();

export type UpdateClientInput = z.infer<typeof updateClientInputSchema>;

export const clientListQuerySchema = z.object({
  search: z.string().optional(),
  status: clientStatusSchema.optional(),
  sort: z.enum(['username', '-username']).optional(),
});

export type ClientListQuery = z.infer<typeof clientListQuerySchema>;

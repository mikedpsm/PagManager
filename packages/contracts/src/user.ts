import { z } from 'zod';

import { cpfSchema } from './cpf.js';

export const userSchema = z.object({
  id: z.uuid(),
  username: z.string().min(1),
  email: z.email(),
  cpf: cpfSchema.optional(),
  phone: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

export const updateMeInputSchema = z
  .object({
    username: z.string().min(1).optional(),
    email: z.email().optional(),
    passwd: z.string().min(8).optional(),
    confirmPasswd: z.string().optional(),
    cpf: cpfSchema.optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.passwd === undefined || data.passwd === data.confirmPasswd, {
    message: 'As senhas não coincidem',
    path: ['confirmPasswd'],
  });

export type UpdateMeInput = z.infer<typeof updateMeInputSchema>;

import { z } from 'zod';
import { cpfSchema } from './cpf.js';
import { MAX_USERNAME_LENGTH } from './field-limits.js';
import { phoneSchema } from './phone.js';

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
    username: z.string().min(1).max(MAX_USERNAME_LENGTH).optional(),
    email: z.email().optional(),
    passwd: z.string().min(8).optional(),
    confirmPasswd: z.string().optional(),
    currentPasswd: z.string().min(1).optional(),
    cpf: cpfSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .refine(
    (data) => data.passwd === undefined || data.passwd === data.confirmPasswd,
    {
      message: 'As senhas não coincidem',
      path: ['confirmPasswd'],
    },
  )
  .refine(
    (data) =>
      (data.passwd === undefined) === (data.currentPasswd === undefined),
    {
      message: 'Informe a senha atual para trocar a senha.',
      path: ['currentPasswd'],
    },
  );

export type UpdateMeInput = z.infer<typeof updateMeInputSchema>;

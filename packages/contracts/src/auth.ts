import { z } from 'zod';

import { userSchema } from './user.js';

export const registerStep1Schema = z.object({
  username: z.string().min(1),
  email: z.email(),
});

export type RegisterStep1 = z.infer<typeof registerStep1Schema>;

export const registerStep2Schema = z
  .object({
    passwd: z.string().min(8),
    confirmPasswd: z.string().min(1),
  })
  .refine((data) => data.passwd === data.confirmPasswd, {
    message: 'As senhas não coincidem',
    path: ['confirmPasswd'],
  });

export type RegisterStep2 = z.infer<typeof registerStep2Schema>;

export const registerInputSchema = registerStep1Schema.extend({
  passwd: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.email(),
  passwd: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const authResponseSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const checkEmailInputSchema = z.object({
  email: z.email(),
});

export type CheckEmailInput = z.infer<typeof checkEmailInputSchema>;

export const checkEmailResponseSchema = z.object({
  available: z.boolean(),
});

export type CheckEmailResponse = z.infer<typeof checkEmailResponseSchema>;

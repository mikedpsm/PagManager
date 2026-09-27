import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { RegisterPage } from '@/features/auth/register-page';

export const Route = createFileRoute('/register')({
  validateSearch: z.object({
    step: z.coerce.number().int().min(1).max(3).catch(1),
  }),
  component: RegisterPage,
});

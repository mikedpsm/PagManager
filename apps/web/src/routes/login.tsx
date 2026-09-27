import { createFileRoute, redirect } from '@tanstack/react-router';

import { LoginPage } from '@/features/auth/login-page';
import { getStoredUser } from '@/lib/auth-storage';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (getStoredUser()) throw redirect({ to: '/home' });
  },
  component: LoginPage,
});

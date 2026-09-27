import { createFileRoute, redirect } from '@tanstack/react-router';

import { AppLayout } from '@/features/app/app-layout';
import { getStoredUser } from '@/lib/auth-storage';

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ location }) => {
    const user = getStoredUser();
    if (!user)
      throw redirect({ to: '/login', search: { redirect: location.href } });
    return { user };
  },
  component: AppLayout,
});

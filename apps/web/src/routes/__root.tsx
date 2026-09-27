import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/features/auth/auth-provider';

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <Outlet />
      <Toaster closeButton position="top-right" richColors />
    </AuthProvider>
  ),
});

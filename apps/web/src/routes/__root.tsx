import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/features/auth/auth-provider';
import { useTheme } from '@/features/theme/theme-selector';

function ThemeToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster theme={resolved} closeButton position="top-right" richColors />
  );
}

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <Outlet />
      <ThemeToaster />
    </AuthProvider>
  ),
});

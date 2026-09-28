import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';

import { ClientsPage } from '@/features/clients/clients-page';

export const Route = createFileRoute('/_app/clients')({
  component: ClientsRoute,
});

function ClientsRoute() {
  const { pathname } = useLocation();
  return pathname === '/clients' ? <ClientsPage /> : <Outlet />;
}

import { createFileRoute } from '@tanstack/react-router';

import { ClientDetailPage } from '@/features/clients/client-detail-page';

export const Route = createFileRoute('/_app/clients/$clientId')({
  component: ClientDetailPage,
});

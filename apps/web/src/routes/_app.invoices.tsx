import { createFileRoute } from '@tanstack/react-router';

import { InvoicesPage } from '@/features/invoices/invoices-page';

export const Route = createFileRoute('/_app/invoices')({
  component: InvoicesPage,
});

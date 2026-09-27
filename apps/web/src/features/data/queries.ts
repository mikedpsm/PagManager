import type { ClientListQuery, InvoiceListQuery } from '@pagmanager/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  clients: ['clients'] as const,
  client: (id: string) => ['clients', id] as const,
  invoices: ['invoices'] as const,
};

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: api.dashboard });
}

export function useClients(query: ClientListQuery = {}) {
  return useQuery({
    queryKey: [...queryKeys.clients, query],
    queryFn: () => api.clients(query),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.client(id),
    queryFn: () => api.client(id),
    enabled: Boolean(id),
  });
}

export function useInvoices(query: InvoiceListQuery = {}) {
  return useQuery({
    queryKey: [...queryKeys.invoices, query],
    queryFn: () => api.invoices(query),
  });
}

function useRefreshBusinessData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.clients }),
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
    ]);
}

export function useCreateClient() {
  const refresh = useRefreshBusinessData();
  return useMutation({ mutationFn: api.createClient, onSuccess: refresh });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const refresh = useRefreshBusinessData();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof api.updateClient>[1];
    }) => api.updateClient(id, input),
    onSuccess: async (client) => {
      await refresh();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.client(client.id),
      });
    },
  });
}

export function useCreateInvoice() {
  const refresh = useRefreshBusinessData();
  return useMutation({ mutationFn: api.createInvoice, onSuccess: refresh });
}

export function useUpdateInvoice() {
  const refresh = useRefreshBusinessData();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof api.updateInvoice>[1];
    }) => api.updateInvoice(id, input),
    onSuccess: refresh,
  });
}

export function usePayInvoice() {
  const refresh = useRefreshBusinessData();
  return useMutation({ mutationFn: api.payInvoice, onSuccess: refresh });
}

export function useDeleteInvoice() {
  const refresh = useRefreshBusinessData();
  return useMutation({ mutationFn: api.deleteInvoice, onSuccess: refresh });
}

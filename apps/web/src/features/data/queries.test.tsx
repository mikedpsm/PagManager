import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/setup';
import { useClients } from './queries';

const client = {
  id: 'a1b2c3d4-e5f6-4789-8abc-123456789abc',
  username: 'Ana Souza',
  email: 'ana@example.com',
  cpf: '11144477735',
  phone: '11912345678',
  status: 'ok',
};

describe('business data hooks', () => {
  it('loads authenticated client data through the typed API client', async () => {
    server.use(http.get('*/api/v1/clients', () => HttpResponse.json([client])));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useClients(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([client]);
    queryClient.clear();
  });
});

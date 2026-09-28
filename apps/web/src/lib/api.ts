import type { AppType } from '@pagmanager/api';
import type {
  AuthResponse,
  Client,
  ClientListQuery,
  CreateClientInput,
  CreateInvoiceInput,
  DashboardSummary,
  Invoice,
  InvoiceListQuery,
  LoginInput,
  RegisterInput,
  UpdateClientInput,
  UpdateInvoiceInput,
  UpdateMeInput,
  User,
} from '@pagmanager/contracts';
import { hc } from 'hono/client';

import { clearSession, getAccessToken } from './auth-storage';

const apiOrigin =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || window.location.origin;

async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const headers = new Headers(
    input instanceof Request ? input.headers : undefined,
  );
  new Headers(init?.headers).forEach((value, key) => {
    headers.set(key, value);
  });
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && token) clearSession();
  return response;
}

const client = hc<AppType>(apiOrigin, { fetch: authenticatedFetch });

async function readJson<T>(pendingResponse: Promise<Response>): Promise<T> {
  const response = await pendingResponse;
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';
    try {
      const body = (await response.json()) as {
        error?: { message?: string };
        message?: string;
      };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      // Keep the friendly fallback when the server has no JSON error payload.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

function stringQuery(values: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(values).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}

export const api = {
  login: (input: LoginInput) =>
    readJson<AuthResponse>(client.api.v1.auth.login.$post({ json: input })),
  register: (input: RegisterInput) =>
    readJson<AuthResponse>(client.api.v1.auth.register.$post({ json: input })),
  checkEmail: (email: string) =>
    readJson<{ available: boolean }>(
      client.api.v1.auth['check-email'].$post({ json: { email } }),
    ),
  me: () => readJson<User>(client.api.v1.me.$get()),
  updateMe: (input: UpdateMeInput) =>
    readJson<User>(client.api.v1.me.$patch({ json: input })),
  dashboard: () =>
    readJson<DashboardSummary>(client.api.v1.dashboard.summary.$get()),
  clients: (query: ClientListQuery = {}) =>
    readJson<Client[]>(
      client.api.v1.clients.$get({
        query: stringQuery({
          search: query.search,
          status: query.status,
          sort: query.sort,
        }),
      }),
    ),
  client: (id: string) =>
    readJson<Client>(client.api.v1.clients[':id'].$get({ param: { id } })),
  createClient: (input: CreateClientInput) =>
    readJson<Client>(client.api.v1.clients.$post({ json: input })),
  updateClient: (id: string, input: UpdateClientInput) =>
    readJson<Client>(
      client.api.v1.clients[':id'].$patch({ param: { id }, json: input }),
    ),
  deleteClient: (id: string) =>
    readJson<void>(client.api.v1.clients[':id'].$delete({ param: { id } })),
  invoices: (query: InvoiceListQuery = {}) =>
    readJson<Invoice[]>(
      client.api.v1.invoices.$get({
        query: stringQuery({ status: query.status, clientId: query.clientId }),
      }),
    ),
  createInvoice: (input: CreateInvoiceInput) =>
    readJson<Invoice>(client.api.v1.invoices.$post({ json: input })),
  updateInvoice: (id: string, input: UpdateInvoiceInput) =>
    readJson<Invoice>(
      client.api.v1.invoices[':id'].$patch({ param: { id }, json: input }),
    ),
  payInvoice: (id: string) =>
    readJson<Invoice>(
      client.api.v1.invoices[':id'].pay.$post({ param: { id } }),
    ),
  deleteInvoice: (id: string) =>
    readJson<void>(client.api.v1.invoices[':id'].$delete({ param: { id } })),
};

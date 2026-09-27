# Frontend/API contract (Phase 5)

This contract maps the imported legacy screens to the current API mounted at
`/api/v1`. Authentication is bearer-token based. User and client resources use
the shared Zod schemas in `packages/contracts`; money is represented as integer
BRL cents and dates as ISO `YYYY-MM-DD` strings.

| Frontend flow | Current API | Contract and migration notes |
| --- | --- | --- |
| Register | `POST /api/v1/auth/register` | Input `{ username, email, passwd }`; legacy `name` becomes `username`, and `password` becomes `passwd`. Response contains `{ token, user }`. |
| Login | `POST /api/v1/auth/login` | Input `{ email, passwd }`; legacy `password` becomes `passwd`. Response contains `{ token, user }`. |
| Registration email check | `POST /api/v1/auth/check-email` | Input `{ email }`, response `{ available }`; optional step-1 validation. |
| Session/profile | `GET /api/v1/me`, `PATCH /api/v1/me` | User fields are `id`, `username`, `email`, optional `cpf` and `phone`. Patch fields: `username`, `email`, `passwd`, `confirmPasswd`, `cpf`, `phone`. |
| Clients | `GET /api/v1/clients`, `GET /api/v1/clients/:id`, `POST /api/v1/clients`, `PATCH /api/v1/clients/:id`, `DELETE /api/v1/clients/:id` | Requests are scoped to the authenticated user. Search/status/sort query fields: `search`, `status` (`overdue` or `ok`), `sort`. Input uses `username`, `email`, `cpf`, `phone`, optional `city`, `cep`, `uf`, `street`, `region`, `complement`. Map legacy `name` to `username`, `address` to `street`, `neighborhood` to `region`, and `state` to `uf`; do not send legacy `user_id`. |
| Invoices | `GET /api/v1/invoices`, `GET /api/v1/invoices/:id`, `POST /api/v1/invoices`, `PATCH /api/v1/invoices/:id`, `DELETE /api/v1/invoices/:id` | Query filters: `status` (`paid`, `pending`, `overdue`) and `clientId`. Create/update fields: `clientId`, `description`, integer `amountCents`, `dueDate`. User scope is taken from the token. Map legacy `debtor_id` to `clientId` and convert decimal `amount` to cents; omit `users_id` and `emission_date`. |
| Mark invoice paid | `POST /api/v1/invoices/:id/pay` | Replaces changing a legacy `status` field to `Paid`; response contains the updated invoice and its `paidAt` timestamp. |
| Dashboard | `GET /api/v1/dashboard/summary` | Returns totals `{ paidCents, pendingCents, overdueCents }`, plus up to four `overdueClients` and `upToDateClients` with `{ invoiceId, username, amountCents, dueDate }`. Replaces three legacy list calls and client-side total aggregation. |

All protected endpoints are mounted behind the API auth middleware. Client
responses include address fields and derived client status. Invoice status is
derived from `paidAt` and `dueDate`; the UI should format amounts and dates for
pt-BR without changing their wire representation. API validation and error
responses use the shared contracts/error handler rather than legacy `msg`
payloads.

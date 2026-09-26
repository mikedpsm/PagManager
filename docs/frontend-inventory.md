# Frontend inventory and parity checklist (Phase 5)

The legacy React app has been replaced by the TypeScript frontend in
`apps/web`. Its stack is React 19, Vite, TanStack Router and Query, React Hook
Form, shared Zod contracts, Tailwind CSS 4, Radix UI primitives, Sonner, and
Storybook 9. The original app came from
[IndioBR/cubos-final-challenge-T04](https://github.com/IndioBR/cubos-final-challenge-T04)
and is documented below as a source for feature parity.

## Routes

| Route | Screen | Access and behavior |
| --- | --- | --- |
| `/` | Redirects to `/login` | Public entry point. |
| `/login` | Sign in | Public; an existing session redirects to `/home`. |
| `/register?step=1\|2\|3` | Three-step registration | Public; validates email availability, keeps step-one data in `sessionStorage`, then creates the account and shows completion. |
| `/home` | Dashboard | Protected; paid, pending, and overdue totals plus client summaries from the dashboard API. |
| `/clients` | Client list | Protected; search, status filter, name sort, and create flow. |
| `/clients/:clientId` | Client detail | Protected; edit client and manage that client's invoices. Replaces the legacy `?debtor_id=` route. |
| `/invoices` | Invoice list | Protected; status filter, create/edit, mark paid, and delete. Replaces legacy `/charges`. |

TanStack file routes live in `apps/web/src/routes`; authenticated screens are
nested under the guarded `/_app` layout.

## Legacy-flow parity checklist

| Legacy flow | Phase 5 implementation |
| --- | --- |
| Login and registration | `features/auth`: typed API calls, shared schema validation, email availability check, three URL-addressable steps, saved registration draft, completion screen, and the split login layout using `assets/images/login_side.png`. |
| Session, profile, and logout | `AuthProvider`/`useAuth`, token and user in local storage, protected routes, global 401 session clearing, editable profile through `PATCH /me`, and logout from the profile menu. |
| Application frame | Responsive sidebar and mobile dialog menu, active route state, profile dropdown, and focus-managed Radix dialogs. |
| Dashboard | `features/dashboard`: API totals for paid/pending/overdue invoices, overdue and up-to-date client cards, loading skeletons, and retryable error state. |
| Client list and detail | `features/clients`: search, status filtering, name sort, create/edit dialogs, CPF/phone/CEP masks, optional ViaCEP lookup, client profile, and invoices scoped to that client. |
| Invoice management | `features/invoices`: list/status filter, create/edit, delete confirmation, and mark-paid action from both the invoice list and client detail. |
| Formatting and feedback | `lib/format.ts` reuses contract helpers for BRL/CPF and adds pt-BR date, CPF, phone, CEP, and amount masks. Sonner toasts replace the legacy feedback card; loading states use Skeleton. |
| Mobile and accessibility | Responsive page controls and tables, explicit labels and field errors, accessible action names, Radix dialog focus handling, and keyboard-operable menus and selects. |

Frontend requests are typed in `apps/web/src/lib/api.ts` with Hono's client and
the API `AppType`. Wire formats and endpoint mappings are documented in
[`api-contract.md`](api-contract.md). Forms reuse schemas from
`packages/contracts`; business data is loaded and invalidated through
TanStack Query hooks in `features/data/queries.ts`.

## Assets and component stories

The app keeps the login illustration and only the SVGs used by the new layout
under `src/assets/images` and `src/assets/icons`. SVGs are imported as React
components through SVGR. Storybook CSF3 stories are TSX files under
`src/components/ui`; the production Storybook bundle is part of CI.

## Verification

The web test setup uses Vitest, Testing Library, and MSW. Current tests cover
login validation/submission, registration password confirmation, and the
typed client-data query. Run the package checks with:

```sh
pnpm --filter @pagmanager/web typecheck
pnpm --filter @pagmanager/web test
pnpm --filter @pagmanager/web build
pnpm --filter @pagmanager/web storybook:build
```

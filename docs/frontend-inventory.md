# Frontend inventory and parity checklist (Phase 5)

## Original frontend inventory (Phase 0 source)

Source: upstream commit `6fa8b12c665a746d8ee9170bf4a025fe4f9144d3` from
`IndioBR/cubos-final-challenge-T04`, retained as the second parent of subtree
import `58daa4cc5e534819079ebcdcc27359df4789038b`. Inspect source with
`git show 6fa8b12:<path>`. The imported `apps/web` tree equals the upstream
root tree; all 15 upstream commits preserve Jonatas/Jonatas Ximenez authorship.
Root README credits the author. This section records the original implementation;
the remaining sections describe the modern frontend.

### Original routes and forms

Routes come from `src/templates/Auth/Routes/index.jsx`; protected screens use
`src/templates/Auth/private_routes.jsx`. Form paths below are relative to
`src/components/Forms`.

| Original route | Screen/form and behavior | Current route |
| --- | --- | --- |
| `/` | Login: required email/password; stores token/user locally. | `/login` |
| `/register/step-1` | Register1: required name/email saved in context; no fetch. | `/register?step=1` |
| `/register/step-2` | Register2: password/confirmation, minimum 8 characters; registration fetch. | `/register?step=2` |
| `/register/step-3` | RegisterComplete: success and login link; no fetch. | `/register?step=3` |
| `/home` | Amount, ChargesCard and ClientsCard dashboard. | `/home` |
| `/clients` | ClientsContainer and InsertClient create/edit dialog. | `/clients` |
| `/clients/client?debtor_id=<id>` | ClientContainer profile/invoices and client/invoice dialogs. | `/clients/:clientId` |
| `/charges` | ChargesContainer, InsertCharges and DeleteCharge. | `/invoices` |

InsertClient requires name/email/CPF/phone and offers address, complement, CEP,
neighborhood, city and state. InsertCharges contains client name, description,
due date, amount and paid/pending radios. EditRegister edits name/email/CPF/phone
and password plus local password confirmation from TopBar settings. DeleteCharge
confirms deletion with no request body. Shared Input supplies labels/password
visibility/confirmation feedback; Register/ProgressBar renders step progress.
Confirmation passwords are never transmitted.

### Original cards, containers and frame

Paths are relative to `src/components`, except `templates/*` paths.

| Components | Responsibility/data |
| --- | --- |
| `Cards/Amount` | BRL aggregate and paid/pending/overdue appearance. |
| `Cards/ChargesCard`, `Cards/ChargesCard/Charge` | Invoice group/count and debtor name, billing id, amount rows. |
| `Cards/ClientsCard`, `Cards/ClientsCard/Charge` | Defaulter/payer client groups and rows. |
| `Cards/CardTitle`, `Cards/CardFields`, `Cards/CardButton` | Shared dashboard headings, column labels, view-all action. |
| `Cards/FeedbackCard` | Context-driven success/error message. |
| `ChargesContainer`, `ChargesContainer/Titles`, `ChargesContainer/Fields` | Invoice table: debtor, billing id, amount, due date, status, description; edit/delete and client-detail links. |
| `ClientsContainer`, `ClientsContainer/Titles`, `ClientsContainer/Fields` | Client table: name, CPF, email, phone, status; detail link and create-invoice action. |
| `templates/pages/Client/ClientContainer` | Client identity/address profile, edit action and invoice table. |
| `templates/Base`, `Menu/Nav`, `Menu/Link`, `TopBar`, `TopBar/User`, `TopBar/SettingsModal` | Application shell, navigation, profile/settings/logout. |
| `Contexts`, `templates/Auth`, `templates/Auth/private_routes` | Session, registration draft, modal/feedback state and guard. |
| `Button`, `Loading`, `MiddleDiv`, `Search`, `TextComponent` | Button, loading indicator, layout divider, search and text. |
| `templates/pages/Login`, `templates/pages/Register/Register1..3` | Authentication layouts and step composition. |
| `templates/pages/Home/Home`, `templates/pages/Clients`, `templates/pages/Client`, `templates/pages/Charges` | Route data fetch and composition. |

### Every original fetch and payload

All calls target `http://localhost:8000/api`. Protected requests send a bearer
token from localStorage; mutation bodies are JSON. Callers are the form paths
above and `src/templates/pages`. Login consumes `{ token, user }` and `error`;
other mutation feedback generally consumes `msg`.

| Caller | Method/path | Request/consumed data |
| --- | --- | --- |
| Login | POST `/auth/login` | `{ email, password }` |
| Register2 | POST `/auth/register` | `{ name, email, password }` |
| EditRegister | POST `/users/:userId` | `{ _method: 'PATCH', name, email, password, cpf, phone }` |
| InsertClient create | POST `/debtors` | `{ user_id, name, email, cpf, phone, address, complement, cep, neighborhood, city, state }` |
| InsertClient edit | POST `/debtors/:id` | Same fields plus `_method: 'PATCH'`. |
| InsertCharges create | POST `/installments` | `{ users_id, debtor_id, emission_date, description, due_date, amount, status }` |
| InsertCharges edit | POST `/installments/:id` | Same fields plus `_method: 'PATCH'`. |
| DeleteCharge | DELETE `/installments/:id` | No body; local success message. |
| Clients | GET `/debtors/user/:userId` | Client list: name/email/CPF/phone/status/id. |
| Client | GET `/debtors/:debtorId` | `debtor_id` URL query identifies client identity/address. |
| Client | GET `/installments?filter=debtor_id:=:<debtorId>` | Client invoices. |
| Charges and Home | GET `/installments?filter=users_id:=:<userId>` | Invoices: id, id_billing, debtor object, amount, description, due_date, status, overdue_payment. |
| Home | GET `/debtors/defaulters/user/:userId` | Defaulter dashboard group. |
| Home | GET `/debtors/payers/user/:userId` | Payer dashboard group. |

`templates/pages/Home/_utils/homeReq.js` groups paid invoices by `status ==
'Paid'`, overdue by `overdue_payment == 1`, and upcoming by `overdue_payment ==
0` with status `Open` or `Partially paid`, then sums `amount`. InsertCharges
instead emits `Paid`/`Pending` (initial state `paid`). Client appearance recognizes
`Defaulter`, `Payer`, `New`. These inconsistent labels motivate normalized,
derived status and token-scoped ownership in the new contract.

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

## Complete original asset manifest

Every original src/assets and public file, including unused or replaced assets,
from git ls-tree -r --name-only 6fa8b12:


```text
public/favicon.ico
public/index.html
public/logo192.png
public/logo512.png
public/manifest.json
public/robots.txt
src/assets/+.svg
src/assets/3-points-circle.svg
src/assets/3-points.svg
src/assets/add-charge.svg
src/assets/arrow-down.svg
src/assets/arrows.svg
src/assets/bank.svg
src/assets/charge-selected.svg
src/assets/charge.svg
src/assets/check.svg
src/assets/circle-check.svg
src/assets/circle-warning.svg
src/assets/client.svg
src/assets/clients-selected.svg
src/assets/clients.svg
src/assets/defaulter.svg
src/assets/delete.svg
src/assets/doc.svg
src/assets/edit.svg
src/assets/edit_client.svg
src/assets/exchange.svg
src/assets/filter-1.svg
src/assets/filter-2.svg
src/assets/forward.svg
src/assets/hide-password.svg
src/assets/home-selected.svg
src/assets/home.svg
src/assets/images/login_side.png
src/assets/logout.svg
src/assets/loyal.svg
src/assets/main/defaulter-client.svg
src/assets/main/loyal-client.svg
src/assets/main/overdue.svg
src/assets/main/paid.svg
src/assets/main/pending.svg
src/assets/new-charge.svg
src/assets/play.svg
src/assets/progress1.svg
src/assets/progress2.svg
src/assets/progress3.svg
src/assets/register_complete.svg
src/assets/return-1.svg
src/assets/return-2.svg
src/assets/search.svg
src/assets/show-password.svg
src/assets/step_1.svg
src/assets/step_2.svg
src/assets/step_3.svg
src/assets/tag.svg
src/assets/triangle-warning.svg
src/assets/warning-balloon.svg
src/assets/x-circle.svg
src/assets/x-error.svg
src/assets/x-success.svg
src/assets/x.svg
```

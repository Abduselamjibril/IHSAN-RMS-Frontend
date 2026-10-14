# Frontend Architecture

## Technology

- Angular 21 with standalone components
- TypeScript and RxJS
- Angular Router for navigation
- `HttpClient` with a functional authentication interceptor

## Source layout

```text
src/app/
├── app.ts / app.html / app.config.ts  Application shell and providers
├── app.routes.ts                      Route definitions
├── components/                        Shared visual components
├── guards/                            Route-access checks
├── pages/                             Feature screens
├── services/                          API clients and authentication state
└── utils/                             Shared UI helpers
```

## Feature areas

| Area | Example routes | Primary API client |
| --- | --- | --- |
| Dashboard and reports | `/dashboard`, `/reports` | `reports.service.ts` |
| CRM | `/leads`, `/agents`, `/opportunities` | `crm.service.ts` |
| Properties | `/properties/*` | `properties.service.ts` |
| Sales | `/sales/*` | `sales.service.ts` |
| Finance | `/finance/*` | `finance.service.ts` |
| Marketing | `/marketing/*` | `marketing.service.ts` |
| Brokers | `/broker/*` | `broker.service.ts` |
| Notifications | `/notifications/*` | `notifications.service.ts` |
| Security | `/security/*` | `auth.service.ts` |

## Authentication and authorization

1. `AuthService` posts credentials to `POST /api/auth/login`.
2. The API creates an HttpOnly `auth_token` cookie. JavaScript must not read or store the token.
3. `auth.interceptor.ts` adds `withCredentials: true` to API requests.
4. User profile and permission display data is stored in `sessionStorage` as `auth_user`; it is not a credential.
5. `authGuard` protects routes. The backend remains the source of truth for permission checks.

## API contract rules

- Keep API URLs in `src/app/config.ts`; do not hard-code URLs in components.
- Put HTTP calls in feature services, not components.
- HTML `<select>` values are strings by default. Use `[ngValue]` for IDs or convert IDs with `Number(...)` before a request.
- Send ISO-compatible date strings when a backend DTO expects `@IsDateString()`.
- File download links come from `AuthService.getDownloadUrl()`; do not append access tokens to URLs.

## Adding a feature

1. Create a standalone page under `src/app/pages/<feature>/`.
2. Add an API client method to the relevant service.
3. Register a guarded route in `app.routes.ts`.
4. Add a sidebar item only when the user has the matching permission.
5. Validate form inputs and submit correctly typed data.
6. Add/update backend DTOs, permission mappings, and backend documentation.

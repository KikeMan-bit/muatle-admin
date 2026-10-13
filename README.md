# Muatle Admin

Muatle's own administration, for the team: every business with where its subscription stands,
the plan each one is on and until when, the accounts, and the countries and lines the sign-up
offers. Next.js 16 with the App Router; all data lives in [muatle-backend](../muatle-backend)
(its `platform_admin` app, under `/api/v1/admin/`). The businesses' own panel is
[muatle](../muatle).

## Getting started

You need Node 22 and pnpm, and muatle-backend running on port 8000 (`docker compose up` in its
folder, or `uv run python manage.py runserver`).

```bash
pnpm install
cp .env.example .env.local   # then fill in NEXTAUTH_SECRET
pnpm dev                     # http://localhost:3001
```

It runs on port 3001, so it can run beside the panel on 3000. The backend lets that origin in by
default in development; on a server, add the admin's address to its `CORS_ALLOWED_ORIGINS`.

Only an account of Muatle's team signs in: one with the Admin platform role, or staff of the Django
admin. The first one is made on the backend:

```bash
uv run python manage.py create_admin carlos@muatle.com --password unaClaveSegura1 --first-name Carlos
```

The next ones are added from the admin itself (Cuentas › Nueva cuenta del equipo).

| Script           | What it does                     |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Development server on port 3001  |
| `pnpm build`     | Production build                 |
| `pnpm start`     | Serves the production build      |
| `pnpm lint`      | ESLint                           |
| `pnpm typecheck` | TypeScript, without emitting     |

## Layout

| Path                     | What lives there                                                       |
| ------------------------ | ---------------------------------------------------------------------- |
| `app/(auth)/login`       | Signing in                                                             |
| `app/(panel)`            | The admin, behind a session: Inicio, Negocios, Cuentas, Parámetros     |
| `components/layout`      | The frame: sidebar, topbar, who is signed in                           |
| `components/ui`          | Shared building blocks, the same as the panel's (buttons, dialogs…)    |
| `components/data-table`  | The paginated table every list is drawn with                           |
| `hooks/use-admin.ts`     | The queries and changes, through TanStack Query, with the session token |
| `hooks/use-url-state.ts` | Filters, search and page kept in the URL, so coming back finds them    |
| `lib/admin-api.ts`       | The backend's admin API, typed as it answers                           |
| `lib/auth.ts`            | NextAuth: signing in trades the backend's token for a session cookie   |
| `proxy.ts`               | Sends whoever has no session to `/login`                               |

## Conventions

- Code, folders, routes and comments are in English; everything the person reads is in Spanish.
- The backend's error messages are already in Spanish and fit to show: `ApiError.message` holds
  them as they come, and `ApiError.fields` the one of each field.
- Dates are shown on Bolivia's clock, which is where the subscriptions are counted.
- A plan is activated from a business's page with the day it is paid until: that day, as it
  starts, the plan ends, which is how the panel tells the owner ("Vence el 11 de noviembre").
  Then come three days of grace, and the panel locks until a plan is active again.

## Production

Set the variables in `.env.example` on the server, with `NEXTAUTH_URL` on https and a
`NEXTAUTH_SECRET` of its own. `next.config.ts` adds the security headers: no page can be shown
inside another site's frame, and search engines are asked to stay out.

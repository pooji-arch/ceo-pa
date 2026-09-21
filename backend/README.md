# CEO PA Backend

Express + TypeScript + Prisma API for the CEO PA application.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
```

Fill in `.env` locally — it is gitignored and never committed.

## Connecting to Supabase (current DB)

1. In the Supabase dashboard: **Project Settings → Database → Connection
   string → URI** — use the **Session pooler**, not "Direct connection" (that
   host is IPv6-only and unreachable on many networks) and not "Transaction
   pooler" (doesn't support the prepared statements Prisma migrations need).
2. Copy that string into your local `.env` as `DATABASE_URL`, replacing
   `[YOUR-PASSWORD]` with the real database password.
3. If the password contains any of `@ : / ? # % [ ]` or a space, percent-encode
   just that character (`@`→`%40`, `:`→`%3A`, `/`→`%2F`, `#`→`%23`, `%`→`%25`,
   `?`→`%3F`, space→`%20`) — an unescaped special character breaks Prisma's
   URL parsing.

Then run the first migration + seed:

```bash
npx prisma migrate dev --name init
```

This creates every table from `prisma/schema.prisma` and seeds it (via
`prisma/seed.ts`) with the same mock data the standalone HTML prototype uses —
19 departments, sample appointments/tasks/meetings, 6 Kaizen ideas with their
milestones and contributors, September 2026 weekly scoring, and two dev
accounts:

| Role | Email | Password |
| --- | --- | --- |
| CEO | `ceo@ceopa.dev` | `Dev@CeoPa2026` |
| PA | `pa@ceopa.dev` | `Dev@CeoPa2026` |

These are local/dev-only seed credentials, not real secrets — fine to keep in
the seed script, never used in production seeding.

## Parked: staging DB (`ceo_pa_staging`)

Set aside for now while we build against Supabase — connection details are
still in `.env.example` (commented out) so nothing is lost. The staging DB
lives on `15.252.10.156`, reachable only through your own SSH tunnel; I never
handle the private key or password myself.

## Local development (no staging access needed)

```bash
# requires a local Postgres running on 5432 with a `ceo_pa_dev` database
npm run dev
```

`GET /health` returns `{ success, data: { dbConnected }, error }` — a quick
way to confirm the API can reach whichever database `DATABASE_URL` points at.

## Auth API

| Endpoint | Auth | Notes |
| --- | --- | --- |
| `POST /auth/register` | — | `{ email, password, name, role }`, role is `CEO` or `PA` |
| `POST /auth/login` | — | `{ email, password }` → `{ token, user }` |
| `POST /auth/logout` | Bearer token | Stateless JWT — just tells the client to discard it |
| `GET /auth/me` | Bearer token | Current user from the token |
| `GET /auth/google` | — | Redirects to Google's consent screen |
| `GET /auth/google/callback` | — | Google redirects here; we redirect on to `<frontend>/oauth/callback?token=...` (or `?error=...`) |

Google sign-in **links an existing account by email, it never creates one** —
this app has a fixed CEO/PA roster, not open registration. See the Google
OAuth section in `.env.example` for how to set up a real OAuth client; until
then, password login works fully and the Google button will error.

Role-gating middleware (`requireAuth`, `requireRole`) is in
`src/middleware/auth.ts`. Its first real test case is
`PATCH /appointments/:id/approval` (CEO-only) — the rest of the Appointments
API (create, PA-only reschedule, etc.) lands with the full Tasks/Meetings
build.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the API with hot reload (`tsx watch`) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm run prisma:generate` | Regenerate the Prisma client after a schema change |
| `npm run prisma:migrate` | Create + apply a new migration (dev) |
| `npm run prisma:deploy` | Apply existing migrations (staging/prod) |
| `npm run prisma:studio` | Open Prisma Studio to browse data |

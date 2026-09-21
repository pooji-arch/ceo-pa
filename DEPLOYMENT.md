# CEO PA — Deployment Guide (Days 9–10)

This covers what's left to take the app from "running on my machine against
Supabase" to a real staging and production deployment. Everything here is
built and ready — what's left needs decisions and credentials only you can
provide (which host, which domain, real OAuth credentials), so this is a
checklist for you to work through, with me picking back up wherever you need
code changes.

## What's already built

- `backend/Dockerfile` — multi-stage build, compiles TypeScript, runs
  `prisma generate`, produces a small production image. Verified building
  clean locally.
- `app/Dockerfile` + `app/nginx.conf` — builds the Vite app and serves it as
  static files via nginx, with SPA routing (deep links like `/app/kaizen/:id`
  resolve to `index.html` instead of 404ing). Verified building clean locally.
- Both apps already read all configuration from environment variables — no
  hardcoded URLs or secrets anywhere in the code.

## 1. Choose hosting

Not chosen yet — this is the first real decision. Any of these work with the
Dockerfiles as-is:

- **Simplest**: Railway, Render, or Fly.io — each can build straight from
  the Dockerfiles, handles HTTPS automatically, minimal config.
- **More control**: a VPS (DigitalOcean, Lightsail, EC2) running the two
  containers behind a reverse proxy (Caddy or nginx) for TLS.
- **Split**: frontend on a static host (Vercel/Netlify/Cloudflare Pages),
  backend on any Node host — also fine, they're independent services.

Whichever you pick, you need: a place to run the backend container (needs to
stay running, not serverless — it holds a Prisma connection pool and the
notification-check interval), a place to serve the frontend's static build,
and a domain (or subdomain) for each, e.g. `api.staging.yourapp.com` and
`staging.yourapp.com`.

## 2. Database

Already on Supabase (`ceo_pa_staging` used so far). For a real staging/prod
split, decide: reuse the same Supabase project with separate schemas, or two
separate Supabase projects (cleaner isolation, recommended — mirrors
Day 10's "separate production environment, isolated secrets"). Either way
you already have the connection-string pattern from `backend/README.md`.

## 3. Environment variables

**Backend** (`backend/.env.example` is the template):

| Variable | Staging | Production |
| --- | --- | --- |
| `DATABASE_URL` | Supabase staging pooler URL | Supabase production pooler URL — **different project/DB** |
| `PORT` | `4000` (or whatever the host assigns) | same |
| `NODE_ENV` | `staging` or `production` | `production` |
| `CORS_ORIGIN` | `https://staging.yourapp.com` | `https://yourapp.com` |
| `JWT_SECRET` | a fresh random value (`node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`) | a **different** fresh random value — never share this between environments |
| `JWT_EXPIRES_IN` | `7d` | `7d` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | staging OAuth client (see §4) | **separate** production OAuth client |
| `GOOGLE_CALLBACK_URL` | `https://api.staging.yourapp.com/auth/google/callback` | `https://api.yourapp.com/auth/google/callback` |

**Frontend**: only `VITE_API_URL` (the backend's public URL) — baked in at
build time via `--build-arg VITE_API_URL=https://api.staging.yourapp.com`.

I still won't ever type real values for `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`,
or `DATABASE_URL` into anything myself — same rule as staging. Set these
directly in your host's environment/secrets panel, or in a `.env` file you
create yourself on the server.

## 4. Google OAuth — staging and production clients

You need **two separate** OAuth clients in
[Google Cloud Console](https://console.cloud.google.com/apis/credentials)
(Day 10 explicitly calls for isolated OAuth clients per environment):

1. Create Credentials → OAuth client ID → Web application.
2. Authorized redirect URI: exactly the `GOOGLE_CALLBACK_URL` from the table
   above for that environment.
3. Copy the Client ID/Secret into that environment's variables.

Google requires HTTPS for any non-localhost redirect URI, so this only works
once the domain + TLS from step 1 is live.

## 5. Deploy

```bash
# Backend
docker build -t ceo-pa-backend ./backend
docker run -p 4000:4000 --env-file backend/.env ceo-pa-backend

# Frontend
docker build -t ceo-pa-app --build-arg VITE_API_URL=https://api.staging.yourapp.com ./app
docker run -p 80:80 ceo-pa-app
```

(Exact commands vary by host — Railway/Render/Fly each have their own deploy
CLI that reads the Dockerfile directly; a VPS would run these via
`docker compose` or similar.)

Then run migrations against that environment's database (through your own
tunnel/VPN if the DB isn't publicly reachable, same as we did for staging):

```bash
cd backend
DATABASE_URL="<that environment's URL>" npx prisma migrate deploy
```

Use `migrate deploy` (not `migrate dev`) for staging/production — it applies
existing migrations without prompting or generating new ones.

**Production only** (Day 10): seed real reference data, not the mock/dev
data. `prisma/seed.ts` currently seeds the full mock dataset (dev accounts,
sample appointments, etc.) — for production you'd want a trimmed seed that
only creates the 19 departments and real CEO/PA accounts with real emails
and passwords they set themselves. Tell me when you're ready for this and
I'll build that separate seed script — I won't invent real people's
credentials myself.

## 6. Smoke test checklist (run after every deploy)

- [ ] Password login works for both a CEO and a PA account
- [ ] Google login works (once §4 is done)
- [ ] Role gating: PA-only actions rejected for CEO and vice versa (try one
      from each side — e.g. CEO attempting to create an appointment should 403)
- [ ] One create + one read works in each module: Appointments, Tasks,
      Meetings, Kaizen, Diet, Other Tasks, Weekly Scoring, Daily Activities
- [ ] Notifications appear after triggering an event (new appointment,
      approval decision, task creation)
- [ ] `GET /health` returns `dbConnected: true`
- [ ] No mixed-content warnings (frontend and backend both on HTTPS)
- [ ] CORS: frontend can call the backend from its real domain (open browser
      devtools console on the deployed frontend, confirm no CORS errors)

## Notes for whoever operates this

- The overdue-task / milestone-due notification check runs every hour, in
  the same Node process as the API (`backend/src/index.ts`). If you ever run
  more than one backend instance, each one runs this check independently —
  harmless (the `notifiedOverdueAt`/`notifiedDueAt` flags make it idempotent)
  but redundant. Not worth fixing unless you actually scale horizontally.
- `backend/README.md` has the day-to-day dev setup (Supabase connection,
  local dev, the auth API surface). This file is specifically the
  staging/production path.

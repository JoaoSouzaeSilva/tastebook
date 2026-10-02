This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Keepalive

This repo includes a GitHub Actions workflow at `.github/workflows/supabase-keepalive.yml` that records a heartbeat in the `app_keepalive_heartbeats` table every Monday and Thursday.

To enable it:

1. Make sure `supabase/migrations/20260405000001_add_app_keepalive_heartbeats.sql` has been applied (it is part of the normal migration chain).
2. Add these GitHub repository secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Optionally run the workflow manually once with `workflow_dispatch` to verify it works before relying on the schedule.

## Database migrations

The schema lives in `supabase/migrations/` and is the single source of truth.
`20260401000000_initial_schema.sql` is the baseline; everything after it is an
incremental change. Supabase tracks what has run in
`supabase_migrations.schema_migrations`, so production and this folder stay in sync.

To change the schema:

1. Add a new file `supabase/migrations/<YYYYMMDDHHMMSS>_<what_it_does>.sql`
   (for example via `supabase migration new <name>`). Never edit or rename a file that
   has already been applied — write a new one instead.
2. Prefer idempotent SQL (`if not exists`, `drop policy if exists` before `create policy`).
3. Apply it with `supabase db push`, or ask Claude to apply it through the Supabase
   connector (`apply_migration`), using the same version and name as the file.
4. Commit the file in the same PR as the code that needs it.

Do **not** run schema changes by hand in the SQL editor — they won't be recorded and
the history drifts.

## Deploying

Tastebook is a standard Next.js app with server routes and a proxy (middleware), so
it needs a host that runs a Node.js server — any of Vercel, Netlify, Cloudflare
Workers (via OpenNext), or a plain container running `npm run build && npm run start`.
Static hosting (GitHub Pages, S3) will not work.

### Environment variables

| Name | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server — Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server — Supabase anon (publishable) key |
| `GOOGLE_MAPS_API_KEY` | Server only — `/api/place-lookup` (Places API) |

`SUPABASE_SERVICE_ROLE_KEY` is **not** needed by the app. It is only used by the
keepalive GitHub Action, as a repository secret.

### After moving to a new domain

1. In Supabase, open **Authentication → URL Configuration** and set the **Site URL**
   to the new domain. Add `https://<new-domain>/auth/callback` to **Redirect URLs**.
   Sign-in is email + password, so this only affects the confirmation link sent on
   sign-up.
2. If the Google Maps key is restricted, add the new host to its allowed list. The
   key is only called server-side, so an HTTP-referrer restriction is not required.
3. Do a hard refresh on any phone that has the app installed as a PWA so it picks
   up the new origin.

# SpotOn Admin

Internal Next.js site for managing the SpotOn directory: **facilities, doctors,
telemedicine platforms, booking links, and doctor↔facility affiliations**. It
talks to the FastAPI backend's `/admin/*` endpoints (`SpotOn-backend/api`),
which require a user with `is_admin = true`.

## One-time setup

1. **Run migration 010** in the Supabase SQL editor:
   `SpotOn-backend/migrations/010_admin.sql` (adds `users.is_admin`).
2. **Promote your account** (register one via the mobile app or `POST /auth/register` first):
   ```sql
   update users set is_admin = true where email = 'you@example.com';
   ```
3. Copy env: `cp .env.example .env.local` (defaults to `http://localhost:8000`).

## Run

```bash
# 1. Backend (from SpotOn-backend/api, with its .env configured)
uvicorn app.main:app --reload

# 2. Admin site
npm install
npm run dev   # http://localhost:3000
```

Log in with your (promoted) SpotOn account email/phone + password.

## Notes on deletes & mobile sync

The mobile app mirrors the directory offline via `/sync`, which has **no delete
tombstones** — hard-deleted rows linger on devices until a full refresh. So:

- **Facilities** → prefer *Exclude* (sets `status='excluded'`; propagates via
  sync, hidden from the public API, reversible). Hard delete only for junk.
- **Doctors** → hard delete only (no status column); the confirm dialog warns
  about the sync caveat. Booking links + affiliations are removed with it.
- **Platforms / booking links** → prefer *Deactivate* (`is_active=false`); the
  public API filters inactive rows server-side.

## Stack

Next.js (App Router) · TypeScript strict · Tailwind + shadcn/ui ·
TanStack Query · react-hook-form + zod. Tokens live in `localStorage` with a
mutexed refresh (the backend rotates refresh tokens). The route guard is
client-side; real enforcement is the API's per-request `is_admin` check.

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

## Admin access & research data

The **Research data** page shows screenings that app users explicitly chose to
share (de-identified: no user id, month-level date, age band). Treat every
image as personal health information.

- **Who is an admin**: promoted only by manual SQL in Supabase (migration 010,
  `update users set is_admin = true where email = '…';`). There is no UI or
  API to grant admin. Keep **two or fewer** admins and demote anyone who no
  longer needs access (`set is_admin = false`).
- **MFA** must be on for every admin's Supabase, Render and GitHub accounts —
  each of them can reach the data or the code that guards it.
- **Never download or copy images outside the admin site** (no screenshots, no
  saving to disk, no sharing in chat). Images are fetched with your token and
  shown blurred until you click to reveal; delete anything identifying (faces,
  tattoos, documents) with *Delete (identifying/unusable)*.
- The **CSV export** carries metadata only (no images); quasi-identifiers in
  groups smaller than 5 are suppressed server-side. Store it only in the
  designated research location.
- **Audit log**: every image view, label, delete and export is recorded. An
  admin reviews the *Audit log* page **monthly** for unexpected access.
- **Breach**: if research data or an admin account is exposed, notify the
  National Privacy Commission (and affected users where required) **within 72
  hours** of discovery, per the Data Privacy Act (NPC Circular 16-03).
- Hardening in this site: 15-minute idle auto-logout, strict
  Content-Security-Policy + `X-Frame-Options: DENY` + `Referrer-Policy:
  no-referrer` (see `next.config.ts`). If you change the API origin, set
  `NEXT_PUBLIC_API_BASE_URL` before building — the CSP `connect-src` is derived
  from it at build time.

## Stack

Next.js (App Router) · TypeScript strict · Tailwind + shadcn/ui ·
TanStack Query · react-hook-form + zod. Tokens live in `localStorage` with a
mutexed refresh (the backend rotates refresh tokens). The route guard is
client-side; real enforcement is the API's per-request `is_admin` check.

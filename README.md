# MUEVE Universe

Next.js 16 + Postgres CMS for the MUEVE Universe landing page. Admin dashboard with Notion-style section editing, drag-and-drop reorder, per-section typed forms, theme editor (colors + fonts), and bilingual (RO/EN) content.

## Stack
- Next.js 16 (App Router) + React 19
- TypeScript + Tailwind CSS v4
- Postgres (local via Homebrew, production via Neon/Vercel Postgres)
- Drizzle ORM
- NextAuth v5 (credentials provider)
- GSAP / Lenis / Canvas animations preserved from original

## Dev setup

1. Install deps:
   ```
   npm install
   ```
2. Ensure Postgres is running locally and create a DB named `mueve`:
   ```
   createdb mueve
   ```
3. Copy env and fill in:
   ```
   cp .env.example .env.local
   ```
4. Push schema and seed:
   ```
   npm run db:push
   npm run db:seed
   ```
5. Start dev:
   ```
   npm run dev
   ```
   → `http://localhost:3000`
   → admin: `http://localhost:3000/admin/login`

## Admin
- Default admin user is seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars.
- `/admin` → drag-and-drop list of sections (add, remove, duplicate, hide, reorder).
- `/admin/sections/[id]` → typed editor for each section (bilingual RO/EN).
- `/admin/theme` → colors + fonts (CSS variables injected into every page).

## Section types
`nav`, `hero`, `worlds`, `program`, `mission`, `join`, `footer`, plus generic `text`, `cta`, `image`.

## Deploy to Vercel
1. Push to a GitHub repo.
2. Create a Vercel project linked to the repo.
3. Provision a Postgres database via Vercel Marketplace (Neon recommended).
4. Set env vars: `DATABASE_URL`, `AUTH_SECRET` (generate a strong random string), `AUTH_TRUST_HOST=true`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
5. Run `npm run db:push` and `npm run db:seed` once against the production DB (locally with production `DATABASE_URL`).

## Scripts
- `npm run dev` — dev server
- `npm run build` / `npm start` — production
- `npm run db:push` — sync schema to DB
- `npm run db:seed` — reset + seed content and admin user
- `npm run db:studio` — Drizzle Studio

## Structure
```
src/
  app/
    layout.tsx                  # root layout, fonts, theme CSS vars
    page.tsx                    # home (reads sections from DB)
    globals.css                 # MUEVE site CSS
    admin/
      layout.tsx                # admin shell + session provider
      page.tsx                  # sections dashboard
      login/page.tsx
      sections/[id]/page.tsx    # section editor
      theme/page.tsx            # global theme editor
      actions.ts                # server actions for mutations
    api/auth/[...nextauth]/route.ts
  components/
    site/                       # frontend section components
    admin/                      # admin UI + editors for each section type
  db/
    schema.ts                   # Drizzle schema
    index.ts                    # DB client
    seed.ts                     # initial content
  lib/
    content-types.ts            # bilingual + section data types
    theme.ts
    bilingual.ts
    lang-context.tsx
    default-data.ts
  auth.ts                       # NextAuth config
  middleware.ts                 # protects /admin/*
_legacy/                        # original static index.html + images
```

# Nexto

**Nexto — Order, without effort.**

Nexto is a smart task queue Chrome extension. This repo is a **Manifest V3** foundation: Svelte popup and options pages, a service worker, **offline-first `chrome.storage.local`**, and optional **Supabase** sync.

## Where data is stored

1. **Chrome `chrome.storage.local` (always)** — immediate read/write in `src/lib/storage.ts` (`nexto_tasks`, `nexto_active_task_id`, `nexto_state_meta`). This is the on-device buffer and works offline.
2. **Supabase (optional)** — when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set at build time, the popup merges with tables `nexto_tasks` and `nexto_state` and pushes updates (debounced). Auth uses **anonymous sign-in** with the session stored in the same `chrome.storage.local` via a small adapter (`src/lib/chromeAuthStorage.ts`).

## Tech stack

- Chrome Extension (MV3)
- Svelte 4 (no SvelteKit)
- Vite 5
- TypeScript
- `@supabase/supabase-js` with optional sync (`src/lib/remoteSync.ts`)
- `chrome.storage.local` for tasks + auth session

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers → Anonymous sign-ins** — enable.
3. **Create tables** (pick one):
   - **CLI:** add `DATABASE_URL` to `.env` (Postgres URI from **Settings → Database → Connection string**), then `npm run db:apply`.
   - **Dashboard:** open **SQL Editor**, paste `supabase/schema.sql`, run.
4. In `.env`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API** (see `.env.example`).
5. `npm run build` (Vite embeds the `VITE_*` vars at build time).

The **anon key** cannot run `CREATE TABLE`; migrations need the **database URI** or the SQL Editor.

If env vars are missing or still placeholders, the extension stays **local-only**.

The manifest includes **`host_permissions`** for `https://*.supabase.co/*` so the popup can reach Auth and PostgREST. After changing `.env`, run **`npm run build`** and reload the extension in `chrome://extensions`.

## Development

```bash
npm install
cp .env.example .env   # then edit .env
npm run build
```

The extension bundle is written to `dist/`. A second Vite pass builds `content.js` as an **IIFE** (Chrome content scripts are not ES modules).

Watch mode while iterating:

```bash
npm run dev
```

Reload the unpacked extension in `chrome://extensions` after each build.

## Load in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `dist` folder (not the repo root).

## Project layout

- `public/manifest.json` — MV3 manifest (copied to `dist`).
- `src/popup/` — toolbar popup UI.
- `src/options/` — options page.
- `src/background/` — service worker (tab activation, idle, commands).
- `src/content/` — content script placeholder.
- `src/store/tasks.ts` — task store + persistence hooks.
- `src/lib/storage.ts` — `chrome.storage.local` + `LocalTaskBundle` meta for merge.
- `src/lib/supabase.ts` — Supabase client (env-driven).
- `src/lib/remoteSync.ts` — pull / merge / push + debounced upload.
- `supabase/schema.sql` — tables and RLS policies.

## Keyboard shortcut

**Add task** (suggested): `Ctrl+Shift+A` (Windows/Linux) or `Command+Shift+A` (macOS). Configure under `chrome://extensions/shortcuts`. The background script logs the command; wire it to a quick-add flow when you extend the product.

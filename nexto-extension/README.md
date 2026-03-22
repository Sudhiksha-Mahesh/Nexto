# Nexto

**Nexto — Order, without effort.**

Nexto is a smart task queue Chrome extension. This repo is a minimal **Manifest V3** foundation: Svelte popup and options pages, a service worker, offline-first `chrome.storage.local` persistence, and a placeholder Supabase client for future sync.

## Tech stack

- Chrome Extension (MV3)
- Svelte 4 (no SvelteKit)
- Vite 5
- TypeScript
- `@supabase/supabase-js` (client only; sync not implemented)
- `chrome.storage.local` for tasks

## Development

```bash
npm install
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
- `src/lib/storage.ts` — `chrome.storage.local` helpers.
- `src/lib/supabase.ts` — Supabase client (placeholders).

## Keyboard shortcut

**Add task** (suggested): `Ctrl+Shift+A` (Windows/Linux) or `Command+Shift+A` (macOS). Configure under `chrome://extensions/shortcuts`. The background script logs the command; wire it to a quick-add flow when you extend the product.

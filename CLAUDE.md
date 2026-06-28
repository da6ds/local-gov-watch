# local-gov-watch

Standards: inherits ../engineering-standards.md. Overrides & project-specifics below.

Tracks and surfaces local government activity. Originally scaffolded via Lovable.

## Stack
- Vite + React + TypeScript
- shadcn/ui + Radix UI
- Tailwind
- Supabase backend
- Playwright e2e tests (`tests/`)

## Build & dev

```bash
npm run dev
npm run build
npm run lint
npm run deploy   # builds and pushes to gh-pages
```

## Deploy
- Hosted on GitHub Pages via `gh-pages` branch (overrides the umbrella default of Cloudflare Pages / Render).

## Notes
- Repo was created in Lovable.
- North Bay setup: `NORTH_BAY_SETUP.md`.
- Connector re-run instructions: `CONNECTOR_RERUN_INSTRUCTIONS.md`.

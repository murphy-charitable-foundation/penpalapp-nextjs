# PenPal App

Next.js app connecting students with pen pals. Firebase backend, Vercel hosting.

## Docs
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/API_ROUTES.md](docs/API_ROUTES.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Run locally
`npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`).
Open http://localhost:3000 and start with `app/page.js`.

## Note
Do not override `PageBackground` or `PageContainer` styles until the planned update lands.

### Navigation Links

For internal navigation within the app, we recommend using Next.js `Link` instead of a regular `<a>` tag.  
`Link` integrates with the Next.js router and avoids full page reloads, resulting in smoother navigation.

For external links (for example WhatsApp, Instagram, or other external websites), a regular `<a>` tag should be used instead, since those links navigate outside the application.

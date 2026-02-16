# Application Architecture (short)

## What matters first
- Next.js 13+ App Router.
- Firebase: Auth, Firestore, Storage.
- Vercel deploy.
- Tailwind CSS.

## Where to look
- Pages: `app/*/page.js`
- Chat: `app/letters/[id]/page.js`
- Inbox: `app/letterhome/page.js`
- Discovery: `app/discovery/page.js`
- API: `app/api/*/route.js`
- Shared UI: `components/general/*`
- Firebase setup: `app/firebaseConfig.js` (client) and `app/firebaseAdmin.js` (server)

## Page pattern (gotcha)
Client pages that use hooks or Firebase must include `'use client'`.

## Data model (chat)
Firestore structure:
`letterboxes/{letterboxId}/messages/{messageId}` and `drafts/{userId}`.
Most real-time UI comes from Firestore listeners; no global state library.

## Analytics & errors (gotcha)
Use helpers in `app/utils/analytics.js` so events go to Firebase Analytics and errors to Sentry.

## Env vars (gotcha)
Secrets live only in Vercel. Local runs require matching env vars.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for CI/CD details.

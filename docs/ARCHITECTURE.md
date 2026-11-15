# Application Architecture (short)

## What matters first
- Next.js 13+ App Router.
- Firebase backend (Auth, Firestore, Storage) with security rules in Firestore.
- Vercel hosts the web app (client + server runtime).
- Tailwind CSS.

## Business idea (short)
Connects students with pen pals via a safe, moderated message-style chat.

## Where to look
- Pages: `app/*/page.js`
- Chat: `app/conversation/[id]/page.js`
- Inbox: `app/inbox/page.js`
- Discovery: `app/discovery/page.js`
- API: `app/api/*/route.js`
- Shared UI: `components/general/*`
- Firebase setup: `app/firebaseConfig.js` (client) and `app/firebaseAdmin.js` (server)

## Page pattern (gotcha)
Client pages that use hooks or Firebase must include `'use client'`.

## Data model (chat)
Firestore structure:
`conversations/{conversationId}/messages/{messageId}` and `drafts/{userId}`.
Most real-time UI comes from Firestore listeners; no global state library.

Message `attachments` is either `null` or an array of sanitized file-name strings.
Attachment objects live in Cloud Storage at
`conversations/{conversationId}/messages/{messageId}/{fileName}`. Download URLs,
content types, and byte sizes are resolved from Cloud Storage and are never stored
on the Firestore message.

The conversation composer accepts dropped images, videos, and PDFs using the same
upload queue as the file pickers. PDFs require the PDF MIME type and signature
and are limited to 25 MiB. Voice messages are recorded rather than dropped.
Unsupported files and folders are rejected; file drops outside the composer do
not navigate away from the conversation.

## Analytics & errors (gotcha)
Use helpers in `app/utils/analytics.js` so events go to Firebase Analytics and errors to Sentry.

## Env vars (gotcha)
Secrets live only in Vercel. Client Firebase config is currently hardcoded; server credentials still require env vars for local runs.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for CI/CD details.

# API Routes

Routes live in `app/api/*/route.js`.

## POST /api/deadchat
Sends email notifications for inactive chats.

## POST /api/report
Sends a report email when a user reports a message.

## Add a new route
Create `app/api/<name>/route.js` and export the handler (e.g. `POST`).
Client calls must be in `'use client'` components.

# API Routes (short)

Routes live in `app/api/*/route.js`.

## POST /api/deadchat
Sends email about inactive chat (30+ days). Payload has `sender`, `id`, `emailId`, `reason`.
If `reason === "admin"`, `sender` is an array of two users. Email goes to admin (penpal@murphycharity.org); otherwise to the user from Firebase Auth by uid.

## POST /api/report
Sends report email to admin when user reports a message.
Payload includes `receiver_email` (uid), `currentUrl`, `sender` (uid), `excerpt`.

## Add a new route (minimal)
1. Create `app/api/<name>/route.js`.
2. Export a handler:

```js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Client calls must be in `'use client'` components.

## Error logging
Use `logError` from `app/utils/analytics.js` so errors go to Sentry.

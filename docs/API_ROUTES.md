# API Routes

## Overview

API routes are located in `app/api/`. Each file is an HTTP endpoint for handling requests from the frontend.

## POST /api/deadchat

**What it does**: Sends an email notification about an inactive chat

**When it's called**: When users haven't exchanged messages for more than a month

**Request**:
```json
{
  "sender": { "first_name": "John", "last_name": "Doe" },
  "id": "letterbox_id",
  "emailId": {...},
  "reason": "admin"
}
```

If `reason === "admin"`, then `sender` is an array of 2 users:
```json
{
  "sender": [
    { "first_name": "John", "last_name": "Doe" },
    { "first_name": "Jane", "last_name": "Smith" }
  ],
  ...
}
```

**Response** (success):
```json
{ "message": "Email sent successfully!" }
```

**Response** (error):
```json
{ "message": "Failed to send email.", "error": "..." }
```

**Sends email to**:
- If `reason === "admin"` → admin (penpal@murphycharity.org)
- Otherwise → user (gets email from Firebase Auth by uid)

---

## POST /api/report

**What it does**: Sends a report about inappropriate message content

**When it's called**: User clicks "Report" button on a message

**Request**:
```json
{
  "receiver_email": "user_uid",
  "currentUrl": "/letters/123",
  "sender": "user_uid_who_reported",
  "excerpt": "message text"
}
```

**Response** (success):
```json
{ "message": "Email sent successfully!" }
```

**Response** (error):
```json
{ "message": "Failed to send email.", "error": "..." }
```

**Sends email to**: admin (penpal@murphycharity.org)

---

## How to Add a New API Route

1. Create folder in `app/api/[name]/`
2. Create file `route.js`:

```javascript
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Your logic here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

3. Call from frontend:
```javascript
const response = await fetch('/api/[name]', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* data */ })
});
```

## Error Logging

All API routes use `logError` from `app/utils/analytics.js`:

```javascript
import { logError } from "../../utils/analytics";

try {
  // code
} catch (error) {
  logError(error, {
    description: "Something went wrong"
  });
}
```

This sends the error to Sentry for monitoring.

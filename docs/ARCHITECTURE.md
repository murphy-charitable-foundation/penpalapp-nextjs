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
Client pages that call Firebase or analytics must include `'use client'` and usually wrap content with:
`PageBackground` → `PageContainer` → `PageHeader`.

## Data model (chat)
Firestore structure:
`letterboxes/{letterboxId}/messages/{messageId}` and `drafts/{userId}`.
Most real-time UI comes from Firestore listeners; no global state library.

## Analytics & errors (gotcha)
Use helpers in `app/utils/analytics.js` so events go to Firebase Analytics and errors to Sentry.

## Env vars (gotcha)
Secrets live only in Vercel. Local runs require matching env vars.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for CI/CD pipeline details.

---

## Common Workflows

### Adding a New Page

1. Create folder: `app/my-page/`
2. Create `page.js`:
```jsx
'use client';
import { PageContainer, PageHeader, PageBackground } from '@/components/general';
import { usePageAnalytics } from '@/app/useAnalytics';

export default function MyPage() {
  usePageAnalytics('/my-page');
  return (
    <PageBackground>
      <PageContainer>
        <PageHeader title="My Page" />
        {/* Content */}
      </PageContainer>
    </PageBackground>
  );
}
```
3. Add link: `<Link href="/my-page">My Page</Link>`

### Adding a New Component

1. Create file: `components/general/MyComponent.jsx`
2. Export:
```jsx
export default function MyComponent({ prop1, prop2 }) {
  return <div>{prop1}</div>;
}
```
3. Import: `import MyComponent from '@/components/general/MyComponent';`

### Adding a New API Route

1. Create folder: `app/api/my-route/`
2. Create `route.js`:
```js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  // Logic
  return NextResponse.json({ success: true });
}
```
3. Call from frontend:
```js
const response = await fetch('/api/my-route', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data })
});
```

---

## Troubleshooting

### "use client" vs "use server"

- Pages/components using hooks (`useState`, `useEffect`) → `'use client'`
- API routes → Server-side by default (no directive needed)
- Pure server components → No directive needed

### Firebase errors

- **Client**: Check `firebaseConfig.js` has correct env vars
- **Server**: Check `firebaseAdmin.js` has `FIREBASE_ADMIN_SDK_JSON`

### Styling not applying

- Check Tailwind config includes file path
- Restart dev server after config changes
- Use browser DevTools to inspect classes

---

## Further Reading

- [API Routes Documentation](./API_ROUTES.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Firebase Docs](https://firebase.google.com/docs)

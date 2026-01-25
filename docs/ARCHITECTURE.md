# Application Architecture

## Overview

PenPal App is a Next.js 13+ application using the App Router pattern. It connects children in rural Uganda with pen pals around the world through a web-based messaging platform.

## Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Email**: SendGrid
- **Analytics**: Firebase Analytics + Sentry
- **Deployment**: Vercel
- **Styling**: Tailwind CSS

---

## Project Structure

```
penpalapp-nextjs/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes (server-side)
│   │   ├── deadchat/         # Email notifications for inactive chats
│   │   └── report/           # Report inappropriate content
│   ├── about/                # About page
│   ├── change-password/      # Password change flow
│   ├── contact/              # Contact page
│   ├── cover/                # Landing page
│   ├── create-acc/           # Account creation
│   ├── discovery/            # Find new pen pals
│   ├── donate/               # Donation info
│   ├── letterhome/           # Inbox/conversations list
│   ├── letters/[id]/         # Chat/messaging interface
│   ├── login/                # Login page
│   ├── profile/              # User profile editing
│   ├── profile-view/[id]/    # View other users' profiles
│   ├── reset-password/       # Password reset
│   ├── welcome/              # Welcome/onboarding
│   ├── utils/                # Utility functions
│   │   ├── analytics.js      # Firebase Analytics helpers
│   │   ├── deadChat.js       # Inactive chat detection
│   │   ├── firestore.js      # Firestore helpers
│   │   ├── letterboxFunctions.js  # Conversation management
│   │   └── dateHelpers.js    # Date formatting
│   ├── firebaseConfig.js     # Client-side Firebase setup
│   ├── firebaseAdmin.js      # Server-side Firebase Admin
│   ├── useAnalytics.js       # Analytics React hook
│   ├── layout.js             # Root layout (global shell)
│   └── globals.css           # Global styles
├── components/               # Reusable React components
│   ├── bottom-nav-bar/       # Bottom navigation
│   ├── discovery/            # Discovery page components
│   │   ├── KidCard.jsx
│   │   ├── KidFilter.jsx
│   │   ├── KidsList.jsx
│   │   └── SendMessage.jsx
│   ├── general/              # Shared UI components
│   │   ├── BackButton.jsx
│   │   ├── Button.jsx
│   │   ├── Dialog.jsx
│   │   ├── Dropdown.jsx
│   │   ├── Header.jsx
│   │   ├── Input.jsx
│   │   ├── PageBackground.jsx
│   │   ├── PageContainer.jsx
│   │   ├── PageHeader.jsx
│   │   ├── ProfileImage.jsx
│   │   ├── TextArea.jsx
│   │   └── letter/           # Letter/chat components
│   │       ├── LetterCard.jsx
│   │       ├── MessageBubble.jsx
│   │       ├── ProfileHeader.jsx
│   │       └── ReportPopup.jsx
│   ├── loading/              # Loading states
│   │   ├── LoadingSpinner.jsx
│   │   ├── NavigationStateManager.jsx
│   │   └── LetterHomeSkeleton.jsx
│   └── tooltip/              # Tooltips and guides
│       └── FirstTimeChatGuide.jsx
├── public/                   # Static assets
├── docs/                     # Documentation
│   ├── API_ROUTES.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
└── package.json
```

---

## Architecture Patterns

### 1. Page Structure (App Router)

All pages follow this pattern:

```jsx
'use client';

import { PageContainer } from '@/components/general/PageContainer';
import { PageHeader } from '@/components/general/PageHeader';
import { PageBackground } from '@/components/general/PageBackground';
import { usePageAnalytics } from '@/app/useAnalytics';

export default function MyPage() {
  usePageAnalytics('/my-page');
  
  return (
    <PageBackground>
      <PageContainer>
        <PageHeader title="My Page" />
        {/* Page content */}
      </PageContainer>
    </PageBackground>
  );
}
```

**Why this pattern?**
- `PageBackground`: Consistent gray background
- `PageContainer`: Max-width constraint + responsive padding
- `PageHeader`: Logo + title + back button
- `usePageAnalytics`: Tracks page views, load time, dead clicks

### 2. Component Hierarchy

```
PageBackground (bg-gray-100, min-h-screen)
  └─ PageContainer (max-width, padding, centered)
      └─ PageHeader (logo, title, back button)
      └─ Page Content
          └─ Reusable Components (Button, Input, Dialog, etc.)
```

### 3. Firebase Integration

**Client-side** (`firebaseConfig.js`):
- Used in pages marked `'use client'`
- Handles: Auth, Firestore reads, Storage

**Server-side** (`firebaseAdmin.js`):
- Used in API routes
- Handles: Admin operations, user management

### 4. Data Flow

```
User Action (UI)
  ↓
Firebase Firestore (real-time updates)
  ↓
React State (useState/useEffect)
  ↓
UI Re-render
```

Example: Letter/Chat flow
```
1. User opens /letters/[id]
2. Page fetches letterbox from Firestore
3. Real-time listener updates messages
4. State changes trigger re-render
5. MessageBubble components display messages
```

---

## Key Features & Their Implementation

### 1. Messaging System

**Location**: `app/letters/[id]/page.js`

**How it works**:
- Each conversation is a "letterbox" (Firestore document)
- Messages stored in `messages` subcollection
- Real-time updates via Firestore listeners
- Draft messages saved to `drafts` subcollection
- Supports editing, deleting, reporting messages

**Data structure**:
```js
letterboxes/{letterboxId}/
  ├── recipients: [userRef1, userRef2]
  ├── messages/{messageId}
  │   ├── content: string
  │   ├── sender: userRef
  │   ├── timestamp: Date
  │   └── edited: boolean
  └── drafts/{userId}
      └── content: string
```

### 2. Discovery System

**Location**: `app/discovery/page.js`

**How it works**:
- Fetches all users from Firestore
- Filter by: grade, hobbies, location
- Pagination (10 users per page)
- Click "Send Message" → creates letterbox → redirects to chat

**Components**:
- `KidFilter`: Filter UI
- `KidsList`: Grid display
- `KidCard`: Individual user card
- `SendMessage`: Creates connection

### 3. Inbox/Letterhome

**Location**: `app/letterhome/page.js`

**How it works**:
- Fetches all letterboxes where user is a recipient
- Displays: latest message, timestamp, recipient name/photo
- Detects inactive chats (30+ days) → triggers email
- Empty state if no conversations

**Components**:
- `ConversationList`: List of conversations
- `LetterCard`: Individual conversation preview
- `EmptyState`: No conversations UI

### 4. Profile System

**Pages**:
- `/profile` - Edit own profile
- `/profile-view/[id]` - View other user's profile

**Editable fields**:
- Basic: name, age, gender, grade
- Location: country, district, village
- Interests: hobbies, favorite color, subject, food
- About: bio

**Components**:
- `ProfileSection`: Section wrapper
- `InfoDisplay`: Read-only field display
- `Input`, `Dropdown`, `TextArea`: Form fields

### 5. Authentication Flow

```
/cover (landing)
  ↓
/ (login/create account buttons)
  ↓
/login OR /create-acc
  ↓
Firebase Auth
  ↓
/welcome (onboarding)
  ↓
/letterhome (main app)
```

**Protected routes**: Check `auth.currentUser` → redirect to `/login` if null

---

## Component Library

### Layout Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `PageBackground` | Gray background wrapper | `className` |
| `PageContainer` | Max-width + padding | `maxWidth` (sm/md/lg/xl/xxl) |
| `PageHeader` | Logo + title + back button | `title`, `titleColor`, `image`, `heading` |
| `BackButton` | Navigate back | `color`, `textColor`, `size` |

### Form Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `Input` | Text input | `id`, `name`, `value`, `onChange`, `type`, `placeholder` |
| `TextArea` | Multi-line text | `id`, `name`, `value`, `onChange`, `rows` |
| `Button` | Action button | `btnText`, `color`, `onClick`, `disabled` |
| `Dropdown` | Select input | `value`, `onChange`, `options[]` |

### Display Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `Dialog` | Modal popup | `isOpen`, `onClose`, `title`, `description` |
| `ProfileImage` | User avatar | `src`, `alt`, `size` |
| `MessageBubble` | Chat message | `message`, `isSender`, `onEdit`, `onDelete` |
| `LetterCard` | Conversation preview | `letterbox`, `recipient`, `latestMessage` |

### Loading Components

| Component | Purpose |
|-----------|---------|
| `LoadingSpinner` | Full-screen spinner |
| `NavigationStateManager` | Shows spinner during route transitions |
| `LetterHomeSkeleton` | Skeleton for inbox loading |
| `LettersSkeleton` | Skeleton for chat loading |

---

## State Management

No global state library (Redux/Zustand) is used. State is managed locally:

- **Local state**: `useState` for component-specific data
- **Firebase listeners**: Real-time updates for messages, letterboxes
- **URL params**: `useParams()` for dynamic routes (e.g., `/letters/[id]`)
- **Navigation**: `useRouter()` for programmatic navigation

---

## Styling System

**Tailwind CSS** is used throughout with custom colors:

```js
// tailwind.config.js
{
  colors: {
    'primary': '#034792',      // Blue
    'dark-green': '#4E802A',   // Green
  }
}
```

**Common patterns**:
- `bg-gray-100` - Page backgrounds
- `bg-white` - Card backgrounds
- `text-blue-600` - Headings
- `rounded-xl` - Cards
- `shadow-lg` - Card shadows
- `p-4`, `p-6` - Padding
- `mb-4`, `mt-4` - Margins

---

## Analytics & Monitoring

### Page Analytics (`usePageAnalytics`)

Tracks for every page:
- Page views
- Time spent on page
- Dead clicks (clicks on non-interactive elements)
- Large Contentful Paint (LCP)

### Event Tracking

```js
import { logButtonEvent } from '@/app/utils/analytics';

<Button onClick={() => logButtonEvent('login_clicked', '/login')} />
```

### Error Tracking

- **Firebase Analytics**: Custom error events
- **Sentry**: Full error reporting with stack traces
- **Global error boundary**: Catches unhandled errors

---

## User Roles

1. **Pen Pal** (default)
   - Can message other users
   - View profiles
   - Edit own profile

2. **Admin** (identified in code)
   - Receives email notifications for:
     - Inactive chats
     - Reported messages

---

## Security

- **Authentication**: Firebase Auth (email/password)
- **Authorization**: Firestore rules (not in this codebase)
- **API routes**: Server-side only (Next.js API routes)
- **Environment variables**: Stored in Vercel, not in code

---

## Performance Optimizations

- **Image optimization**: Next.js `<Image>` component
- **Code splitting**: Automatic with Next.js App Router
- **Firebase caching**: Client-side SDK caches reads
- **Pagination**: Discovery page loads 10 users at a time
- **Lazy loading**: Components load on demand

---

## Deployment

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

# 📊 Creating Custom Reports
## 1. Navigate to Explorations

1. Sign in to [Google Analytics](https://analytics.google.com).
2. In the left-hand menu, go to Explore → this is where you build custom reports.

## 2. Choose an Exploration Type
GA4 offers several report “templates” to start from:

- **Free form** → flexible table where you choose dimensions & metrics.
- **Funnel exploration** → see how users move through steps (e.g. checkout flow).
- **Path exploration** → view navigation paths users take.
- **Segment overlap** → compare how different user groups overlap.
- **Cohort exploration** → analyze groups of users over time.
- **User explorer** → drill into individual user journeys.
- **User lifetime** → analyze user behavior and value over time.

👉 For most “custom dashboards,” **Free Form** is the best starting point.

## 3. Add Dimensions and Metrics

- **Dimensions** = descriptive attributes (page path, device, country, event name).
- **Metrics** = numeric values (views, conversions, revenue, engagement time).

Steps:

1. In the **Variables** panel, click the “+” to import dimensions/metrics you want.
2. Drag them into **Rows** (for dimensions) and **Values** (for metrics).

Example:

- Rows → `page_path`
- Values → `event_count`, `users`

This would give you a custom table showing how many users triggered events on each page.

## 4. Apply Filters or Segments

- Use **Filters** to restrict the data (e.g., only `page_path` = `/donate`).
- Add **Segments** to compare groups (e.g., mobile vs desktop users).

## 5. Save and Share

- Your custom report is saved under **Explorations**.
- You can **share** it with others in the GA4 property (they’ll see it under their Explore tab).

---

# Analytics Tracking

This module provides utilities for tracking user interactions, errors, and performance metrics in a **Next.js + Firebase Analytics** application.  
It consists of two main files:

- [`useAnalytics.js`](./useAnalytics.js) — React hooks and global trackers for page analytics, connectivity, and error logging.
- [`analytics.js`](./utils/analytics.js) — Utility functions that send events to Firebase Analytics (and Sentry for error monitoring).

---

## 📊 Features

- Page view tracking (with time spent on page)
- Dead click detection (clicks on non-interactive elements)
- Button click tracking
- Login event tracking
- Page load performance metrics (LCP)
- Error monitoring (uncaught errors & unhandled promises)
- Internet connectivity tracking (offline/online events)
- Sentry integration for debugging

---

## 🔧 Adding More Analytics

Our project uses **Firebase Analytics** to track events. Most logging should be done through the **wrapper functions** defined in `analytics.js`. This ensures events are logged consistently and makes it easier to update logging logic in one place.

### 1. Using Existing Logging Functions
Whenever possible, call the appropriate wrapper function instead of calling Firebase directly.  
Example:

```jsx
import { logInEvent } from "@/utils/analytics";

logInEvent("success", "User logged in via Google");
```

**This approach:**
- **Keeps event names consistent**
- **Ensures required parameters are always included**
- **Makes analytics easier to maintain over time**

### 2. Logging a New Event (Directly)
If a wrapper function does not exist for your use case, you can log directly with Firebase:

```jsx
import { logEvent } from "firebase/analytics";
import { analytics } from "@/firebaseConfig";

logEvent(analytics, "event_name", {
  param1: "value1",
  param2: "value2"
});
```

### 3. Adding a New Wrapper Function (Recommended)
If you find yourself reusing the same event multiple times, add a new wrapper in `analytics.js`:

```jsx
// analytics.js
import { logEvent } from "firebase/analytics";
import { analytics } from "@/firebaseConfig";

export function logDonationSubmitted(amount, method) {
  logEvent(analytics, "donation_submitted", {
    amount,
    method,
  });
}
```

Then call it throughout the codebase:

```jsx
logDonationSubmitted(50, "credit_card");
```

---

## 📂 File: `useAnalytics.js`

### `usePageAnalytics(pagePath)`
React hook to track analytics for a given page.

**What it tracks:**
- Page views and time spent on the page
- Dead clicks (clicks on `<div>`, `<p>`, `<img>`, etc.)
- Large Contentful Paint (LCP) for load time performance

**Example:**

```jsx
import { usePageAnalytics } from "./useAnalytics";

export default function DonatePage() {
  usePageAnalytics("/donate");

  return (
    <div>
      <h1>Donate</h1>
      {/* Page content */}
    </div>
  );
}
```

### `GlobalTracker`
Singleton class that handles global error and connectivity tracking.

- Errors: Captures uncaught errors & unhandled promise rejections.
- Connectivity: Logs disconnection duration and reconnection events.

**Example:**

```jsx
import { globalTracker } from "./useAnalytics";

// already initialized globally
```

## 📂 File: `analytics.js`
Utility functions for sending events to Firebase Analytics.
All functions use `logEvent` under the hood and require Firebase to be initialized.

### `logPageView(pagePath, viewTime)`
Logs a page view with time spent (in seconds).

**Example:**

```jsx
logPageView("/donate", 45); // user spent 45s on /donate
```

### `logButtonEvent(buttonName, pagePath)`
Logs when a button is clicked.

**Example:**

```jsx
<Button
  btnText="Make a Donation"
  onClick={() =>
    logButtonEvent("make donation button clicked", "/donate")
  }
/>
```

### `logInEvent(status, message)`
Logs login status.

**Example:**

```jsx
logInEvent("success", "User logged in via Google");
```

### `logError(error, errorInfo)`
Logs an error to Firebase and Sentry.

**Example:**

```jsx
try {
  throw new Error("Something went wrong");
} catch (err) {
  logError(err, { context: "donate_page" });
}
```

### `logDeadClick(x, y, elementClicked, pagePath)`
Logs a "dead click" on non-interactive elements.

**Example:**

```jsx
logDeadClick(200, 350, "DIV", "/donate");
```

### `logInternetDisconnection(duration, reconnected)`
Logs internet disconnection or reconnection.

**Example:**
```jsx
// User disconnected for 15 seconds
logInternetDisconnection(15, true);
```

### `logLoadingTime(pagePath, loadingTime)`
Logs page loading performance (LCP metric).

**Example:**
```jsx
logLoadingTime("/donate", 1234); // 1234ms
```

## 🚀 Example Workflow
On /donate page:

1. `usePageAnalytics("/donate")` logs page views, load times, and dead clicks.

2. A "Make a Donation" button uses `logButtonEvent` to track clicks.

3. If the page throws an error, `GlobalTracker` logs it to Firebase + Sentry.

4. If the user goes offline, `logInternetDisconnection` records duration.

## 📌 Notes
- All events are logged to Firebase Analytics.
- Errors are also reported to Sentry for debugging.
- usePageAnalytics should be called once per page inside the page component.

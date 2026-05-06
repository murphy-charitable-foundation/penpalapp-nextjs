# Firebase Notification System

## Overview

This project implements a push notification system using **Firebase Cloud Messaging (FCM)** for the Letterbox messaging feature. The system allows users in a conversation to receive notifications when new messages are sent.

The notification system has three primary responsibilities:

1. **Client Initialization**
   - Ensures the browser supports service workers.
   - Initializes Firebase messaging on the client.

2. **Notification Setup**
   - Registers a user's device with Firebase Cloud Messaging.
   - Stores the device's FCM token in Firestore.

3. **Notification Dispatch**
   - Sends notifications to all members of a conversation except the sender.

The system uses:

- **Firebase Admin SDK** for server-side operations
- **Firestore** for user and conversation data
- **Firebase Authentication** for request verification
- **Firebase Cloud Messaging (FCM)** for push notifications

---

# Architecture

The notification system consists of three main components:

Client Initialization  
↓  
Token Registration API  
↓  
Notification Send API

### Flow Summary

1. The client initializes notifications when the application loads.
2. The client retrieves an **FCM token** from Firebase.
3. The token is sent to the server and stored in the user document.
4. When a message is sent, the server:
   - verifies the sender
   - confirms they belong to the conversation
   - fetches FCM tokens for all other members
   - sends notifications via Firebase Cloud Messaging.

---

# Client Notification Initialization

The client calls `initializeNotifications()` which:

1. Checks if the browser supports **service workers**.
2. Calls `handleNotificationSetup()` from `firebaseConfig`.
3. Logs an error if registration fails.

Service workers are required for push notifications because they allow messages to be received even when the browser tab is inactive.

---

# Notification Setup API

Route:
```

/api/setupNotifications

```

## Purpose

This endpoint registers a user's **device token** so that notifications can be delivered to that device.

## Request Body

```

{
"idToken": "firebase-auth-token",
"fcmToken": "device-token"
}

```

### Fields

idToken  
Firebase authentication token used to verify the user.

fcmToken  
Firebase Cloud Messaging token that identifies the user's device.

---

## Process

1. Verify required Firebase environment variables exist.
2. Verify the Firebase ID token.
3. Extract the user's UID.
4. Look up the user's document in Firestore.
5. Store the `fcmToken` in the user document.

The token is saved using a merge operation to avoid overwriting other fields.

---

# Notification Sending API

This API sends push notifications to conversation participants.

## Authentication

Requests must include an Authorization header:

```

Authorization: Bearer <firebase-id-token>

```

The token is verified using Firebase Admin authentication before any notification is sent.

---

## Request Body

```

{
"conversationId": "conversation-id",
"message": "optional message text"
}

```

### Fields

conversationId  
The ID of the conversation in the `letterbox` collection.

message  
Optional notification body text.

---

## Process

The notification sending process follows these steps:

### 1. Environment Validation

The server checks for required Firebase credentials:

- FIREBASE_CONFIG
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL

If any are missing, the request fails.

---

### 2. Authentication

The Firebase ID token from the request header is verified.  
The decoded token provides the sender's UID.

---

### 3. Conversation Authorization

The server confirms the sender belongs to the conversation by checking the `members` array in the `letterbox` document.

If the sender is not a member, the request is rejected.

---

### 4. Token Retrieval

The server fetches all users in the conversation except the sender.

For each user:

1. Their user document is loaded from the `users` collection.
2. Their stored `fcmToken` is retrieved.
3. Valid tokens are added to a list of recipients.

---

### 5. Notification Delivery

For each token, Firebase Cloud Messaging sends a notification containing:

Title:
```

New Letterbox Message

```

Body:
- The provided message text, or
- A fallback message.

Notifications are sent in parallel using `Promise.all()`.

Each send operation returns a success or failure result.

---

# Firebase Initialization

Both API routes initialize Firebase Admin with a service account.

Initialization only occurs if:

- Environment variables are valid
- Firebase has not already been initialized

This prevents duplicate initialization errors in server environments.

---

# Firestore Structure

## Users Collection

```

users/{uid}

```

Example document:

```

{
"first_name": "Jane",
"last_name": "Smith",
"fcmToken": "DEVICE_FCM_TOKEN"
}

```

The `fcmToken` identifies the device used for notifications.

---

## Letterbox Conversations

```

letterbox/{conversationId}

```

Example document:

```

{
"members": [
{ "id": "user1" },
{ "id": "user2" }
]
}

```

The `members` array determines who should receive notifications.

---

# Error Handling

The APIs return appropriate HTTP responses for common failure cases:

| Scenario | Response |
|--------|--------|
| Missing environment variables | 500 |
| Missing authorization header | 401 |
| Invalid authentication token | 403 |
| User not in conversation | 403 |
| Missing request fields | 400 |
| Internal processing failure | 500 |

Notification sends return status **207 (Multi-Status)** when some notifications succeed while others fail.

---

# Security Considerations

The system enforces several security protections:

Authentication  
All protected endpoints require a verified Firebase ID token.

Authorization  
Users can only send notifications for conversations they belong to.

Credential Protection  
Firebase credentials are stored in environment variables and never exposed to the client.

---

# Summary

The notification system enables real-time messaging alerts by:

1. Registering user devices with Firebase Cloud Messaging.
2. Storing device tokens in Firestore.
3. Verifying senders and conversation membership.
4. Delivering push notifications to all conversation participants except the sender.

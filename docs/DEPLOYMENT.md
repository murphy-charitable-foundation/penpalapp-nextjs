# Deployment (short)

GitHub Actions builds; Vercel deploys.

## Triggers
- Any push → preview deployment
- Push to `main` → production
- PR to `main` → preview + deployment card in PR

## Pipeline (high-level)
1) `vercel pull` → 2) `vercel build` → 3) `vercel deploy --prebuilt`.

## Env vars (gotcha)
Stored only in Vercel and pulled during CI. Local runs require matching vars.
Public: `NEXT_PUBLIC_*` Firebase keys. Private: `SENDGRID_KEY`, `FIREBASE_ADMIN_SDK_JSON`, `SENTRY_AUTH_TOKEN`.

## Preview link (where to find)
In the PR, GitHub shows a deployment card with **View deployment**.

![Deployment Card Example](./deployment-card.png)

## If it fails
Check Actions logs, fix, push again.

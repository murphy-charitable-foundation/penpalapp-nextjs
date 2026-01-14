# Deployment

## How It Works

GitHub Actions builds the application → Vercel deploys it.

**Triggers**:
- Any push → preview deployment on Vercel
- Push to main → production deployment on Vercel
- PR to main → preview with deployment card in PR

## Pipeline

```
1. Checkout code
2. Setup Node.js v20
3. vercel pull (download config and env variables)
4. vercel build (build Next.js to .vercel/output)
5. vercel deploy --prebuilt (upload artifact to Vercel)
6. Create Deployment Card in GitHub
```

## Environment Variables

Stored in Vercel, automatically downloaded.

**Public** (visible in code):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
... (and other FIREBASE variables)
```

**Private** (server only):
```
SENDGRID_KEY
FIREBASE_ADMIN_SDK_JSON
SENTRY_AUTH_TOKEN
```

## Production vs Preview

| | Main | Other branches |
|---|---|---|
| Build | `vercel build --prod` | `vercel build` |
| Deploy | `--prebuilt --prod` | `--prebuilt` |
| URL | Production | Preview |

## Track Deployment

1. **GitHub Actions** → Actions → latest run
2. **Vercel** → https://vercel.com → Deployments
3. **PR** → deployment card with preview URL at bottom

## If Deployment Fails

1. Check error in Actions logs
2. Fix the code
3. Push → deployment runs again automatically

# PenPal App

A Next.js application for connecting pen pals through letters. Built with Firebase, Firestore, and deployed on Vercel.

## Documentation

For detailed information about the project architecture, API routes, and deployment, see the [docs](./docs) folder:
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Application architecture and component organization
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - How the app is built and deployed
- [API_ROUTES.md](./docs/API_ROUTES.md) - API endpoints documentation

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Note / Request:
We’re planning to update PageBackground and PageContainer soon. To avoid unintended layout or styling changes across pages, please do not modify or override these shared components for now.

Until the update is completed, pages should simply import and use them as-is, without applying page-specific styling to these layout primitives.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8e4204152fca1a516844d444ebefdd57@o4507024374890496.ingest.us.sentry.io/4507024376856576",
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,
  // Setting debug to true will print additional setup information to the console
  debug: false,
  // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',
});

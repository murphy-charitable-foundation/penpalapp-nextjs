import { randomUUID } from "node:crypto";
import { buildErrorEvent } from "./errorEvent.mjs";

/**
 * Server-only diagnostics. Full details stay in access-controlled server logs;
 * optional GA4 delivery contains fixed categories and a random correlation ID.
 * In particular, authenticated UIDs and content-derived hashes are not sent.
 */
export async function logError(error, errorInfo = {}) {
  const event = buildErrorEvent(error, { source: "server" });
  if (!event) return;

  const eventId = randomUUID();
  console.error("Server error", { eventId, error, errorInfo });

  const measurementId = process.env.GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;
  if (!measurementId || !apiSecret) return;

  const url = new URL("https://www.google-analytics.com/mp/collect");
  url.searchParams.set("measurement_id", measurementId);
  url.searchParams.set("api_secret", apiSecret);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: eventId,
        events: [{
          name: "uncaught_error",
          params: {
            ...event,
            error_source_type: "server",
            error_event_id: eventId,
            engagement_time_msec: 1,
          },
        }],
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      console.error("Server analytics request failed with status", response.status);
    }
  } catch {
    // Fetch errors may include the request URL and its API secret.
    console.error("Server analytics request failed or timed out.");
  }
}

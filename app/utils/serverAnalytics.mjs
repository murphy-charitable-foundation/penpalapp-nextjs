import { randomUUID } from "node:crypto";
import { buildErrorEvent } from "./errorEvent.mjs";

/**
 * Report a server error to logs and, when configured, GA4 Measurement Protocol.
 * userId must be an authenticated Firebase UID, not request-provided identity.
 */
export async function logError(error, errorInfo = {}) {
  const { userId, ...info } = errorInfo || {};
  const event = buildErrorEvent(error, info, "unknown");
  if (!event) return;

  const eventId = randomUUID();
  console.error("Server error", { eventId, userId, error, errorInfo: info });

  const measurementId = process.env.GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;
  if (!measurementId || !apiSecret) {
    console.warn("Server analytics not sent: GA_MEASUREMENT_ID or GA_API_SECRET is missing.");
    return;
  }

  // Error text and arbitrary context can contain personal data. Keep those in
  // server logs and send only fixed, non-content metadata to GA.
  const params = {
    error_name: "ServerError",
    error_message: "See server logs",
    error_description: "See server logs",
    error_source: "handled",
    error_source_type: "server",
    error_code: "See server logs",
    error_stack: "See server logs",
    error_file: "See server logs",
    error_line: event.error_line,
    error_column: event.error_column,
    error_function: "See server logs",
    error_page_path: "unknown",
    error_online: 1,
    error_fingerprint: event.error_fingerprint,
    error_event_id: eventId,
    engagement_time_msec: 1,
  };
  const url = new URL("https://www.google-analytics.com/mp/collect");
  url.searchParams.set("measurement_id", measurementId);
  url.searchParams.set("api_secret", apiSecret);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: eventId,
        ...(userId ? { user_id: userId } : {}),
        events: [{ name: "uncaught_error", params }],
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      console.error("Server analytics request failed with status", response.status);
    }
  } catch {
    // Do not log the request error: it can contain the URL and API secret.
    console.error("Server analytics request failed or timed out.");
  }
}

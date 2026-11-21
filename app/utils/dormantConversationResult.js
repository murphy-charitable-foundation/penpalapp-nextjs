export const ATTEMPT_TIMESTAMP_KEY = "dormantConversationAttemptTimestamp";
// The legacy dormantConversationTimestamp was also written by the mock worker.
const LIVE_SUCCESS_KEY = "dormantConversationLiveSuccess.v1";
const HOUR_MS = 60 * 60 * 1000;

function withinCooldown(storage, key, now, duration) {
  const value = storage.getItem(key);
  if (!value) return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    storage.removeItem(key);
    return false;
  }
  return now - timestamp < duration;
}

export function canStartDormantConversationCheck(storage, now = Date.now()) {
  return !withinCooldown(storage, ATTEMPT_TIMESTAMP_KEY, now, HOUR_MS) &&
    !withinCooldown(storage, LIVE_SUCCESS_KEY, now, 28 * 24 * HOUR_MS);
}

/** Apply a worker result without putting reminder payloads into error logs. */
export function handleDormantConversationResult(
  result,
  { storage, logError, logDormantMessageSent, now = () => new Date() }
) {
  const data = result?.data;
  const complete = result?.success === true &&
    Array.isArray(data?.successEmails) &&
    Array.isArray(data?.failedEmails) &&
    data.failedEmails.length === 0 &&
    data.success !== false;

  if (complete) {
    storage.setItem(LIVE_SUCCESS_KEY, now().toISOString());
  }

  // Successful reminders are already marked on the server, including those in
  // a partially failed batch. Only their category belongs in this event.
  if (Array.isArray(data?.successEmails)) {
    for (const reminder of data.successEmails) {
      if (reminder?.success === true) {
        logDormantMessageSent(reminder.reason);
      }
    }
  }

  if (!complete) {
    const workerError = new Error(result?.error || "Dormant reminder batch incomplete");
    if (result?.errorName) workerError.name = result.errorName;
    if (result?.errorStack) workerError.stack = result.errorStack;
    workerError.code = result?.errorCode || "partial-failure";
    logError(workerError, {
      description: "Web Worker OnMessage Email Request Error",
      source: "web_worker",
      error_stage: result?.stage || "response",
    });
  }

  return complete;
}

// GA receives only these fixed categories. Messages, stack traces, paths,
// descriptions, user identifiers, and arbitrary context never cross this boundary.
const ERROR_NAMES = new Set([
  "Error", "TypeError", "RangeError", "ReferenceError", "SyntaxError",
  "URIError", "EvalError", "AggregateError", "AbortError", "TimeoutError",
  "NotAllowedError", "NotFoundError", "NotSupportedError", "SecurityError",
  "QuotaExceededError", "NetworkError", "InvalidStateError", "FirebaseError",
]);

const ERROR_CODES = new Set([
  "auth/email-already-in-use", "auth/invalid-credential", "auth/invalid-email",
  "auth/network-request-failed", "auth/operation-not-allowed",
  "auth/popup-blocked", "auth/popup-closed-by-user", "auth/requires-recent-login",
  "auth/too-many-requests", "auth/user-disabled", "auth/user-not-found",
  "auth/weak-password", "auth/wrong-password", "auth/id-token-expired",
  "auth/id-token-revoked", "auth/argument-error",
  "permission-denied", "unauthenticated", "unavailable", "deadline-exceeded",
  "resource-exhausted", "failed-precondition", "not-found", "already-exists",
  "aborted", "cancelled", "invalid-argument", "internal", "unknown",
  "storage/unauthorized", "storage/canceled", "storage/retry-limit-exceeded",
  "storage/quota-exceeded", "storage/object-not-found", "storage/unknown",
  "no-auth-token", "network-error", "invalid-response", "http-error",
  "partial-failure",
]);

const ERROR_SOURCES = new Set([
  "handled", "window.onerror", "unhandled_rejection", "web_worker",
  "react_boundary", "server",
]);

function readProperty(value, key) {
  try {
    return value?.[key];
  } catch {
    // A thrown value can be a proxy or have getters that themselves throw.
    return undefined;
  }
}

function isError(value) {
  try {
    return value instanceof Error;
  } catch {
    return false;
  }
}

/** Normalize browser events and arbitrary thrown values for local diagnostics. */
export function normalizeError(input) {
  let value = input;
  let sourceType = isError(input) ? "error" : typeof input;
  if (!isError(input) && input && typeof input === "object") {
    const nested = readProperty(input, "error") ?? readProperty(input, "reason");
    if (nested !== undefined && nested !== input) value = nested;
    const type = readProperty(input, "type");
    if (type === "error") sourceType = "error_event";
    if (type === "unhandledrejection") sourceType = "promise_rejection";
  }

  if (isError(value)) return { error: value, sourceType };

  const message = typeof value === "string" ? value : readProperty(value, "message");
  const error = new Error(typeof message === "string" ? message : "Unknown error");
  for (const key of ["name", "code", "digest"]) {
    const field = readProperty(value, key);
    if (typeof field === "string") error[key] = field;
  }
  return { error, sourceType };
}

function isControlFlowError(error) {
  const digest = readProperty(error, "digest");
  return (
    readProperty(error, "message") === "NEXT_REDIRECT" ||
    (typeof digest === "string" && (
      digest === "NEXT_REDIRECT" || digest.startsWith("NEXT_REDIRECT;") ||
      digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_NOT_FOUND;") ||
      /^NEXT_HTTP_ERROR_FALLBACK;(401|403|404)$/.test(digest)
    ))
  );
}

export function buildErrorEvent(input, errorInfo = {}) {
  const { error, sourceType } = normalizeError(input);
  if (isControlFlowError(error)) return null;

  const name = readProperty(error, "name");
  const code = readProperty(error, "code");
  const source = readProperty(errorInfo, "source");
  return {
    error_name: ERROR_NAMES.has(name) ? name : "Error",
    error_code: ERROR_CODES.has(code) ? code : "unknown",
    error_source: ERROR_SOURCES.has(source) ? source : "handled",
    error_source_type: sourceType,
  };
}

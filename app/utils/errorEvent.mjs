const truncate = (value, max = 100) => String(value ?? "").substring(0, max);

const isControlFlowError = (error) => {
  const digest = typeof error?.digest === "string" ? error.digest : "";
  return (
    error?.message === "NEXT_REDIRECT" ||
    digest.startsWith("NEXT_REDIRECT") ||
    digest.startsWith("NEXT_NOT_FOUND") ||
    digest === "NEXT_HTTP_ERROR_FALLBACK;404"
  );
};

export const normalizeError = (input) => {
  if (input instanceof Error) {
    return { error: input, sourceType: "Error", location: {} };
  }
  if (typeof input === "string") {
    return { error: new Error(input), sourceType: "string", location: {} };
  }
  if (input && typeof input === "object") {
    const sourceType = input.constructor?.name || "object";
    const inner = input.error instanceof Error ? input.error : input.reason;
    if (inner instanceof Error) {
      return { error: inner, sourceType: `${sourceType}>Error`, location: {} };
    }
    const error = new Error(
      input.message ||
        (typeof inner === "string" ? inner : "") ||
        `Non-Error ${sourceType} reported`
    );
    if (input.name && input.name !== "Error") error.name = String(input.name);
    if (input.code) error.code = input.code;
    return {
      error,
      sourceType,
      location: {
        error_file: input.filename ? String(input.filename).split("/").pop().split("?")[0] : undefined,
        error_line: input.lineno,
        error_column: input.colno,
      },
    };
  }
  return { error: new Error("Unknown error"), sourceType: typeof input, location: {} };
};

const parseStackFrame = (stack) => {
  if (!stack || typeof stack !== "string") return {};
  const frameRegex =
    /(?:at\s+(?:(?<fn>[^\s(]+)\s+\()?|(?<fn2>[^\s@]*)@)(?<url>[^\s()]+?):(?<line>\d+):(?<col>\d+)\)?\s*$/;
  for (const raw of stack.split("\n")) {
    const line = raw.trim();
    if (!line || line.includes("analytics.js") || line.includes("errorEvent.mjs") || line.includes("serverAnalytics.mjs")) continue;
    const match = line.match(frameRegex);
    if (!match?.groups) continue;
    const { fn, fn2, url, line: ln, col } = match.groups;
    return {
      error_file: url.split("/").pop().split("?")[0],
      error_line: parseInt(ln, 10),
      error_column: parseInt(col, 10),
      error_function: fn || fn2 || "anonymous",
    };
  }
  return {};
};

const fingerprint = (...parts) => {
  let h = 5381;
  for (const ch of parts.join("|")) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
};

const getErrorCode = (error) => {
  if (error?.code) return String(error.code);
  const m = /\(([a-z-]+\/[a-z0-9-]+)\)/i.exec(error?.message || "");
  return m ? m[1] : "";
};

export function buildErrorEvent(input, errorInfo = {}, pagePath = "unknown") {
  const { error, sourceType, location } = normalizeError(input);
  if (isControlFlowError(error)) return null;

  const { description, source, ...extra } = errorInfo || {};
  const frame = { ...parseStackFrame(error.stack) };
  for (const [k, v] of Object.entries(location)) {
    if (v !== undefined && !frame[k]) frame[k] = v;
  }
  const message = error.message || "No message";
  const name = error.name || "Unknown";
  return {
    error_name: truncate(name),
    error_message: truncate(message),
    error_description: truncate(description || "none"),
    error_source: truncate(source || "handled"),
    error_source_type: truncate(sourceType),
    error_code: truncate(getErrorCode(error) || "none"),
    error_file: truncate(frame.error_file || "unknown"),
    error_line: frame.error_line || 0,
    error_column: frame.error_column || 0,
    error_function: truncate(frame.error_function || "unknown"),
    error_stack: truncate(error.stack || "No stack trace"),
    error_page_path: truncate(pagePath),
    error_online: typeof navigator !== "undefined" ? navigator.onLine : true,
    error_fingerprint: fingerprint(name, message.replace(/\d+/g, "#"), frame.error_file, frame.error_line),
    ...extra,
  };
}

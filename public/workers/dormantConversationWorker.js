self.onmessage = async function (event) {
  try {
    const idToken = event.data?.idToken;
    if (typeof idToken !== "string" || !idToken.trim()) {
      throw requestError("No auth token", "no-auth-token", "auth");
    }
    const data = await sendDormantConversation(idToken);
    self.postMessage({ success: true, data });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message,
      errorName: error.name,
      errorStack: error.stack,
      errorCode: error.code,
      stage: error.stage,
      httpStatus: error.httpStatus,
      // A failed batch can still contain successful sends. Keep their analytics
      // without treating the entire batch as complete or logging the payload.
      data: error.data,
    });
  }
};

function requestError(message, code, stage, httpStatus, data) {
  const error = new Error(message);
  error.code = code;
  error.stage = stage;
  error.httpStatus = httpStatus;
  error.data = data;
  return error;
}

async function sendDormantConversation(idToken) {
  let response;
  try {
    response = await fetch("/api/dormantConversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });
  } catch {
    throw requestError("Dormant reminder request failed", "network-error", "request");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    // JSON parser errors can include response contents. Never put those contents
    // in the error forwarded to client logging/analytics.
    const code = response.ok ? "invalid-response" : "http-error";
    throw requestError(
      "Dormant reminder response could not be read",
      code,
      "response",
      response.status
    );
  }

  if (!response.ok) {
    throw requestError(
      `Dormant reminder request failed (HTTP ${response.status})`,
      "http-error",
      "response",
      response.status,
      data
    );
  }

  if (
    !data ||
    !Array.isArray(data.successEmails) ||
    !Array.isArray(data.failedEmails)
  ) {
    throw requestError("Invalid dormant reminder response", "invalid-response", "response");
  }

  // Defend against an older API deployment returning HTTP 200 for partial work.
  if (data.failedEmails.length > 0 || data.success === false) {
    throw requestError(
      "Some dormant reminders failed",
      "partial-failure",
      "response",
      response.status,
      data
    );
  }

  return data;
}

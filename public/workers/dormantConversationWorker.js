self.onmessage = async function (e) {
  const idToken = e.data?.idToken;
  if (!idToken) {
    self.postMessage({ success: false, error: "No auth token" });
    return;
  }
  try {
    const data = await sendDormantConversation(idToken);
    self.postMessage({ success: true, data });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error?.message || String(error),
      errorName: error?.name,
      errorStack: error?.stack,
      stage: "sendDormantConversation/parse",
    });
  }
};

async function sendDormantConversation(idToken) {
  const response = await fetch("/api/dormantConversation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

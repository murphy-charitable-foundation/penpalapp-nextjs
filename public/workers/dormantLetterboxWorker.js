self.onmessage = async function (e) {
  const idToken = e.data?.idToken;
  if (!idToken) {
    self.postMessage({ success: false, error: "No auth token" });
    return;
  }
  try {
    const result = await sendDormantLetterbox(idToken);
    const data = await result.json();
    self.postMessage({ success: true, data });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

async function sendDormantLetterbox(idToken) {
  const response = await fetch("/api/dormantletterbox", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;
}

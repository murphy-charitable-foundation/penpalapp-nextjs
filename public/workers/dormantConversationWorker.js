self.onmessage = async function (e) {
  const idToken = e.data?.idToken;
  if (!idToken) {
    self.postMessage({ success: false, error: "No auth token" });
    return;
  }
  try {
    const result = await sendDormantConversation(idToken);
    const data = await result.json();
    self.postMessage({ success: true, data });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

async function sendDormantConversation(idToken) {
  /*const response = await fetch("/api/dormantConversation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response;*/
  return {
    success: true,
    data: {
      message: "Dormant conversation worker is working",
    },
  };
}

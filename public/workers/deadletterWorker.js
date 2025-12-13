self.onmessage = async function () {
  try {
    const result = await sendDeadletter();
    const data = await result.json();
    self.postMessage({ success: true, data });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

async function sendDeadletter() {
  const response = await fetch("/api/deadchat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}

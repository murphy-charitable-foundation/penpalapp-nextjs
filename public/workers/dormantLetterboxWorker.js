self.onmessage = async function () {
  try {
    const result = await sendDormantLetterbox();
    const data = await result.json();
    self.postMessage({ success: true, data });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

async function sendDormantLetterbox() {
  const response = await fetch("/api/dormantletterbox", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}

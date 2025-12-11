const generateDeadletterEmailTemplate = (message) => {
  const emailHtml = `
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f9f9f9;
                  margin: 0;
                  padding: 0;
                }
                .email-container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  color: #333;
                  font-size: 24px;
                }
                p {
                  color: #555;
                  font-size: 16px;
                  line-height: 1.5;
                }
                .message-content {
                  font-style: italic;
                  color: #666;
                  margin-top: 20px;
                }
                footer {
                  margin-top: 30px;
                  font-size: 12px;
                  color: #999;
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <h1>Chat Found Inactive</h1>
                <p><strong>Reported Message:</strong></p>
                <p class="message-content">${
                  message || "No message provided."
                }</p>
                <footer>
                  <p>This email was sent from your report system. If you have any questions, please contact us.</p>
                </footer>
              </div>
            </body>
          </html>
        `;

  return emailHtml;
};

export default generateDeadletterEmailTemplate;

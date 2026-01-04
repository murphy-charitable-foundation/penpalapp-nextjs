const generateDormantLetterboxEmailTemplate = ({
  baseUrl,
  to,
  message,
  letterboxId,
}) => {
  const emailHtml = `
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body {
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                background-color: #ffffff;
                margin: 0;
                padding: 0;
                color: #000000;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .header-logo {
                font-size: 14px;
                font-weight: bold;
                color: #004a99; /* Approximate Blue */
                margin-bottom: 40px;
                display: flex;
                align-items: center;
              }
              .header-logo img {
                height: 34px;
              }
              .header-title {
                display: flex;
                flex-direction: column;
              }
              .header-title h1 {
                margin: 0;
                font-size: 10px;
              }
              .header-subtitle {
                display: flex;
                gap: 4.5px;
              }
              .header-subtitle .line {
                flex-grow: 1;
                border-bottom: 1.5px solid #67b32e;
                position: relative;
                top: -5px;
              }
              h1 {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 25px;
              }
              p {
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 20px;
              }
              .button-container {
                text-align: center;
                margin: 40px 0;
              }
              .button {
                background-color: #55832f; /* The specific green from image */
                color: #ffffff !important;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                display: inline-block;
              }
              .footer {
                margin-top: 50px;
                border-top: 1px solid #e0e0e0;
                padding-top: 20px;
                font-size: 13px;
                color: #000000;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header-logo">
                <img src="${baseUrl}/murphylogo.png" alt="Logo" />
                <div class="header-title">
                  <h1>MURPHY CHARITABLE FOUNDATION UGANDA</h1>
                  <div class="header-subtitle">
                    <span style="color: #79a43a; font-size: 10px">SINCE 2018</span>
                    <span class="line"></span>
                  </div>
                </div>
              </div>

              <h1>Reminder</h1>

              <p>Hi ${to},</p>

              <p>${message}</p>

              <div class="button-container">
                <a href="${baseUrl}/letters/${letterboxId}" class="button">See the message</a>
              </div>

              <p>
                Best regards,<br />
                Murphy Charitable Foundation
              </p>

              <div class="footer">
                <p>
                  <strong>Murphy Charitable Foundation</strong><br />
                  <span style="color: #666">Sent to you from Uganda.</span>
                </p>
              </div>
            </div>
          </body>
        </html>
        `;

  return emailHtml;
};

export default generateDormantLetterboxEmailTemplate;

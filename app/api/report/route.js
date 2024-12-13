import { NextResponse } from 'next/server';
import sendgrid from '@sendgrid/mail';


export async function POST(request) {
  try {

    sendgrid.setApiKey(process.env.SENDGRID_KEY); //Set api Key

    const body = await request.json();

    //Grab Message Information
    const { message } = body; 


    //HTML for Email
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
            <h1>Message Reported</h1>
            <p><strong>Reported Message:</strong></p>
            <p class="message-content">${message || 'No message provided.'}</p>
            <footer>
              <p>This email was sent from your report system. If you have any questions, please contact us.</p>
            </footer>
          </div>
        </body>
      </html>
    `;


    //SendGrid email configuration
    const msg = {
      to: 'connorwhite771@gmail.com', 
      from: 'connorwhite771@gmail.com', // Your verified sender email
      subject: "Message Reported",
      text: message || 'No message provided.',
      html:  emailHtml,
    };
    
    // Send the email
    
    await sendgrid.send(msg);
    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });

  } catch (error) {
    console.error('Error sending email:', error);

    return NextResponse.json(
      { message: 'Failed to send email.', error: error.message },
      { status: 500 }
    );
  }
}
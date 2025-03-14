import { NextResponse } from 'next/server';
import sendgrid from '@sendgrid/mail';
import * as Sentry from "@sentry/nextjs";

import { auth } from '../../firebaseAdmin';  // Import Firebase Admin SDK from the centralized file

export async function POST(request) {
  console.log("hello");
  if (auth == null) {
    return NextResponse.json(
      { message: 'Admin is null.', },
      { status: 500 }
    );
  }
  try {
    console.log("Inside of the try catch");
    sendgrid.setApiKey(process.env.SENDGRID_KEY); //Set api Key
    const body = await request.json();
    //Grab Message Information
    const { sender, users, id } = body; 
    const senderSegments = sender._key?.path?.segments;
    const sender_id = senderSegments[senderSegments.length - 1];
    //const filtered = users.filter(element => element !== sender);
    console.log("before emails");
    const emails = await Promise.all(
      users.map(async (user) => {
        try {
          const pathSegments = user._key?.path?.segments;
          const uid = pathSegments[pathSegments.length - 1];
          if (uid !== sender_id ){
            const userRecord = await auth.getUser(uid); // Fetch user record by UID
            console.log("Was able to getUser");
            return userRecord.email; // Return the email
          }
        } catch (error) {
          Sentry.captureException(error);
          return null; 
        }
      })
    );
    console.log("Doesn't happen within user promise ");
    // Remove null values (failed fetches)
    const validEmails = emails.filter((email) => email !== null && email !== undefined);
    const message = `Hello, it seems that your chat in a letterbox with the id: ${id}, involving the users: ${validEmails}, has stalled. Consider contacting them to see if the chat can be reignited.`
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
            <p class="message-content">${message || 'No message provided.'}</p>
            <footer>
              <p>This email was sent from your report system. If you have any questions, please contact us.</p>
            </footer>
          </div>
        </body>
      </html>
    `;

    const msg = {
      to: validEmails[0], 
      from: 'penpal@murphycharity.org', // Your verified sender email
      subject: "Message Reported",
      text: message || 'No message provided.',
      html:  emailHtml,
    };

    // Send the email
    await sendgrid.send(msg);
    return NextResponse.json({ message: `Email sent successfully!` }, { status: 200 });
    

  } catch (error) {
    Sentry.captureException(error);

    return NextResponse.json(
        { message: 'Failed to send email.', error: error.message },
        { status: 500 }
      );
    }
  }
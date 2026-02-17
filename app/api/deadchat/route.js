/**
 * POST /api/deadchat
 * 
 * Sends an email notification about an inactive chat
 * Called when users haven't exchanged messages for more than a month
 * 
 * Request body:
 * {
 *   sender: object | array,  // Single user object OR array of 2 users (if reason === "admin")
 *   id: string,              // letterbox_id
 *   emailId: object,         // Firebase document reference
 *   reason: string           // "admin" or other value
 * }
 * 
 * sender format (single user):
 * { first_name: string, last_name: string }
 * 
 * sender format (when reason === "admin"):
 * [{ first_name: string, last_name: string }, { first_name: string, last_name: string }]
 * 
 * Response (success):
 * { message: "Email sent successfully!" }
 * 
 * Response (error):
 * { message: "Failed to send email.", error: "..." }
 * 
 * Sends email to:
 * - If reason === "admin" -> admin (penpal@murphycharity.org)
 * - Otherwise -> user (gets email from Firebase Auth by uid)
 */

import { NextResponse } from 'next/server';
import sendgrid from '@sendgrid/mail';
import { auth } from '../../firebaseAdmin';  // Import Firebase Admin SDK from the centralized file
import { logError } from "../../utils/analytics";

export async function POST(request) {
  if (auth == null) {
    return NextResponse.json(
      { message: 'Admin is null.', },
      { status: 500 }
    );
  }
  try {
    sendgrid.setApiKey(process.env.SENDGRID_KEY); //Set api Key
    const body = await request.json();
    //Grab Message Information
    const { sender, id, emailId, reason} = body; 
    //const filtered = users.filter(element => element !== sender);
    const pathSegments = emailId._key?.path?.segments;
    const uid = pathSegments[pathSegments.length - 1]; 
    const userRecord = await auth.getUser(uid); // Fetch user record by UID
    let message;
    if (reason == "admin") {
      message = `Hello Richard, it seems that a chat in a letterbox with the id: ${id}, involving the user: ${sender[0].first_name} ${sender[0].last_name}, ${sender[1].first_name} ${sender[1].last_name}, has stalled because the user with the email ${userRecord.email} has stopped responding. Consider contacting them to see if the chat can be reignited.`
    }
    else {
      message = `Hello, it seems that your chat in a letterbox with the id: ${id}, involving the user: ${sender.first_name} ${sender.last_name}, has stalled. Consider contacting them to see if the chat can be reignited.`
    }
    // Remove null values (failed fetches)
    
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
    let msg;
    if (reason == "admin") {
      msg = {
        to: 'penpal@murphycharity.org',
        from: 'penpal@murphycharity.org', // Your verified sender email
        subject: "Message Reported",
        text: message || 'No message provided.',
        html:  emailHtml,
      };
    } else {
      msg = {
        to: userRecord.email,
        from: 'penpal@murphycharity.org', // Your verified sender email
        subject: "Message Reported",
        text: message || 'No message provided.',
        html:  emailHtml,
      };
    }
    
    // Send the email
    await sendgrid.send(msg);
    return NextResponse.json({ message: `Email sent successfully!` }, { status: 200 });
    

  } catch (error) {
    logError(error, {
      description: "Failed to send email.",
    });

    return NextResponse.json(
        { message: 'Failed to send email.', error: error.message },
        { status: 500 }
      );
    }
  }
import { NextResponse } from 'next/server';
import nodemailer from "nodemailer";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { logError } from "../../utils/analytics";

export async function POST(request) {
  try {
    const body = await request.json();
    //Grab Message Information
    const {receiver_email, currentUrl, sender, excerpt } = body; 
    const userRef = doc(db, "users", sender);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const message = `Hello, the user with the uid: ${receiver_email} , reported this message: ${currentUrl} sent by a user with the name: ${userData.first_name} ${userData.last_name}. Here is a brief excerpt from the reported message, "${excerpt}"`;
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
    const SENDER_EMAIL = "penpal@murphycharity.org";



    //SendGrid email configuration
    const msg = {
      to: 'penpal@murphycharity.org', 
      from: 'penpal@murphycharity.org', // Your verified sender email
      subject: "Message Reported",
      text: message || 'No message provided.',
      html:  emailHtml,
    };

    const transporter = nodemailer.createTransport({
        host: process.env.CPANEL_SMTP_HOST,
        port: parseInt(process.env.CPANEL_SMTP_PORT),
        secure: process.env.CPANEL_SMTP_PORT == 465, // SSL for 465
        auth: {
            user: SENDER_EMAIL, //sender email
            pass: process.env.PENPAL_EMAIL_PASSWORD, //sender password (cPanel email password)
        },
    });
    

    // Send the email
    await transporter.sendMail(msg);
    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
    

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
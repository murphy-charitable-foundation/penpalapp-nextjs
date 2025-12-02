import { NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";
import sendgrid from "@sendgrid/mail";

import { db, auth } from "../../firebaseAdmin";
import { logError } from "../../utils/analytics";

const SENDER_EMAIL = "penpal@murphycharity.org";

const sendEmail = async (letterBoxId, members, toEmails, reason) => {
  try {
    sendgrid.setApiKey(process.env.SENDGRID_KEY);
    let message;
    if (reason == "admin") {
      message = `Hello Richard, it seems that a chat in a letterbox with the id: ${letterBoxId}, involving the user/s:${members.map(
        (member) => ` ${member.firstName} ${member.lastName},`
      )} has stalled because the user/s with the email/s ${toEmails.map(
        (email) => ` ${email},`
      )} has stopped responding. Consider contacting them to see if the chat can be reignited.`;
    } else {
      message = `Hello, it seems that your chat in a letterbox with the id: ${letterBoxId}, involving the user/s:${members.map(
        (member) => ` ${member.firstName} ${member.lastName},`
      )}, has stalled. Consider contacting them to see if the chat can be reignited.`;
    }

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
    let msg;
    if (reason == "admin") {
      msg = {
        // to: "penpal@murphycharity.org",
        to: ["anjosantos92@gmail.com", "santos.nicol.angelo@gmail.com"],
        from: SENDER_EMAIL, // Your verified sender email
        subject: "Message Reported",
        text: message || "No message provided.",
        html: emailHtml,
      };
    } else {
      msg = {
        to: ["anjosantos92@gmail.com", "santos.nicol.angelo@gmail.com"],
        // to: toEmails,
        from: SENDER_EMAIL, // Your verified sender email
        subject: "Message Reported",
        text: message || "No message provided.",
        html: emailHtml,
      };
    }

    // Send the email
    await sendgrid.send(msg);
    return { success: true };
  } catch (error) {
    logError(error, {
      description: "Failed to send email.",
    });
    throw error;
  }
};

export async function POST(request) {
  if (auth == null) {
    return NextResponse.json({ message: "Admin is null." }, { status: 500 });
  }
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const letterboxSnapshot = await db.collection("letterbox").get();
    const letterBoxesPromises = letterboxSnapshot.docs.map(async (doc) => {
      const docData = doc.data();
      const latestLetterSnapshot = await doc.ref
        .collection("letters")
        .orderBy("created_at", "desc")
        .limit(1)
        .get();

      let latestLetter = null;
      if (!latestLetterSnapshot.empty) {
        const letterDoc = latestLetterSnapshot.docs[0];
        const letterData = letterDoc.data();
        latestLetter = {
          id: letterDoc.id,
          created_at: letterData.created_at?.toDate?.(),
          sent_by: letterData.sent_by?.id,
        };
      }

      return {
        id: doc.id,
        members: docData.members.map((member) => member.id),
        latestLetter,
      };
    });
    const letterBoxes = await Promise.all(letterBoxesPromises);

    for (const letterBox of letterBoxes) {
      const latestMessageTimestamp = letterBox?.latestLetter?.created_at;
      if (latestMessageTimestamp) {
        const now = new Date();
        const timestampDate = new Date(latestMessageTimestamp);
        const diffMs = now - timestampDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const usersRef = db.collection("users");
        const membersSnapshot = await usersRef
          .where(FieldPath.documentId(), "in", letterBox.members)
          .get();
        const allMembers = membersSnapshot.docs.map((doc) => ({
          id: doc.id,
          firstName: doc.first_name,
          lastName: doc.last_name,
        }));

        const userPromises = letterBox.members.map((uid) =>
          auth.getUser(uid).catch((err) => {
            return null; // Handle missing users gracefully
          })
        );
        const userRecords = await Promise.all(userPromises);
        const emails = userRecords
          .filter((record) => record !== null)
          .map((record) => record.email);

        if (diffDays == 15) {
          await sendEmail(letterBox.id, allMembers, emails, "user");
        } else if (diffDays == 30) {
          await sendEmail(letterBox.id, allMembers, emails, "user");
          await sendEmail(letterBox.id, allMembers, emails, "admin");
        }
      }
    }

    return NextResponse.json(
      {
        message: "Email sent successfully!",
        letterBoxes: letterBoxes,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";

import { db, auth } from "../../firebaseAdmin";
import { sendEmail } from "../../utils/dormantConversationHelpers";

export async function POST(request) {
  if (auth == null) {
    return NextResponse.json({ message: "Admin is null." }, { status: 500 });
  }
  try {
    const authHeader = request.headers.get("Authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or expired token" },
        { status: 401 }
      );
    }
    const uid = decodedToken.uid;
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (!userDoc.exists || userData?.user_type !== "admin") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only admin users can use this endpoint" },
        { status: 403 }
      );
    }

    const conversationSnapshot = await db.collection("conversations").get();
    const conversationesPromises = conversationSnapshot.docs
      .filter((doc) => doc.data()?.deleted_at == null)
      .map(async (doc) => {
      const docData = doc.data();
      let latestMessage = null;

      const denormalizedAt = docData.latest_message_created_at;
      if (denormalizedAt != null) {
        latestMessage = {
          id: docData.latest_message_id ?? null,
          created_at: typeof denormalizedAt.toDate === "function" ? denormalizedAt.toDate() : denormalizedAt,
          sent_by: docData.latest_message_sent_by ?? null,
        };
      }

      if (latestMessage === null) {
        // TODO: maintain latest_message_created_at at the level of `conversation`
        // updated at the time of message approval so that it is faster to query here
        const latestMessageSnapshot = await doc.ref
          .collection("messages")
          .orderBy("created_at", "desc")
          .limit(1)
          .get();

        if (!latestMessageSnapshot.empty) {
          const messageDoc = latestMessageSnapshot.docs[0];
          const messageData = messageDoc.data();
          const createdAt = messageData.created_at?.toDate?.();
          const sentById = messageData.sent_by?.id ?? (typeof messageData.sent_by === "string" ? messageData.sent_by : null);
          latestMessage = {
            id: messageDoc.id,
            created_at: createdAt,
            sent_by: sentById,
          };
          try {
            await doc.ref.update({
              latest_message_created_at: messageData.created_at,
              latest_message_id: messageDoc.id,
              latest_message_sent_by: sentById,
            });
          } catch (err) {
            // Non-fatal: next run will query again
          }
        }
      }

      return {
        id: doc.id,
        members: docData.members.map((member) => member.id),
        latestMessage,
        user_reminded_at: docData.user_reminded_at?.toDate?.(),
        admin_reminded_at: docData.admin_reminded_at?.toDate?.(),
      };
    });
    const conversationes = await Promise.all(conversationesPromises);

    const emailPromises = [];

    for (const conversation of conversationes) {
      const latestMessageTimestamp = conversation?.latestMessage?.created_at;
      const latestAdminDormantConversationTimestamp = conversation?.admin_reminded_at;
      const latestUserDormantConversationTimestamp = conversation?.user_reminded_at;
      const now = new Date();
      let adminDiffDays = 0;
      let userDiffDays = 0;

      if (latestMessageTimestamp) {
        const latestMessageTimestampDate = new Date(latestMessageTimestamp);
        const diffMs = now - latestMessageTimestampDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        adminDiffDays = diffDays;
        userDiffDays = diffDays;
      }

      if (latestAdminDormantConversationTimestamp) {
        const latestAdminDormantConversationTimestampDate = new Date(
          latestAdminDormantConversationTimestamp
        );
        const diffMs = Math.floor(
          (now - latestAdminDormantConversationTimestampDate) / (1000 * 60 * 60 * 24)
        );
        if (adminDiffDays === 0 || diffMs < adminDiffDays) {
          adminDiffDays = diffMs;
        }
      }
      if (latestUserDormantConversationTimestamp) {
        const latestUserDormantConversationTimestampDate = new Date(
          latestUserDormantConversationTimestamp
        );
        const diffMs = Math.floor(
          (now - latestUserDormantConversationTimestampDate) / (1000 * 60 * 60 * 24)
        );
        if (userDiffDays === 0 || diffMs < userDiffDays) {
          userDiffDays = diffMs;
        }
      }

      if (userDiffDays >= 14 || adminDiffDays >= 28) {
        const usersRef = db.collection("users");
        const membersSnapshot = await usersRef
          .where(FieldPath.documentId(), "in", conversation.members)
          .get();
        const allMembers = membersSnapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            firstName: docData.first_name,
            lastName: docData.last_name,
          };
        });

        const userPromises = conversation.members.map((uid) =>
          auth.getUser(uid).catch((err) => {
            return null; // Handle missing users gracefully
          })
        );
        const userRecords = await Promise.all(userPromises);
        const emails = userRecords
          .filter((record) => record !== null)
          .map((record) => record.email);


        if (userDiffDays >= 14) {
          emailPromises.push(
            sendEmail(conversation.id, allMembers, emails, "user").catch(
              (err) => err
            )
          );
        }

        if (adminDiffDays >= 28) {
          emailPromises.push(
            sendEmail(conversation.id, allMembers, emails, "admin").catch(
              (err) => err
            )
          );
        }
      }
    }

    const emailResults = await Promise.allSettled(emailPromises);
    const successEmails = [];
    const failedEmails = [];

    emailResults.forEach((result) => {
      if (result.status === "fulfilled") {
        const value = result.value;
        if (value && value.success) {
          successEmails.push(value);
        } else if (value && value.error) {
          failedEmails.push(value);
        }
      } else {
        failedEmails.push(result);
      }
    });

    return NextResponse.json(
      {
        message: "DormantConversation Request Success!",
        successEmails: successEmails,
        failedEmails: failedEmails,
        conversationes: conversationes,
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

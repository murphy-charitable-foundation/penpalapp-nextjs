import { NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";

import { db, auth } from "../../firebaseAdmin";
import { sendEmail } from "../../utils/dormantLetterboxHelpers";

export async function POST() {
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

      return {
        id: doc.id,
        members: docData.members.map((member) => member.id),
        letterbox_updated_at: docData.updated_at?.toDate?.(),
        user_reminded_at: docData.user_reminded_at?.toDate?.(),
        admin_reminded_at: docData.admin_reminded_at?.toDate?.(),
      };
    });
    const letterBoxes = await Promise.all(letterBoxesPromises);

    const emailPromises = [];

    for (const letterBox of letterBoxes) {
      const letterBoxUpdatedAtTimestamp = letterBox?.letterbox_updated_at;
      const latestAdminDormantLetterboxTimestamp = letterBox?.admin_reminded_at;
      const latestUserDormantLetterboxTimestamp = letterBox?.user_reminded_at;
      const now = new Date();
      let adminDiffDays = 0;
      let userDiffDays = 0;

      if (letterBoxUpdatedAtTimestamp) {
        const letterBoxUpdatedAtTimestampDate = new Date(letterBoxUpdatedAtTimestamp);
        const diffMs = now - letterBoxUpdatedAtTimestampDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        adminDiffDays = diffDays;
        userDiffDays = diffDays;
      }

      if (latestAdminDormantLetterboxTimestamp) {
        const latestAdminDormantLetterboxTimestampDate = new Date(
          latestAdminDormantLetterboxTimestamp
        );
        const diffMs = Math.floor(
          (now - latestAdminDormantLetterboxTimestampDate) / (1000 * 60 * 60 * 24)
        );
        if (adminDiffDays === 0 || diffMs < adminDiffDays) {
          adminDiffDays = diffMs;
        }
      }
      if (latestUserDormantLetterboxTimestamp) {
        const latestUserDormantLetterboxTimestampDate = new Date(
          latestUserDormantLetterboxTimestamp
        );
        const diffMs = Math.floor(
          (now - latestUserDormantLetterboxTimestampDate) / (1000 * 60 * 60 * 24)
        );
        if (userDiffDays === 0 || diffMs < userDiffDays) {
          userDiffDays = diffMs;
        }
      }

      if (userDiffDays >= 14 || adminDiffDays >= 28) {
        const usersRef = db.collection("users");
        const membersSnapshot = await usersRef
          .where(FieldPath.documentId(), "in", letterBox.members)
          .get();
        const allMembers = membersSnapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            firstName: docData.first_name,
            lastName: docData.last_name,
          };
        });

        const userPromises = letterBox.members.map((uid) =>
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
            sendEmail(letterBox.id, allMembers, emails, "user").catch(
              (err) => err
            )
          );
        }

        if (adminDiffDays >= 28) {
          emailPromises.push(
            sendEmail(letterBox.id, allMembers, emails, "admin").catch(
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
        message: "DormantLetterbox Request Success!",
        successEmails: successEmails,
        failedEmails: failedEmails,
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

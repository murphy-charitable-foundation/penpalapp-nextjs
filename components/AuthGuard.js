"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../app/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Dialog from "./general/Dialog";

export default function AuthGuard({ children }) {
  const [status, setStatus] = useState("loading");
  const [reason, setReason] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setReason("login");
        setStatus("blocked");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        setReason("profile");
        setStatus("blocked");
        return;
      }

      const data = snap.data();

      if (!data.first_name || !data.country) {
        setReason("profile");
        setStatus("blocked");
        return;
      }

      setStatus("allowed");
    });

    return () => unsubscribe();
  }, []);

  if (status === "loading") return null;

  if (status === "blocked" && reason === "login") {
    return (
      <Dialog
        isOpen
        title="Login Required"
        content="Please log in to continue."
        buttons={[
          {
            text: "Go to Login",
            onClick: () => router.push("/login"),
          },
        ]}
      />
    );
  }

  if (status === "blocked" && reason === "profile") {
    return (
      <Dialog
        isOpen
        title="Complete Your Profile"
        content="Please complete your profile before continuing."
        buttons={[
          {
            text: "Go to Profile",
            onClick: () => router.push("/profile"),
          },
        ]}
      />
    );
  }

  return children;
}
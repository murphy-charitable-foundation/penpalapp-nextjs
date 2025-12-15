"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import Button from "../../components/general/Button";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import NavBar from "../../components/bottom-nav-bar";

import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { usePageAnalytics } from "../useAnalytics";

export default function Donate() {
  /* ================= AUTH ================= */
  const [user, setUser] = useState(null);
  const isLoggedIn = !!user;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  /* ================= ANALYTICS ================= */
  usePageAnalytics("/donate");

  /* ================= PAYMENT DETAILS ================= */
  const details = [
    { label: "Account Name", value: "Murphy Charitable Foundation" },
    { label: "Account Number", value: "01113657970966" },
    { label: "Bank Name", value: "Dfcu Bank Uganda" },
    { label: "Swift Code", value: "DFCUUGKA" },
  ];

  /* ================= RENDER ================= */
  return (
    <PageBackground className="bg-gray-100 h-screen overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[92dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* ===== HEADER ===== */}
          <div className="shrink-0 border-b bg-white pt-4">
            <PageHeader title="Sponsor a child" image={false} />
          </div>

          {/* ===== SINGLE SCROLLER ===== */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="space-y-2">
              <p>
                Your generosity makes our work possible. Whether you contribute
                financially or as an advocate for good, you make a real
                difference.
              </p>

              <p className="text-gray-700 text-xs italic">
                You may include a note to indicate your preferred category:
              </p>

              <p className="text-gray-700 text-xs italic">
                Education, Beddings &amp; Clothing, Medical Care, or Scholastic
                Materials.
              </p>
            </div>

            {/* DONATE BUTTON */}
            <div className="mt-4 text-center">
              <Link
                href="https://www.every.org/murphy-charitable-foundation-uganda?utm_campaign=donate-link#/donate/card"
                target="_blank"
              >
                <Button btnText="Sponsor Now" />
              </Link>
            </div>

            {/* PAYMENT DETAILS */}
            <section className="mt-6">
              <div className="bg-secondary rounded-lg shadow-lg p-4">
                <h2 className="text-center text-2xl md:text-3xl text-white font-bold mb-6">
                  Payment Details
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  {details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-4 shadow"
                    >
                      <h3 className="text-sm font-bold text-secondary">
                        {detail.label}
                      </h3>
                      <p className="text-gray-800 mt-1">
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-white/90 text-xs mt-4 text-center">
                  Please include your email in the transfer note so we can send a
                  receipt.
                </p>
              </div>
            </section>
          </div>

          {/* ===== NAVBAR (ONLY WHEN LOGGED IN) ===== */}
          {isLoggedIn && (
            <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
              <NavBar />
            </div>
          )}
        </PageContainer>
      </div>
    </PageBackground>
  );
}

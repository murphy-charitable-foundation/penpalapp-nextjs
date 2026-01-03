// pages/terms-conditions.js
"use client"
import Link from "next/link";
import Image from "next/image";
import logo from "/public/murphylogo.png";
import { BackButton } from "../../components/general/BackButton";
import { PageHeader } from "../../components/general/PageHeader";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { useEffect } from "react";
import { usePageAnalytics } from "../useAnalytics";
import { logLoadingTime } from "../utils/analytics";

export default function TermsCondition() {
  usePageAnalytics("/terms-conditions");

return (
  <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
    <div className="flex-1 min-h-0 flex justify-center">

      <PageContainer
        width="compactXS"
        padding="none"
        center={false}
        className="
          min-h-[92dvh]
          flex flex-col
          bg-white
          rounded-2xl
          shadow-lg
          overflow-hidden
        "
      >
        {/* ===== HEADER ===== */}
        <PageHeader title="Terms and Conditions" imageSize="sm"/>

        {/* ===== SCROLLABLE CONTENT ===== */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
          <div className="space-y-8 text-gray-800 leading-relaxed text-sm">

            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>

            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>

          </div>
        </div>

      </PageContainer>
    </div>
  </PageBackground>
);

}
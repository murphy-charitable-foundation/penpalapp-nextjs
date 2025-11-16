
// pages/privacy-policy.js
"use client"

import Link from "next/link";
import Image from "next/image";
import logo from "/public/murphylogo.png";
import { BackButton } from "../../components/general/BackButton";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import { useEffect } from "react";
import { usePageAnalytics } from "../useAnalytics";
import { logLoadingTime } from "../utils/analytics";

export default function TermsCondition() {
  usePageAnalytics("/privacy-policy");

  return (
    //<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
    <PageBackground>
      <PageContainer>
        <PageHeader title="Privacy Policy" />

        <div className="flex flex-col gap-10 mt-16">
          <div
            className="container flex items-center justify-between  word-break:break-all"
          >
            <p className="font-medium font-inter text-black leading-[1.8rem] margin-20px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>

          <div
            className="container flex items-center justify-between  word-break:break-all"
          >
            <p className="font-medium font-inter text-black leading-[1.8rem]">
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
    </PageBackground>
    //</div>
  );
}

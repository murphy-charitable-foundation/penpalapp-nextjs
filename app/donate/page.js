"use client";

// pages/donate.js
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import BottomNavBar from "../../components/bottom-nav-bar";
import Button from "../../components/general/Button";
import { BackButton } from "../../components/general/BackButton";
import { logButtonEvent, logLoadingTime } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";
import { useEffect } from "react";

export default function Donate() {
  const details = [
    { label: "Account Name", value: "Murphy Charitable Foundation" },
    { label: "Account Number", value: "01113657970966" },
    { label: "Bank Name", value: "Dfcu Bank Uganda" },
    { label: "Swift Code", value: "DFCUUGKA" },
  ];

  /**
   * Firebase Analytics Documentation Example:
   * 1. usePageAnalytics("/donate") from useAnalytics.js logs a page view for the /donate page
   * 2. The useEffect hook measures the time from when the component mounts (startTime) to when the page is fully rendered (endTime).
   * 3. The requestAnimationFrame and setTimeout functions ensure that the endTime is recorded after the page has finished rendering.
   * 4. The logLoadingTime function from analytics.js is called with the page path ("/donate") and the load time, which likely sends this data to Firebase Analytics
   */

  usePageAnalytics("/donate");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full mb-8">
        <Link href="letterhome">
          <BackButton />
        </Link>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-center text-4xl text-blue-600 font-bold mb-6">
              Donate
            </h2>

            <p className="text-gray-700 text-lg leading-relaxed">
              Your generosity makes our work possible. Whether you contribute
              financially or as advocate for good, you make a real difference.
            </p>

            <div className="mt-6 text-center">
              <Link href="https://www.every.org/murphy-charitable-foundation-uganda?utm_campaign=donate-link#/donate/card">
            {/* logButtonEvent from analytics.js logs a button click event to Firebase 
                Analytics when the "Make a Donation" button is clicked. The event is labeled 
                as "make donation button clicked" and is associated with the "/donate" page. */ }
                <Button
                  btnText="Make a Donation"
                  color="bg-blue-600"
                  textColor="text-white"
                  hoverColor="hover:bg-blue-700"
                  rounded="rounded-md"
                  font="font-semibold"
                  onClick={() =>
                    logButtonEvent("make donation button clicked", "/donate")
                  }
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Section */}
      <div className="bg-blue-600 rounded-xl shadow-lg p-6 max-w-2xl w-full">
        <h2 className="text-center text-3xl text-white font-bold mb-6">
          Payment Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {details.map((detail, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg text-blue-600 font-bold">
                {detail.label}
              </h3>
              <p className="text-md mt-2 text-gray-800">{detail.value}</p>
            </div>
          ))}
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
}
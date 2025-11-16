"use client";

import Link from 'next/link';
import BottomNavBar from '../../components/bottom-nav-bar';
import Button from '../../components/general/Button';
import { BackButton } from '../../components/general/BackButton';
import { PageBackground } from '../../components/general/PageBackground';
import { PageContainer } from '../../components/general/PageContainer';
import { PageHeader } from '../../components/general/PageHeader';
import { useUser } from '../../contexts/UserContext';
export default function Donate() {
  const details = [
    { label: "Account Name", value: "Murphy Charitable Foundation" },
    { label: "Account Number", value: "01113657970966" },
    { label: "Bank Name", value: "Dfcu Bank Uganda" },
    { label: "Swift Code", value: "DFCUUGKA" },
  ];

const NAV_H = 88;         // your real BottomNav height
const TOP_GAP_PX = 0;     // smaller top gap (px) → taller card
const FUDGE_PX = 24;      // extra height to ensure bottom is visible

const { user } = useUser();
const navbarHeight = user ? NAV_H : 0;
const whiteCardWrapperHeight = {
  height: user ? `calc(100dvh - ${NAV_H}px - ${TOP_GAP_PX}px + ${FUDGE_PX}px)` : 'auto',
}

  return (
    <div className="bg-gray-100 h-screen overflow-hidden flex flex-col">
      {/* smaller top gap for a taller card */}
      <div className="flex-1 overflow-hidden" style={{ paddingTop: `${TOP_GAP_PX}px` }}>
        <div
          className="mx-auto w-full max-w-[29rem] rounded-lg shadow-lg overflow-hidden"
          // make it taller: subtract less + add a small positive fudge
          style={whiteCardWrapperHeight}
        >
          <PageContainer
            width="compactXS"
            padding="none"
            bg="bg-white"
            scroll
            viewportOffset={navbarHeight}
            className="p-0 h-full min-h-0 overflow-hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* scroll area; add extra bottom padding so last item never feels cut off */}
            <div className="h-full min-h-0 overflow-y-auto px-6 py-4 pb-6">
              <PageHeader title="Sponsor a child" image={false} />

              <div className="space-y-2">
                <p>
                  Your generosity makes our work possible. Whether you contribute financially or as an
                  advocate for good, you make a real difference.
                </p>
                <p className="text-gray-700 text-xs italic">
                  You may include a note to indicate your preferred category:
                </p>
                <p className="text-gray-700 text-xs italic">
                  Education, Beddings &amp; Clothing, Medical Care, or Scholastic Materials.
                </p>
              </div>

              <div className="mt-4 text-center">
                <Button 
                  btnText="Sponsor Now" 
                  href="https://www.every.org/murphy-charitable-foundation-uganda?utm_campaign=donate-link#/donate/card"
                  external={true}
                />
              </div>

              <section className="mt-6">
                <div className="bg-secondary rounded-lg shadow-lg p-6">
                  <h2 className="text-center text-2xl md:text-3xl text-white font-bold mb-6">
                    Payment Details
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    {details.map((detail, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 shadow">
                        <h3 className="text-sm font-bold text-secondary">{detail.label}</h3>
                        <p className="text-gray-800 mt-1">{detail.value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-white/90 text-xs mt-4 text-center">
                    Please include your email in the transfer note so we can send a receipt.
                  </p>
                </div>
              </section>

              {/* tiny spacer so the last card never kisses the rounded edge */}
              <div className="h-2" />
            </div>
          </PageContainer>
        </div>
      </div>

      {/* keep nav outside the card */}
      <BottomNavBar />
    </div>
  );
}

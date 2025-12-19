"use client";
import { useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import Button from "../../components/general/Button";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import NavBar from "../../components/bottom-nav-bar";
import Image from "next/image";
import { BackButton } from "../../components/general/BackButton";
import { logButtonEvent, logLoadingTime } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";

export default function Donate() {
  const details = [
    { label: "Account Name", value: "Murphy Charitable Foundation" },
    { label: "Account Number", value: "01113657970966" },
    { label: "Bank Name", value: "Dfcu Bank Uganda" },
    { label: "Swift Code", value: "DFCUUGKA" },
  ];

  const TOP_GAP = 8;
  const GAP_BELOW = 2;

  usePageAnalytics("/donate");

  const [navH, setNavH] = useState(88);
  const navWrapRef = useRef(null);

  useLayoutEffect(() => {
    const el = navWrapRef.current;
    if (!el) return;

    const update = () => setNavH(el.offsetHeight || 88);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      ro.disconnect();
    };
  }, []);

  return (
    <PageBackground className="bg-gray-100 min-h-[103dvh] overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0" style={{ paddingTop: TOP_GAP }}>
        <div
          className="relative mx-auto w-full max-w-[29rem] rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-0 bg-white"
          style={{
            height: `calc(103dvh - ${TOP_GAP}px - ${GAP_BELOW}px - env(safe-area-inset-bottom,0px))`,
          }}
        >
          <PageContainer
            width="compactXS"
            padding="none"
            bg="bg-white"
            scroll={false}
            viewportOffset={0}
            className="p-0 flex-1 min-h-0 flex flex-col !w-full !max-w-none"
            style={{ maxWidth: "unset", width: "100%" }}
          >
            <div className="sticky top-0 z-20 bg-white pt-4">
              <PageHeader title="Sponsor a child" image={false} />
            </div>

            <div
              className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4"
              style={{
                WebkitOverflowScrolling: "touch",
                paddingBottom: `calc(${navH}px + ${GAP_BELOW}px + env(safe-area-inset-bottom,0px))`,
              }}
            >
              <div className="space-y-2">
                <p>
                  Your generosity makes our work possible. Whether you
                  contribute financially or as an advocate for good, you
                  make a real difference.
                </p>
                <p className="text-gray-700 text-xs italic">
                  You may include a note to indicate your preferred category:
                </p>
                <p className="text-gray-700 text-xs italic">
                  Education, Beddings &amp; Clothing, Medical Care, or
                  Scholastic Materials.
                </p>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="https://www.every.org/murphy-charitable-foundation-uganda?utm_campaign=donate-link#/donate/card"
                  target="_blank"
                >
                  <Button btnText="Sponsor Now" />
                </Link>
              </div>

              <section className="mt-4">
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
                        <p className="text-gray-800 mt-1">{detail.value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-white/90 text-xs mt-4 text-center">
                    Please include your email in the transfer note so we can
                    send a receipt.
                  </p>
                </div>
              </section>

              <div className="h-2" />
            </div>
          </PageContainer>
        </div>
      </div>

      <div ref={navWrapRef}>
        <NavBar />
      </div>
    </PageBackground>
  );
}

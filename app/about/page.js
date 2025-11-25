"use client";

import Image from "next/image";
import BottomNavBar from "../../components/bottom-nav-bar";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import { useLayoutEffect, useRef, useState } from "react";

const TOP_GAP = 8;
const GAP_BELOW = 2;

export default function About() {
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
          className="relative mx-auto w-full max-w-[29rem] rounded-2xl overflow-hidden shadow-lg flex flex-col min-h-0"
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
            className="p-0 flex-1 min-h-0 flex flex-col"
          >
            {/* SINGLE SCROLLER */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{
                WebkitOverflowScrolling: "touch",
                overflowAnchor: "none",
                paddingBottom: `calc(${navH}px + ${GAP_BELOW}px + env(safe-area-inset-bottom,0px))`,
              }}
            >
              {/* Header */}
              <div className="px-10 pt-2">
                <PageHeader title="About Us" image={false} />
              </div>

              {/* Blue banner */}
              <div className="px-10">
                <div className="bg-secondary text-white rounded-xl text-center py-4 mt-3 mb-6">
                  <blockquote className="font-medium italic">
                    Together, we can create a brighter future for the children of Uganda.
                  </blockquote>
                </div>
              </div>

              {/* Content */}
              <div className="px-10 pb-2">
                {/* image 1 */}
                <div
                  className="relative w-full rounded-xl overflow-hidden ring-1 ring-black/5 shadow-sm mb-6"
                  style={{ aspectRatio: "4 / 3" }}
                >
                  <Image
                    src="/about/about-asset-1.jpg"
                    alt="Picture of kids"
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>

                <p className="leading-relaxed mb-4 text-gray-700">
                  At Murphy Charitable Foundation Uganda, we are committed to alleviating
                  poverty and improving health and education in the communities we serve.
                </p>
                <p className="leading-relaxed mb-4 text-gray-700">
                  Our journey began with a profound understanding of the challenges faced
                  by individuals living in extreme poverty.
                </p>
                <p className="leading-relaxed mb-4 text-gray-700">
                  Inspired by their resilience and motivated to make a difference, we dedicate
                  ourselves to addressing the needs and rights of vulnerable populations in rural
                  areas by tackling critical social and economic issues.
                </p>
                <p className="leading-relaxed text-gray-700">
                  We focus on implementing sustainable, high-impact projects that enhance education,
                  healthcare, empowerment, and overall community development.
                </p>

                {/* two-column section */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                  {/* image 2 */}
                  <div className="relative rounded-xl overflow-hidden ring-1 ring-black/5 shadow-sm min-h-[240px] md:min-h-[520px] h-full">
                    <Image
                      src="/about/about-asset-2.jpg"
                      alt="Community work"
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 40vw, 100vw"
                    />
                  </div>

                  {/* text beside image */}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-secondary font-bold text-md mb-2">Our Mission</h3>
                    <p className="leading-relaxed mb-6 text-gray-700">
                      To support vulnerable populations by enhancing their access to education,
                      healthcare, and empowerment programs that enable lasting change.
                    </p>
                    <h3 className="text-secondary font-bold text-md mb-2">Our Vision</h3>
                    <p className="leading-relaxed text-gray-700">
                      To build thriving communities where every individual has equitable access to
                      essential resources, fostering both personal growth and collective prosperity.
                    </p>
                  </div>
                </div>

                {/* image 3 */}
                <div
                  className="relative w-full rounded-xl overflow-hidden ring-1 ring-black/5 shadow-sm mt-6"
                  style={{ aspectRatio: "4 / 3" }}
                >
                  <Image
                    src="/about/about-asset-3.webp"
                    alt="Team photo"
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              </div>
            </div>
          </PageContainer>
        </div>
      </div>

      {/* Bottom Nav */}
      <div ref={navWrapRef}>
        <BottomNavBar />
      </div>
    </PageBackground>
  );
}

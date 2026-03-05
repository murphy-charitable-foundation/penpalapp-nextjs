"use client";

import Image from "next/image";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import NavBar from "../../components/bottom-nav-bar";

export default function About() {
  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col">
      <div className="flex-1 min-h-0 flex justify-center">

        <PageContainer
         width="compactXS"
         padding="none"
         center={false}
         className="min-h-[100dvh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* ===== HEADER ===== */}
          <PageHeader title="About Us" image={false} showBackButton />

          {/* ===== SCROLLABLE CONTENT (ONLY SCROLLER) ===== */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-4 pb-6">
            {/* Image 1 */}
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-sm mb-6"
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
              Inspired by their resilience, we dedicate ourselves to addressing critical
              social and economic issues in rural communities.
            </p>

            {/* Two columns */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative rounded-xl overflow-hidden shadow-sm min-h-[240px]">
                <Image
                  src="/about/about-asset-2.jpg"
                  alt="Community work"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col justify-center">
                <h3 className="text-secondary font-bold mb-2">Our Mission</h3>
                <p className="text-gray-700 mb-4">
                  To support vulnerable populations through education and healthcare.
                </p>

                <h3 className="text-secondary font-bold mb-2">Our Vision</h3>
                <p className="text-gray-700">
                  Thriving communities with equitable access to essential resources.
                </p>
              </div>
            </div>

            {/* Image 3 */}
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-sm mt-6"
              style={{ aspectRatio: "4 / 3" }}
            >
              <Image
                src="/about/about-asset-3.webp"
                alt="Team photo"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* ===== NAVBAR ===== */}
          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}

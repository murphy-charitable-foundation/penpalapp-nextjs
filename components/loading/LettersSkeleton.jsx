import React from "react";
import { PageBackground } from "@/components/general/PageBackground";
import { PageContainer } from "@/components/general/PageContainer";

export default function LettersSkeleton() {
  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
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
          animate-pulse
        "
      >
        {/* ===== HEADER SKELETON ===== */}
        <div className="shrink-0 bg-blue-100 p-4 border-b flex items-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full" />
          <div className="ml-3 space-y-2">
            <div className="h-4 w-28 bg-gray-300 rounded" />
            <div className="h-3 w-20 bg-gray-300 rounded" />
          </div>
        </div>

        {/* ===== LIST SKELETON (SCROLLABLE) ===== */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-100 px-4 py-6">
          <div className="space-y-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-gray-300 rounded" />
                    <div className="h-2 w-24 bg-gray-300 rounded" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full bg-gray-300 rounded" />
                  <div className="h-2 w-5/6 bg-gray-300 rounded" />
                  <div className="h-2 w-4/6 bg-gray-300 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== FOOTER PLACEHOLDER ===== */}
        <div className="shrink-0 border-t bg-blue-100 h-14" />
      </PageContainer>
    </PageBackground>
  );
}

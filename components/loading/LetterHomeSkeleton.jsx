import React from "react";
import { PageBackground } from "@/components/general/PageBackground";
import { PageContainer } from "@/components/general/PageContainer";

export default function LetterHomeSkeleton() {
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
            animate-pulse
          "
        >
          {/* Header Skeleton */}
          <div className="shrink-0 flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full" />
              <div className="ml-3">
                <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-300 rounded" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="h-7 w-7 bg-gray-300 rounded" />
              <div className="h-7 w-7 bg-gray-300 rounded" />
              <div className="h-7 w-7 bg-gray-300 rounded" />
            </div>
          </div>

          {/* Main Skeleton (Scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-gray-100 p-6">
            <section className="mt-2">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-32 bg-gray-300 rounded" />
                <div className="h-8 w-20 bg-gray-300 rounded" />
              </div>

              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center p-4 rounded-lg bg-white shadow-sm border border-gray-200"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full" />
                        <div className="h-4 w-24 bg-gray-300 rounded" />
                      </div>
                      <div className="h-3 w-full bg-gray-300 rounded mb-1" />
                      <div className="h-3 w-1/2 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer placeholder */}
          <div className="shrink-0 border-t bg-blue-100 h-14" />
        </PageContainer>
      </div>
    </PageBackground>
  );
}

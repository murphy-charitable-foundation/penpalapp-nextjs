
import React from "react";
import { PageContainer } from "../../components/general/PageContainer";

export default function LetterHomeSkeleton() {
  return (
    <PageContainer
      width="fluid"          
      padding="none"         
      scroll={false}         
      bg="bg-transparent"
      className="!w-full !max-w-none p-0"
      style={{ maxWidth: "unset" }}
    >
      <div className="bg-blue-100 border-b border-gray-200 px-6 py-5 animate-pulse">
        <div className="flex items-center justify-between">
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
      </div>

      <div className="px-6 py-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full" />
              <div className="h-4 w-24 bg-gray-300 rounded" />
            </div>
            <div className="h-3 w-full bg-gray-300 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-300 rounded" />
          </div>
        ))}
        <div aria-hidden="true" className="h-2" />
      </div>
    </PageContainer>
  );
}

import React from 'react';

export default function LetterHomeSkeleton() {
  return (
    <div className="w-full bg-gray-100 min-h-screen py-6 fixed top-0 left-0 z-[100]">
        <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden animate-pulse">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-300 rounded-full" />
              <div className="ml-3">
                <div className="h-3 w-48 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
          {/* Main Skeleton */}
          <main className="p-6">
            <section className="">
              <div>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md animate-pulse"
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
          </main>
        </div>
      </div>
  )
}
import React from 'react';

export default function LettersSkeleton() {
  return (
    <div className="w-full bg-gray-100 min-h-screen py-6 fixed top-0 left-0 z-[100]">
        <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden animate-pulse">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full" />
              <div className="ml-3">
                <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
          {/* Main Skeleton */}
          <main className="p-6">
            <section className="mt-8">
              <div>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse w-full bg-gray-100 h-24 rounded-lg mb-5"
                  >
                    <div className="h-full flex flex-wrap items-center justify-center py-4 px-10">
                      <div className="h-2 w-16 w-full bg-gray-300 rounded mb-1" />
                      <div className="h-2 w-16 w-full bg-gray-300 rounded mb-1" />
                      <div className="h-2 w-16 w-full bg-gray-300 rounded mb-1" />
                      <div className="h-2 w-16 w-full bg-gray-300 rounded mb-1" />
                      <div className="h-2 w-16 w-full bg-gray-300 rounded mb-1" />
                      <div className="h-2 w-16 w-full bg-gray-300 rounded" />
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
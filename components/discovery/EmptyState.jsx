"use client";

export default function EmptyState({ onClear, onEdit }) {
  return (
    <section
      className="mx-auto mt-6 max-w-[560px] px-6"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl bg-[#F4F7FB] ring-1 ring-black/5 p-6 text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#E6EDF4] flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#034792]">
            <path d="M21 21l-4.2-4.2M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h3 className="text-[15px] font-semibold text-gray-900">No matches found</h3>
        <p className="mt-1 text-sm text-gray-600">
          Try adjusting your filters — one kid would love to start with you!
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          {typeof onEdit === "function" && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-white active:scale-95"
            >
              Edit filters
            </button>
          )}

          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-[#034792] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95"
          >
            Clear filters
          </button>
        </div>
      </div>
    </section>
  );
}

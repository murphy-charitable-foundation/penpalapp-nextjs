"use client";

import React from "react";
import KidCard from "./KidCard";
import Button from "../general/Button";
import EmptyState from "../discovery/EmptyState";

export default function KidsList({
  kids = [],
  calculateAge,
  lastKidDoc,
  loadMoreKids,
  loading = false,

  // ✅ empty state controls
  showEmpty = false,
  onClearFilters,
  onEditFilters,

  // ✅ prevent showing empty state when error exists
  error = "",
}) {
  if (error) return null;

  const shouldShowEmpty = showEmpty && !loading && kids.length === 0;
  if (shouldShowEmpty) {
    return <EmptyState onClear={onClearFilters} onEdit={onEditFilters} />;
  }

  return (
    <section className="w-full max-w-full">
      <div className="flex flex-col gap-3 w-full max-w-full">
        {kids.map((kid) => (
          <KidCard
            key={kid?.id || `${kid?.first_name}-${kid?.last_name}`}
            kid={kid}
            calculateAge={calculateAge}
          />
        ))}
      </div>

      {lastKidDoc && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={loadMoreKids}
            btnText={loading ? "Loading..." : "Load more"}
            color="bg-[#034792]"
            textColor="text-white"
            rounded="rounded-full"
            size="px-5 py-2 text-sm"
            disabled={loading}
          />
        </div>
      )}

      <div aria-hidden="true" className="h-2" />
    </section>
  );
}

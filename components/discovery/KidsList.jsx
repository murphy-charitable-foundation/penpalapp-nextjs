"use client";

import React from "react";
import KidCard from "./KidCard";
import Button from "../general/Button";


export default function KidsList({
  kids = [],
  calculateAge,
  lastKidDoc,
  loadMoreKids,
  loading = false,
}) {
  return (
    <section>
      <div className="grid grid-cols-1 gap-3">
        {kids.map((kid) => (
          <KidCard
            key={kid?.id || `${kid?.first_name}-${kid?.last_name}`}
            kid={kid}
            calculateAge={calculateAge}
          />
        ))}
      </div>

      {/* Load more */}
      {lastKidDoc && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={loadMoreKids}
            btnText={loading ? "Loading..." : "Load more"}
            color="bg-[#034792] hover:bg-[#023b78] focus:ring-2 focus:ring-offset-1 focus:ring-[#91b5da]"
            textColor="text-white"
            font="font-semibold"
            rounded="rounded-full"
            size="px-5 py-2 text-sm"
            disabled={loading}
            className={loading ? "opacity-80 cursor-not-allowed" : ""}
          />
        </div>
      )}

      
      <div aria-hidden="true" className="h-2" />
    </section>
  );
}

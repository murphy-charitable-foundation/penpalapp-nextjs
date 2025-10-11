"use client";

import KidCard from "./KidCard";
import Button from "../general/Button";

const BRAND = {
  primary: "#034792",
};

export default function KidsList({ kids, calculateAge, lastKidDoc, loadMoreKids, loading }) {
  return (
    <div>
      {/* tighter grid inside the narrow card */}
      <div className="px-2 py-2 grid grid-cols-1 gap-4 justify-items-center">
        {kids.map((kid) => (
          <KidCard
            kid={kid}
            calculateAge={calculateAge}
            key={kid?.id}
            style={{ minHeight: "300px", minWidth: "280px" }}
          />
        ))}
      </div>

      {lastKidDoc && (
        <div className="flex justify-center mt-2">
          <Button
            onClick={loadMoreKids}
            btnText={loading ? "Loading..." : "Load More"}
            color="bg-[#034792]"            // brand blue
            textColor="text-white"
            font="font-semibold"
            rounded="rounded-full"
            size="px-5 py-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import Header from "../Header";
import Button from "../Button";

const statusLabels = {
  approved: "Approved",
  pending_review: "Pending",
  rejected: "Rejected",
};

const headerStyles = {
  pending_review: {
    bg: "bg-[#034078]",
    badge: "bg-white/15 text-white",
  },
  approved: {
    bg: "bg-green-700",
    badge: "bg-white/15 text-white",
  },
  rejected: {
    bg: "bg-red-600",
    badge: "bg-white/15 text-white",
  },
};

export default function AdminHeader({
  activeFilter,
  setActiveFilter,
  status = "pending_review",
  isLoadingMore = false,
}) {
  const currentStyle = headerStyles[status] || headerStyles.pending_review;

  return (
    <Header className={`${currentStyle.bg} border-none shadow-md`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-none text-white">
            Admin Review
          </h1>

          <div className="mt-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${currentStyle.badge}`}
            >
              {statusLabels[status] || "Pending"}
            </span>
          </div>
        </div>

        <Button
          btnText={activeFilter ? "Hide" : "Filters"}
          color="white"
          textColor={
            status === "approved" 
              ? "text-[#4B7F2A]"
              : status === "rejected"
                ? "text-red-600"
                : "text-[#034078]"
          }
          size="xs"
          disabled={isLoadingMore}
          onClick={() => setActiveFilter(!activeFilter)}
        />
      </div>
    </Header>
  );
}

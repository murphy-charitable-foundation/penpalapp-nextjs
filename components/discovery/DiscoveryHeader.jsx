"use client";

import Header from "../general/Header";
import Button from "../general/Button";

export default function DiscoveryHeader({
  activeFilter,
  setActiveFilter,
}) {
  return (
    <Header className="bg-[#034078] border-none shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-none text-white">
            Choose a Kid
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            Find someone to write to
          </p>
        </div>

        <Button
          btnText={activeFilter ? "Hide" : "Filters"}
          color="white"
          textColor="text-[#034078]"
          size="xs"
          onClick={() => setActiveFilter(!activeFilter)}
        />
      </div>
    </Header>
  );
}
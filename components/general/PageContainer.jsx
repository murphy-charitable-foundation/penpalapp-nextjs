"use client";

const WIDTHS = {
  mobile: "max-w-md",      // 28rem
  compactXS: "max-w-[29rem]",
  compact: "max-w-lg",     // 32rem
  narrow: "max-w-xl",
  default: "max-w-2xl",
  wide: "max-w-4xl",
  full: "max-w-none",
};

const PADS = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function PageContainer({
  children,
  width = "compact",
  padding = "lg",
  bg = "bg-gray-100",
  center = true,
  scroll = true,
  fill = true,
  className = "",
  viewportOffset = 12, 
}) {
  return (
    <div className={`min-h-screen ${bg}`}>
      <div
        className={[
          "mx-auto w-full",
          WIDTHS[width] || WIDTHS.compact,
          center ? "min-h-screen flex items-center justify-center" : "",
        ].join(" ")}
      >
        <div
          className={[
            "w-full bg-white rounded-2xl shadow-card",
            PADS[padding] || PADS.lg,
            fill ? "max-h-[calc(100vh)]" : "",
            scroll ? "overflow-y-auto" : "overflow-hidden",
            className,
          ].join(" ")}
          style={fill ? { maxHeight: `calc(100vh - ${viewportOffset}px)` } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default PageContainer;

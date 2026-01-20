"use client";

const WIDTHS = {
  compactXS: "max-w-[29rem]",
  compact: "max-w-lg",
};

export function PageContainer({
  children,
  width = "compactXS",
  className = "",
}) {
  return (
    <div className="w-full flex justify-center">
      <div className={`w-full ${WIDTHS[width]}`}>
        <div
          className={`
            h-[100dvh]
            bg-white
            rounded-2xl
            shadow-lg
            overflow-y-auto   
            overscroll-contain
            scrollbar-gutter-stable
            flex
            flex-col
            ${className}
          `}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default PageContainer;

"use client";

export function PageBackground({ children, className = "" }) {
  return (
    <div
      className={`
        bg-gray-100
        min-h-dvh
        w-full
        flex
        justify-center
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default PageBackground;

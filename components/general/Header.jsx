"use client";

export default function Header({
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <header
      className={`sticky top-0 z-10 border-b border-gray-200 ${className}`}
    >
      <div className="px-5 py-4">
        {children || (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
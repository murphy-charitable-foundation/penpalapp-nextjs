export default function LetterHomeSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 animate-pulse"
        >
          {/* ردیف بالا */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="space-y-1">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>

          {/* ردیف پایین */}
          <div className="flex items-center gap-2 mt-3">
            <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
            <div className="h-3 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

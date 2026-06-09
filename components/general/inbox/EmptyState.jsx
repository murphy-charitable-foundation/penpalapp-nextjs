export default function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-24 h-24 bg-green-700 rounded-full flex items-center justify-center mb-6">
        {Icon ? <Icon className="w-12 h-12 text-white" /> : (
          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <h3 className="text-2xl font-semibold text-green-700 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 text-center">
        {description}
      </p>
    </div>
  );
} 
const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  xxl: 'max-w-2xl',
};

const colors = {
    gray: 'bg-gray-300 hover: bg-gray-400 text-white',
    transparent: 'bg-transparent hover: bg-gray-400 text-black',
    white: 'bg-gray-100'
  };

export function PageContainer({
  children,
  className = '',
  maxWidth = 'md',
  bgColor = "bg-gray-100",
  color,
}) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${bgColor}`}>
      <div 
        className={`
          w-full 
          ${maxWidthClasses[maxWidth]}
          ${colors[color]}
          p-8
          space-y-8 
          bg-white 
          rounded-lg 
          shadow-md
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
} 
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  padding?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function PageContainer({
  children,
  className = '',
  maxWidth = 'md',
  padding = 'p-8',
}: PageContainerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div 
        className={`
          w-full 
          ${maxWidthClasses[maxWidth]} 
          ${padding} 
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
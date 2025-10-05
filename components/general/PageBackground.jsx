"use client";




export function PageBackground({
    children,
    className,
}
) {
  

  return (
    <>
        <div 
          id="background" 
          className={`
            bg-gray-100 
            min-h-screen
            relative 
            ${className}

            w-full 
            flex 
            flex-col 
            items-center 
            justify-center 
            p-4 pb-20
          `}
        >
            {children}
        </div>
    
    </>
      
  );
}
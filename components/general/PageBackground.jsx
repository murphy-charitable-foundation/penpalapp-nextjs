"use client";




export function PageBackground({
    children,
    className,
}
) {
  

  return (
    <>
        <div id="background" className={`bg-gray-100 min-h-screen py-6 relative ${className}`}>
            {children}
        </div>
    
    </>
      
  );
}
import React from 'react';

export default function LoadingSpinner({ isPending }) {
  return (
   <>
   {isPending &&
        <div className='fixed top-0 right-0 left-0 bottom-0 bg-black bg-opacity-95 z-20'>
            <div className='centered-thing z-50'>
                <div className="w-[200px] h-[200px] spinner flex flex-wrap items-center justify-center">
                        <div className="spinner-circle w-[200px] h-[200px] border-8 border-solid border-blue-100 border-t-red-300 rounded-full animate-spin"></div>
                        <div className='w-full text-center'>
                            <p className='text-white text-3xl'>Loading...</p>
                        </div>
                </div>
                
            </div>
        </div>
    }
   </> 
  )
}

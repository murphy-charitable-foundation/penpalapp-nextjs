import React from 'react'
import Image from "next/image";
import welcomeImage from '/public/welcomebackground.jpeg';

export default function LoadingSpinner({isPending, user}) {
    const imageStyle = {
        borderRadius: '100px',
        border: '1px solid #fff',
    }
  return (
    
    <>
        {
            isPending &&
            <div className='fixed top-0 right-0 left-0 bottom-0 bg-black bg-opacity-95 z-20'>
            {/* <div className='fixed top-0 right-0 left-0 bottom-0 bg-white bg-opacity-95 z-20'> */}
                <div className='centered-thing z-50'>
                    <div className="w-[200px] h-[200px] spinner flex flex-wrap items-center justify-center">
                        

                            <div className="spinner-circle w-[200px] h-[200px] border-8 border-solid border-blue-100 border-t-red-300 rounded-full animate-spin"></div>
                            <div className='w-full text-center'>
                                <p className='text-white text-3xl'>Loading...</p>
                            </div>
                    </div>
                    {/* <div role="status" class="animate-pulse">
                        <div class="h-6 bg-gray-200 rounded-xs dark:bg-gray-700 w-48 mb-8"></div>
                        <div class="flex justify-between items-center w-full">
                            <div class="flex items-center w-full dark:bg-gray-700"></div>
                            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                        </div>
                        <div class="flex items-center mt-4">
                            <svg class="w-10 h-10 me-3 text-gray-200 dark:text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>
                            </svg>
                            <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2"></div>
                        </div>
                        <span class="sr-only">Loading...</span>
                    </div> */}
                </div>
            </div>
        }
    </>
    
  )
}
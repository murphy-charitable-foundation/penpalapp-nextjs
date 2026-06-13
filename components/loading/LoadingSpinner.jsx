import React from 'react';
import Image from "next/image";
import logo from "/public/murphylogo.png";
import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner() {
  return (
    <>
        <div className="w-full flex items-center justify-center min-h-screen bg-white fixed top-0 left-0 z-[100]">
            <div className="relative flex flex-col items-center">
                <Image
                    src={logo}
                    alt="Murphy Charitable Foundation Uganda"
                    width={150}
                    height={150}
                    className="z-10"
                />
                <div className="absolute inset-0 flex items-center justify-center">

                    <div
                        className="w-40 h-40 border-4 border-t-[#4E802A] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">

                    <div
                        className={`w-40 h-40 border-4 border-t-[#034792] border-r-transparent border-b-transparent border-l-transparent rounded-full ${styles['animate-reverse-spin']}`}></div>
                </div>
            </div>
        </div>
    </>
    
  )
}

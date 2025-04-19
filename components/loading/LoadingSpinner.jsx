import React from 'react';
import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({isPending}) {
  return (
    
    <>
        {
            isPending &&
            <div className='fixed top-0 right-0 left-0 bottom-0 bg-white z-20'>
            {/* <div className='fixed top-0 right-0 left-0 bottom-0 bg-white bg-opacity-95 z-20'> */}
                <div className='centered-thing z-50'>
                    <div className="w-[200px] h-[200px] spinner flex flex-wrap items-center justify-center">
                        {/* Spinner */}
                        <div className={styles['loading-wrap']}>
                            <div className={styles['loading-inner']}></div>
                        </div>
                        <div className='w-full text-center'>
                            <p className='text-xl'>Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        }
    </>
    
  )
}
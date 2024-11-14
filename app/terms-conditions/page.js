// pages/terms-conditions.js

import Link from 'next/link';
import Image from 'next/image';
import logo from '/public/murphylogo.png';


export default function TermsCondition() {

    return (
        //<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="bg-white p-8 min-h-screen">
            <div style={{ textAlign: 'left', padding: '0px', background: 'white' }}>
                <div className="flex flex-row items-center justify-center ">
                <Link href="/create-acc">
                    <button style={{position:'absolute', left:30, border:'none', background:'none'}}>
                        <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </Link>
                <h2 className="mt-6 text-center text-2xl font-bold text-gray-800">
                    Terms and Conditions
                </h2>
                </div>

                <div className="flex justify-center mb-6 mt-6">
                    <Image
                        src={logo}
                        alt="Murphy Charitable Foundation Uganda"
                        width={150} 
                        height={150} 
                    />
                </div>

                <div className="flex flex-col gap-10 mt-16">
                  <div class="container" className="flex items-center justify-between  word-break:break-all">
                  <p className="font-medium font-inter text-black leading-[1.8rem] margin-20px">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                  </div>
                  
                  <div class="container" className="flex items-center justify-between  word-break:break-all">

                  <p className="font-medium font-inter text-black leading-[1.8rem]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. 
                  
                  </p>
                
                  </div>
                </div>

            </div>
            </div>
        //</div>
    );
}
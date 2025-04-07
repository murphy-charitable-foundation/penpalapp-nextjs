
"use client"

import { useParams } from 'next/navigation';

import Image from 'next/image';
import Link from 'next/link';


export default function welcome() {
    const params = useParams(); // { id: '123' }
    return (
        <div className="min-h-screen !bg-[#034792]">
            <div className="max-w-lg mx-auto text-white">
                <Image
                    src="/welcome.png"
                    width={393}
                    height={411}
                    layout="responsive"
                    alt='Welcome'
                />
                <h3 className='pt-16 text-center w-full font-[700] text-2xl'>
                    Welcome,{params.name}
                </h3>
                <div className='text-center w-full pt-5'>
                We are so happy to be here, thanks for your support. Now you are part of the family. 
                </div>
                <div className='text-center w-full fixed bottom-10'>
                    <Link href="/edit-profile-user-image">
                        <button className="bg-white text-[#111111] px-16 py-2 rounded-full font-semibold">
                        Continue
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

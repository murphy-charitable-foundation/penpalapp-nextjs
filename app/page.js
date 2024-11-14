// page.js
import Image from 'next/image';
import logo from '/public/murphylogo.png';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div className="bg-white p-8 min-h-screen">
    <div style={{ textAlign: 'left', padding: '0px', background: 'white' }}>
        <div className="flex flex-row items-center justify-center ">
        <Link href="/cover">
            <button style={{position:'absolute', left:30, border:'none', background:'none'}}>
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-800">
            
        </h2>
        </div>

        <div style={{marginTop:"76px"}}className="flex justify-center mb-6 mt-6">
            <Image
                src={logo}
                alt="Murphy Charitable Foundation Uganda"
                width={177} 
                height={177} 
            />
        </div>
     

      
      <div className="flex flex-col justify-center gap-8 md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-28">
        <Link href="/login">
          <button style={{
            width:"229 px",
            height:"40 px",
          }}
          className="group relative  w-full flex justify-center  py-3 px-6 border border-transparent rounded-full text-sm font-medium  text-gray-400 bg-gray-200 hover:bg-[#48801c] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-transparent">
            Log in
          </button>
        </Link>
      </div>

      <div className="flex flex-col justify-center gap-8 md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-28">
        <Link href="https://calendly.com/murphycharity/60min">
          <button style={{
            width:"229 px",
            height:"40 px",
          }}
          className="group relative  w-full flex justify-center py-3 px-6 border border-transparent rounded-full text-sm font-medium  text-gray-400 bg-gray-200 hover:bg-[#034792] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-transparent">
            Become a Pen Pal Volunteer
          </button>
        </Link>
      </div>
    </div>
    </div>
    </div>
    
  );
}
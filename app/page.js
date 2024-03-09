
// page.js
import Image from 'next/image';
import logo from '/public/murphylogo.png';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
     
      <div className="mb-8 text-center">
        <div className="relative w-40 h-40 md:w-48 md:h-48"> 
          <Image
            src={logo}
            alt="Murphy Charitable Foundation Uganda"
            layout="fill" 
            objectFit="contain"
          />
        </div>
        <h1 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">Murphy Charitable Foundation Uganda</h1>
      </div>

      
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-700">Dedicated to Beloved Friend Aisu Stephen</h2>
      </div>

      
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-6">
        <Link href="/login">
          <button className="px-6 py-3 text-sm md:text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow hover:shadow-md transition duration-200 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
            Log in
          </button>
        </Link>
        <button className="px-6 py-3 text-sm md:text-base font-semibold text-white bg-blue-600 rounded-md shadow hover:shadow-md transition duration-200 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
          Become a Pen Pal Volunteer
        </button>
      </div>
    </div>
  );
}


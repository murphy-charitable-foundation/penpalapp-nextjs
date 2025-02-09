// page.js
import Image from "next/image";
import logo from "/public/murphylogo.png";
import Link from "next/link";
import Button from "../components/Button";
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Link href="/cover" className="inline-block">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <svg
                className="h-6 w-6 text-gray-600" 
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </Link>

          <div className="flex flex-col items-center my-12">
            <Image
              src={logo}
              alt="Murphy Charitable Foundation Uganda"
              width={120}
              height={120}
              className="drop-shadow-md"
            />
            <h1 className="text-3xl font-bold mt-6 text-gray-900 text-center">
              Welcome to the Pen Pal App
            </h1>
            <p className="text-lg text-gray-600 mt-3 text-center">
              Write, connect and inspire children in Uganda
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-12">
            <Link href="/login" className="w-full">
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg">
                Log in
              </button>
            </Link>
            
            <Link href="https://calendly.com/murphycharity/60min" className="w-full">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg">
                Become a Pen Pal Volunteer
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
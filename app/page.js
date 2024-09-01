// page.js
import Image from "next/image";
import logo from "/public/murphylogo.png";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
      <div className="w-full max-w-md space-y-8">
        <div
          style={{
            textAlign: "left",
            padding: "20px",
            background: "white",
            height: "80%",
          }}
        >
          <Link href="/cover">
            <button
              style={{
                border: "none",
                background: "none",
              }}
            >
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
          <div className="flex justify-center mb-40">
            <Image
              src={logo}
              alt="Murphy Charitable Foundation Uganda"
              width={150}
              height={150}
            />
          </div>
          <div className="flex flex-col gap-10 jsu mb-36 items-center">
            <Link href="/login">
              <button className="bg-[#48801c] hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full w-72">
                Log in
              </button>
            </Link>
            <Link href="https://calendly.com/murphycharity/60min">
              <button className="bg-[#034792]  hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full w-72">
                Become a Pen Pal Volunteer
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

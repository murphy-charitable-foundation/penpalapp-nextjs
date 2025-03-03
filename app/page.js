// page.js
import Image from "next/image";
import logo from "/public/murphylogo.png";
import Link from "next/link";
import Button from "@/components/general/Button";

export default function Home() {
  return (
      <div className="flex flex-col items-center min-h-screen bg-white">
          <div className="w-full max-w-md flex flex-col justify-between min-h-screen p-5">
              <div className="flex justify-center">
                  <Image
                      src={logo}
                      alt="Murphy Charitable Foundation Uganda"
                      width={150}
                      height={150}
                      className="mt-10"
                  />
              </div>

              <div className="flex flex-col gap-[8px] items-center justify-center flex-grow">
                  <h1 className="font-bold text-2xl text-black text-center">
                      Welcome to Pen Pal App
                  </h1>
                  <p className="font-semibold text-lg text-black max-w-[300px] text-center">
                      Write, connect, and inspire children in Uganda
                  </p>
              </div>

              <div className="flex flex-col gap-4 items-center pb-10">
                  <Link href="/login">
                      <Button
                          color="bg-[#4E802A]"
                          hoverColor="hover:bg-green-800"
                          btnText="Log in"
                      />
                  </Link>
                  <Link href="https://calendly.com/murphycharity/60min">
                      <Button
                          color="bg-[#034792]"
                          hoverColor="hover:bg-blue-800"
                          btnText="Become a Pen Pal Volunteer"
                      />
                  </Link>
              </div>
          </div>
      </div>
  );
}

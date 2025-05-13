"use client";
// page.js


import Image from "next/image";
import logo from "/public/murphylogo.png";
import Link from "next/link";
import Button from "../components/general/Button";
import { BackButton } from "../components/general/BackButton";

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
            <BackButton
              btnType="button"
              color="transparent"
              textColor="text-gray-600"
              onClick={() => router.push("/cover")}
              size="xs"
            />
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
              <Button
                color={"green"}
                btnText={"Log in"}
              />
            </Link>
            <Link href="https://calendly.com/murphycharity/60min">
              <Button
                color={"blue"}
                btnText={"Become a Pen Pal Volunteer"}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
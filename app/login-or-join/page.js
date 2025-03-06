// page.js
import Image from "next/image";
import logo from "/public/murphylogo.png";
import Link from "next/link";
import Button from "@/components/general/Button";

export default function LoginOrJoin() {
    return (
        <div className="flex flex-col items-center justify-between min-h-screen bg-white px-6">
            <div className="flex flex-col mt-[82px]">
                <div className="flex justify-center mb-40">
                    <Image
                        src={logo}
                        alt="Murphy Charitable Foundation Uganda"
                        width={150}
                        height={150}
                    />
                </div>

                <div className="text-center mb-10">
                    <h1 className="font-bold text-2xl text-black py-1">
                        Welcome to Pen Pal App
                    </h1>
                    <p className="font-semibold text-lg text-black max-w-[260px] m-auto">
                        Write, connect, and inspire children in Uganda
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-2 items-center pb-10">
                <Link href="/login">
                    <Button
                        color={"bg-green-700"}
                        hoverColor={"hover:bg-green-800"}
                        btnText={"Log in"}
                    />
                </Link>
                <Link href="https://calendly.com/murphycharity/60min">
                    <Button
                        color={"bg-blue-700"}
                        hoverColor={"hover:bg-blue-800"}
                        btnText={"Become a Pen Pal Volunteer"}
                    />
                </Link>
            </div>
        </div>
    );
}

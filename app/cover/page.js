"use client";

import {useEffect} from "react";
import Image from "next/image";
import Link from "next/link";
import {useRouter} from "next/navigation";
import logo from "/public/murphylogo.png";
import bgImage from "/public/cover.png";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        let touchStartX = 0;
        let touchEndX = 0;

        const handleTouchStart = (e) => {
            touchStartX = e.touches[0].clientX;
        };

        const handleTouchMove = (e) => {
            touchEndX = e.touches[0].clientX;
        };

        const handleTouchEnd = () => {
            const swipeDistance = touchEndX - touchStartX;
            const minSwipeDistance = 50;

            if (swipeDistance > minSwipeDistance) {
                router.push("/");
            }
        };

        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("touchend", handleTouchEnd);

        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [router]);

    return (
        <Link href="/" className="block">
            <div className="relative flex flex-col bg-gray-100 min-h-screen">
                <Image
                    src={bgImage}
                    alt="Murphy Charitable Foundation Uganda"
                    fill
                    className="object-cover"
                />

                <div className="mb-6 mt-9 flex justify-center items-center z-10">
                    <div className="relative w-40 h-40 md:w-48 md:h-48 animate-fade-in">
                        <Image
                            src={logo}
                            alt="Murphy Charitable Foundation Uganda"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>
        </Link>
    );
}
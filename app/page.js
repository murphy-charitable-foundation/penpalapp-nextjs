// page.js
import Image from "next/image";
import logo from "/public/murphylogo.png";
import Link from "next/link";
import Button from "../components/general/Button";

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
            <Button
              btnType="button"
              btnText="←"
              color="bg-transparent"
              textColor="text-gray-600"
              onClick={() => router.push("/cover")}
              size="w-auto"
              rounded="rounded-lg"
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
                color={"bg-green-800"}
                hoverColor={"hover:bg-green-700"}
                btnText={"Log in"}
                rounded={"rounded-3xl"}
              />
            </Link>
            <Link href="https://calendly.com/murphycharity/60min">
              <Button
                color={"bg-blue-900"}
                hoverColor={"hover:bg-blue-700"}
                btnText={"Become a Pen Pal Volunteer"}
                rounded={"rounded-3xl"}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
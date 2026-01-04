"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import Button from "../../components/general/Button";
import { PageBackground } from "../../components/general/PageBackground";
import PageContainer from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";

export default function Welcome() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <PageBackground className="bg-gray-100 h-screen flex items-center justify-center overflow-hidden">
      <PageContainer
        width="compactXS"
        padding="none"
        center={false}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {/* HEADER */}
        <PageHeader title="Welcome" image={false} />

        {/* CONTENT – NO SCROLL */}
        <div className="px-6 pb-8 flex flex-col items-center text-center gap-6 pt-6">
          {/* IMAGE */}
          <div className="w-full aspect-[4/3] max-h-[45vh] relative overflow-hidden rounded-xl">
            <Image
              src="/welcome.png"
              alt="Picture of kids"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* TEXT */}
          <p className="leading-relaxed text-gray-700">
            We are so happy to be here, thanks for your support.
            <br />
            Now you are part of the family.
          </p>

          {/* CTA */}
          <Button
            btnText="Continue"
            color="blue"
            onClick={() =>
              startTransition(() => {
                router.push("/edit-profile-user-image");
              })
            }
          />
        </div>
      </PageContainer>
    </PageBackground>
  );
}

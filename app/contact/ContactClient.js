export const dynamic = "force-static";

export const metadata = {
  title: "Contact - Murphy Charitable Foundation Uganda",
};

import Image from "next/image";
import {
  FaInstagram,
  FaLinkedinIn,
  FaEnvelope,
  FaGlobe,
} from "react-icons/fa";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";
import NavBar from "../../components/bottom-nav-bar";

export default function Contact() {
  const socialLinks = [
    {
      name: "Instagram",
      url: "https://www.instagram.com/murphycharity_/",
      icon: <FaInstagram className="h-5 w-5" />,
      accent: "from-[#0B4EA2] to-[#1D6FD6]",
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/company/murphy-charitable-foundation-uganda",
      icon: <FaLinkedinIn className="h-5 w-5" />,
      accent: "from-[#0B4EA2] to-[#1D6FD6]",
    },
    {
      name: "Email",
      url: "mailto:rez@murphycharity.org",
      icon: <FaEnvelope className="h-5 w-5" />,
      accent: "from-[#3A9B3A] to-[#67C23A]",
    },
    {
      name: "Website",
      url: "https://murphycharity.org",
      icon: <FaGlobe className="h-5 w-5" />,
      accent: "from-[#0B4EA2] to-[#3A9B3A]",
    },
  ];

  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col">
      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="min-h-[100dvh] flex flex-col bg-[#F7F9FC] rounded-2xl shadow-lg overflow-hidden"
        >
          <PageHeader title="Contact Us" image={false} showBackButton />

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-10 pb-8">
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-white p-2 shadow-sm ring-1 ring-blue-100">
                <Image
                  src="/murphylogo.png"
                  alt="Murphy Charitable Foundation logo"
                  width={88}
                  height={88}
                  priority
                  className="rounded-full"
                />
              </div>
            </div>

            <p className="text-center text-[#1F3D63] text-lg font-medium mb-10">
              Reach out to us here
            </p>

            <div className="space-y-5">
              {socialLinks.map((link) => {
                const isExternal = !link.url.startsWith("mailto:");

                return (
                  <a
                    key={link.name}
                    href={link.url}
                    {...(isExternal
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="mx-auto grid w-full max-w-[500px] grid-cols-[48px_1fr_48px] items-center rounded-2xl border border-[#DCE6F3] bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${link.accent} text-white shadow-sm`}
                    >
                      {link.icon}
                    </div>

                    <span className="text-center text-lg font-semibold text-[#0B4EA2]">
                      {link.name}
                    </span>

                    <div />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-t bg-blue-100 rounded-b-2xl">
            <NavBar />
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}
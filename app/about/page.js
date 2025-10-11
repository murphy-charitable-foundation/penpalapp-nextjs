"use client";

import Image from "next/image";
import BottomNavBar from "../../components/bottom-nav-bar";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { logLoadingTime } from "../utils/analytics";
import { usePageAnalytics } from "../useAnalytics";
import { useEffect } from "react";

export default function About() {
  usePageAnalytics("/about");
  return (
    <PageBackground className="flex flex-col items-center justify-center p-4 pb-20">
      <PageContainer maxWidth="xxl">
        <BackButton />
        <div className="p-6">
          <h2 className="text-center text-4xl text-blue-600 font-bold mb-6">
            About Us
          </h2>
          <Image
            src="/aboutimage.png"
            alt="About Us"
            width={640}
            height={360}
            className="rounded-lg mb-6"
          />
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Since its establishment in 2018, Murphy Charitable Foundation Uganda
            has made a significant impact on the lives of over 10,000
            impoverished individuals in East-Northern Uganda. Through a diverse
            range of programs, including pen pal initiatives, women empowerment,
            youth empowerment, cancer awareness, child sponsorship,
            entrepreneurship, community outreaches, capacity building,
            mentoring, and community research on poverty levels in families, our
            organization has worked tirelessly to serve our communities and
            improve their well-being.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            In addition to our existing programs, we also actively engage with
            local schools and hospitals. We recognize the importance of
            education and healthcare in creating a better future for the
            communities we serve. We visit schools to provide educational
            support, including supplies, resources, and mentorship opportunities
            to students. By doing so, we aim to enhance learning experiences and
            encourage academic achievement.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            Our organization’s commitment to humanitarian work has brought about
            lasting change in the project areas across Uganda. We extend our
            support to disadvantaged individuals without discrimination based on
            race or religion, firmly believing that every person in need
            deserves a helping hand. By implementing these programs, we aim to
            uplift communities and create sustainable solutions to the
            challenges they face.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed">
            As the Murphy Charitable Foundation Uganda continues to grow and
            evolve, we remain dedicated to expanding our impact and finding new
            ways to serve those in need. By leveraging the power of
            collaboration, community engagement, and innovation, we strive to
            make a positive difference and contribute to the development and
            well-being of the people we serve.
          </p>
        </div>

        <div className="bg-blue-600 text-white p-6">
          <blockquote className="italic text-lg text-center">
            Together, we can create a brighter future for the children of
            Uganda.
          </blockquote>
        </div>
      </PageContainer>
      <BottomNavBar />
    </PageBackground>
  );
}

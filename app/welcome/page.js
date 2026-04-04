export const dynamic = "force-static";

export const metadata = {
  title: "Welcome",
};

import WelcomeClient from "./WelcomeClient";
import PageBackground from "@/components/general/PageBackground";
import PageContainer from "@/components/general/PageContainer";

export default function Page() {
  return (
    <PageBackground className="min-h-screen !bg-primary">
      <PageContainer className="max-w-lg mx-auto text-white flex flex-col min-h-screen">
        <WelcomeClient />
      </PageContainer>
    </PageBackground>
  );
}

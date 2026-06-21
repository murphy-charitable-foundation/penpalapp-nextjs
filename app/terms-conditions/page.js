export const dynamic = "force-static";

export const metadata = {
  title: "Terms & Conditions",
};

import { PageHeader } from "../../components/general/PageHeader";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";

export default function TermsCondition() {
  return (
    <PageBackground className="bg-gray-100 h-screen flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex justify-center">
        <PageContainer
          width="compactXS"
          padding="none"
          center={false}
          className="
            min-h-[100dvh]
            flex flex-col
            bg-white
            rounded-2xl
            shadow-lg
            overflow-hidden
          "
        >
          {/* ===== HEADER ===== */}
          <PageHeader title="Terms and Conditions" imageSize="sm" />

          {/* ===== SCROLLABLE CONTENT ===== */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
            <div className="space-y-8 text-gray-800 leading-relaxed text-sm">
            
              <p><strong>Last Updated:</strong> June 20, 2026</p>
              
              <p class="intro">
                Below are our terms for using the App:
              </p>

              <h2>1. Respectful Engagement</h2>
              <ul>
                <li>International pen pals must communicate with children in a respectful, appropriate, educational, motivational, and hope-inspiring manner.</li>
                <li>Harassment, threats, or intimidation of children are strictly prohibited.</li>
                <li>The use of hate speech, discriminatory language, or offensive content is not allowed.</li>
              </ul>

              <h2>2. Appropriate Content</h2>
              <ul>
                <li>Sharing explicit, adult, violent, or harmful content with children is forbidden.</li>
                <li>Any form of nudity, pornography, or sexually explicit material is strictly prohibited.</li>
              </ul>

              <h2>3. No Spamming</h2>
              <ul>
                <li>International pen pals must refrain from using the App for spamming purposes.</li>
              </ul>

              <h2>4. Consequences of Violations</h2>
              <ul>
                <li>Violation of these terms may result in the temporary or permanent suspension of the international pen pal’s account.</li>
              </ul>

              <h2>5. Age Requirement</h2>
              <ul>
                <li>International pen pals must be 20 years old or above, or have parental consent to use the App.</li>
              </ul>

              <h2>6. Appropriate Use of Services</h2>
              <ul>
                <li>International pen pals should only use the App for its intended purpose and within the scope of its features.</li>
                <li>Any misuse or abuse of the App or its services is strictly prohibited.</li>
              </ul>

              <h2>7. Privacy Protection</h2>
              <ul>
                <li>The personal information and data of international pen pals and children will be safeguarded and kept private between the admin, the child, and the international pen pal.</li>
              </ul>

              <h2>8. Feedback and Suggestions</h2>
              <ul>
                <li>We encourage international pen pals and children to provide feedback, suggestions, or report issues with the App by sending a direct message to the admin.</li>
              </ul>

              <h2>9. Disclaimer of Liability</h2>
              <ul>
                <li>The administrators are responsible for monitoring content shared or exchanged by children and their international friends.</li>
              </ul>

              <h2>10. Prohibited Activities</h2>
              <ul>
                <li>International pen pals must not engage in hacking, introducing viruses, or any other malicious activity that disrupts the normal functioning of the App.</li>
              </ul>

              <h2>11. Moderation of Content</h2>
              <ul>
                <li>The App administration will moderate and review all letters sent by either children or international pen pals for compliance with these Terms of Use.</li>
                <li>Inappropriate or violating content will be removed at the discretion of the App administration.</li>
              </ul>

              <h2>12. Changes to this Privacy Policy</h2>
              <ul>
                <li>We may update this Privacy Policy from time to time. We will post any changes on our website.</li>
              </ul>

              <h2>13. Contact Information</h2>
              <ul>
                <li>As an international pen pal, you must share clear and correct contact information with the administrators so that you can be matched with children based on your preferences.</li>
              </ul>
            </div>
          </div>
        </PageContainer>
      </div>
    </PageBackground>
  );
}

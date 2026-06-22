export const dynamic = "force-static";

import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { PageHeader } from "../../components/general/PageHeader";

export default function PrivacyPolicy() {
  return (
    <PageBackground>
      <PageContainer maxWidth="lg">
        <PageHeader title="Privacy Policy" />
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
            <div className="space-y-8 text-gray-800 leading-relaxed text-sm">
              <p><strong>Last Updated:</strong> June 20, 2026</p>

              <p>Welcome to the <strong>Murphy Charity Foundation Pen Pal App</strong> (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). This Privacy Policy explains how we collect, use, and handle your information when you use our chat and messaging application. As a nonprofit organization, we like to keep things simple, transparent, and focused on our mission.</p>

              <p>By using the app, you agree to the practices described below. If you do not agree, please do not use the app.</p>

              <h2>1. The Information We Collect</h2>
              <p>To make the Pen Pal app work and connect you with others, we collect a few basic types of information:</p>
              <ul>
                  <li><strong>Account Data:</strong> Information you provide when you sign up, such as your name, email address, profile picture, and any other details you add to your profile.</li>
                  <li><strong>Chat Data:</strong> The letters, messages, photos, and any other content you send and receive in the app.</li>
                  <li><strong>Basic Usage Data:</strong> Standard information automatically collected by our servers to keep the app running, such as your device type, IP address, and basic log data (like when you log in or send a message).</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <p>We use your data simply to keep the app running safely and to fulfill our mission. Specifically, we use it to:</p>
              <ul>
                  <li>Create and manage your account.</li>
                  <li>Deliver your messages to your pen pal(s).</li>
                  <li>Enforce our rules and maintain a safe, respectful environment for all users.</li>
                  <li>Fix bugs and improve the app&apos;s functionality.</li>
              </ul>

              <h2>3. Moderation and Your Messages</h2>
              <p>Because our app is used to connect volunteers, supporters, and vulnerable community members, maintaining a safe space is our top priority. To enforce the rules outlined in our <strong>Terms & Conditions</strong>, we rely on human moderators.</p>

              <p><strong>What this means for your privacy:</strong>
              By using the Pen Pal app, you acknowledge and agree that your chat messages and shared media are not strictly private. Our human moderators have the ability to read and review messages, chats, and accounts—especially if content is flagged or if we need to ensure our rules are being followed. We do this solely to keep the platform safe and ensure our T&C are respected. We do not read your messages to sell you ads.</p>

              <h2>4. Who We Share Your Data With</h2>
              <p>We do not sell your personal data. We only share it in these specific, necessary situations:</p>
              <ul>
                  <li><strong>With Your Pen Pal:</strong> The people you are matched and chat with will see your messages and profile.</li>
                  <li><strong>With Service Providers:</strong> We use third-party services to host the app and store data (like cloud servers). They only process data to keep the app online and functioning.</li>
                  <li><strong>For Legal and Safety Reasons:</strong> We will hand over information to law enforcement or government authorities if we are legally required to do so, or if we need to report severe safety threats, abuse, or illegal activity.</li>
              </ul>

              <h2>5. Data Retention and Deletion</h2>
              <p>We keep your account info and chat data for as long as your account is active.</p>
              <ul>
                  <li><strong>Deleting Your Account:</strong> If you no longer wish to participate in the pen pal program, you can delete your account by emailing your request to <a href="mailto:info@murphycharity.org">info@murphycharity.org</a>. When you delete your account, we will remove your personal data from our active databases.</li>
                  <li><strong>Banned Accounts:</strong> If you are removed from the app for breaking our rules, we may retain some basic account identifiers to prevent you from creating a new account.</li>
              </ul>

              <h2>6. Security</h2>
              <p>We take reasonable, standard steps to protect your data from unauthorized access. However, no app or internet transmission is 100% secure, so we cannot guarantee absolute security. Please be mindful of what personal information you choose to share online and in your letters.</p>

              <h2>7. Your Choices</h2>
              <p>Our website is not directed towards children under the age of 13. We do not knowingly collect personal information from children under 13.</p>

              <h2>8. Changes to this Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will post any changes on our website.</p>

              <h2>9. Contact Us</h2>
              <p>If you have questions about your data, want to request account deletion, or need to reach the Murphy Charity Foundation team, you can contact us at:</p>
              <p>
                  <strong>Email:</strong> <a href="mailto:info@murphycharity.org">info@murphycharity.org</a><br />
                  <strong>Website:</strong> <a href="https://www.murphycharity.org" target="_blank">www.murphycharity.org</a>
              </p>
            </div>
          </div>
      </PageContainer>
    </PageBackground>
  );
}

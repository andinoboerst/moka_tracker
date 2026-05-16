import Header from '@/components/Header'

export default function TermsOfService() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#2d2520] border border-[#3d3530] rounded-xl p-8 shadow-xl">
          <h1 className="text-4xl font-serif font-bold text-[#d4a574] mb-8">
            Terms of Service
          </h1>

          <div className="space-y-8 text-[#f5f1ed] leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Moka Pot Brewing Tracker service, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Moka Pot Brewing Tracker is a web application that allows users to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>Track coffee brewing parameters and tasting notes</li>
                <li>Manage inventory of coffee beans, grinders, and moka pots</li>
                <li>Receive AI-powered brewing insights and recommendations</li>
                <li>Analyze brewing patterns through visual charts</li>
                <li>Share brewing experiences (optional)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">3. User Accounts</h2>
              <p className="mb-4">
                To use certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Notify us immediately of unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not share your account credentials with others</li>
              </ul>
              <p className="mt-4">
                You may create an account using email/password, Google OAuth, or use anonymous guest access with limited features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">4. User Responsibilities</h2>
              <p className="mb-4">
                As a user of our service, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>Use the service for personal, non-commercial purposes</li>
                <li>Not attempt to gain unauthorized access to our systems</li>
                <li>Not use the service to distribute malware or harmful content</li>
                <li>Not interfere with other users' use of the service</li>
                <li>Not reverse-engineer or attempt to extract source code</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">5. Content and Data</h2>
              <p className="mb-4">
                Regarding content you provide:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>You retain ownership of all brewing data and content you create</li>
                <li>You grant us a license to store, process, and display your data for service provision</li>
                <li>You represent that you have the right to share any content you upload</li>
                    <li>We may use anonymized, aggregated data for service improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">6. AI Features</h2>
              <p className="mb-4">
                When using AI-powered features:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>AI-generated content is provided for informational purposes only</li>
                <li>We do not guarantee the accuracy or completeness of AI recommendations</li>
                <li>AI suggestions should not replace professional advice</li>
                <li>You may disable AI features at any time</li>
                <li>Your data sent to AI providers is subject to their privacy policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">7. Service Availability</h2>
              <p className="mb-4">
                We strive to maintain high service availability, but:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>We do not guarantee 100% uptime or uninterrupted service</li>
                <li>We may suspend service for maintenance or updates</li>
                <li>We are not liable for service interruptions</li>
                <li>We may discontinue features with reasonable notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">8. Privacy</h2>
              <p>
                Your use of our service is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using our service, you agree to the terms of our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">9. Intellectual Property</h2>
              <p className="mb-4">
                The service and its original content, features, and functionality are owned by Moka Pot Brewing Tracker and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                You may not use our trademarks, logos, or service marks without prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">10. Disclaimers</h2>
              <p className="mb-4">
                The service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>Merchantability and fitness for a particular purpose</li>
                <li>Non-infringement of third-party rights</li>
                <li>Accuracy or reliability of AI-generated content</li>
                <li>Security of data transmission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">11. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Moka Pot Brewing Tracker shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, profits, or other intangible losses, resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">12. Account Termination</h2>
              <p className="mb-4">
                We reserve the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>Suspend or terminate your account for violation of these terms</li>
                <li>Terminate accounts that have been inactive for extended periods</li>
                <li>Refuse service to anyone at any time</li>
              </ul>
              <p className="mt-4">
                Upon termination, your right to use the service will immediately cease. We will delete your account data upon your request or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">13. Changes to Terms</h2>
              <p>
                We may modify these terms at any time. We will notify users of significant changes by posting the new terms on this page. Your continued use of the service after such modifications constitutes your acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">14. Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Moka Pot Brewing Tracker operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">15. Contact Information</h2>
              <p>
                If you have questions about these Terms of Service, please contact us through the application or visit our website.
              </p>
            </section>

            <section className="pt-6 border-t border-[#3d3530]">
              <p className="text-sm text-[#8b6f47]">
                Last Updated: {new Date().toLocaleDateString()}
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

import Header from '@/components/Header'

export default function PrivacyPolicy() {
  const lastUpdated = new Date()
  const formattedLastUpdated = `${lastUpdated.getDate().toString().padStart(2, '0')}.${(lastUpdated.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${lastUpdated.getFullYear()}`

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#2d2520] border border-[#3d3530] rounded-xl p-8 shadow-xl">
          <h1 className="text-4xl font-serif font-bold text-[#d4a574] mb-8">
            Privacy Policy
          </h1>

          <div className="space-y-8 text-[#f5f1ed] leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                Moka Pot Brewing Tracker collects the following information to provide our services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li><strong className="text-[#f5f1ed]">Account Information:</strong> Email address, name (if provided), and authentication credentials</li>
                <li><strong className="text-[#f5f1ed]">Brewing Data:</strong> Coffee beans, grinders, moka pots, brew parameters, tasting notes, and ratings</li>
                <li><strong className="text-[#f5f1ed]">AI Interactions:</strong> Chat history and AI-generated summaries (if AI features are enabled)</li>
                <li><strong className="text-[#f5f1ed]">Technical Data:</strong> IP address, device information, and usage analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>Provide and improve our brewing tracking services</li>
                <li>Generate personalized AI recommendations and brewing insights</li>
                <li>Authenticate your account and secure your data</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Communicate with you about service updates (if you opt in)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">3. Data Storage and Security</h2>
              <p className="mb-4">
                All user data is stored securely using Supabase, which provides:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>Encryption at rest and in transit</li>
                <li>Row-Level Security (RLS) ensuring users can only access their own data</li>
                <li>Regular security updates and monitoring</li>
                <li>Compliance with industry-standard security practices</li>
              </ul>
              <p className="mt-4">
                Your brewing data is never shared with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">4. AI Features</h2>
              <p className="mb-4">
                When you use AI features (brew recaps, bean summaries, chat assistant), your brewing data is sent to Mistral AI for processing. We:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>Only send relevant brewing parameters and notes, not your entire database</li>
                <li>Do not use your data to train Mistral AI models</li>
                <li>Store AI-generated responses in your personal database</li>
                <li>Allow you to disable AI features at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">5. Authentication</h2>
              <p className="mb-4">
                We support multiple authentication methods:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li><strong className="text-[#f5f1ed]">Email/Password:</strong> Credentials are securely hashed and stored</li>
                <li><strong className="text-[#f5f1ed]">Google OAuth:</strong> We only request access to your email and basic profile information</li>
                <li><strong className="text-[#f5f1ed]">Anonymous Access:</strong> Guest users can try the app without creating an account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">6. Data Retention and Deletion</h2>
              <p className="mb-4">
                You have full control over your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>You can delete individual brews, beans, or equipment at any time</li>
                <li>You can permanently delete your entire account, which automatically removes all associated data</li>
                <li>Deleted data is removed from our databases with cascading deletes</li>
                <li>We retain minimal technical logs for security purposes only</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">7. Third-Party Services</h2>
              <p className="mb-4">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li><strong className="text-[#f5f1ed]">Supabase:</strong> Database hosting and authentication</li>
                <li><strong className="text-[#f5f1ed]">Mistral AI:</strong> AI-powered brewing insights (optional)</li>
                <li><strong className="text-[#f5f1ed]">Vercel:</strong> Application hosting and analytics</li>
                <li><strong className="text-[#f5f1ed]">Google:</strong> OAuth authentication provider</li>
              </ul>
              <p className="mt-4">
                Each service has its own privacy policy, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">8. Your Rights</h2>
              <p className="mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8b6f47]">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data or account</li>
                <li>Opt out of AI features</li>
                <li>Export your data</li>
                <li>Request information about data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">9. Children's Privacy</h2>
              <p>
                Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will take immediate steps to delete it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify users of significant changes by posting the new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#d4a574] mb-4">11. Contact Us</h2>
              <p>
                If you have questions about this privacy policy or your data, please contact us at{' '}
                <a href="mailto:support@mokatracker.com" className="text-[#d4a574] underline hover:text-[#f5f1ed]">
                  support@mokatracker.com
                </a>
                .
              </p>
            </section>

            <section className="pt-6 border-t border-[#3d3530]">
              <p className="text-sm text-[#8b6f47]">
                Last Updated: {formattedLastUpdated}
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

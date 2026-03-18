import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0f1117] py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <Link to="/" className="text-[#00b3b3] hover:text-[#009999] transition-colors">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-[#1a1f2e] rounded-lg p-8 border border-gray-800">
          <p className="text-gray-400 mb-6">Last updated: February 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 mb-3">
              We collect information you provide directly to us, such as when you create an account,
              deposit funds, place bets, or contact our support team. This information may include:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Name, email address, and phone number</li>
              <li>Date of birth and identification documents (for verification)</li>
              <li>Payment information and transaction history</li>
              <li>Betting history and preferences</li>
              <li>Device and usage information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-300 mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and verify your identity</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">3. Sharing of Information</h2>
            <p className="text-gray-300 mb-3">
              We do not share your personal information with third parties except in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>With your consent</li>
              <li>To comply with laws or to respond to lawful requests</li>
              <li>To protect our rights and property</li>
              <li>With service providers who perform services on our behalf</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Data Security</h2>
            <p className="text-gray-300">
              We implement appropriate technical and organizational measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction. All sensitive data is encrypted
              using industry-standard SSL/TLS protocols.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Your Rights</h2>
            <p className="text-gray-300 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Access and receive a copy of your personal information</li>
              <li>Rectify inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict processing of your information</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-gray-300">
              We use cookies and similar tracking technologies to track activity on our service and hold certain
              information. Cookies are files with a small amount of data which may include an anonymous unique
              identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Children's Privacy</h2>
            <p className="text-gray-300">
              Our service is not intended for individuals under the age of 18. We do not knowingly collect
              personal information from children. If you are a parent or guardian and you are aware that your
              child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-300">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review
              this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">9. Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="mt-4 p-4 bg-[#2a2f3f] rounded-lg">
              <p className="text-gray-300">📧 privacy@betzenith.com</p>
              <p className="text-gray-300">📞 +1 (800) BET-ZENITH</p>
              <p className="text-gray-300">📍 Grand Plaza, Suite 777 Gibraltar, GX11 1AA</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
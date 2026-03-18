import { Link } from 'react-router-dom';
import { FiShield, FiClock, FiLock, FiHeart } from 'react-icons/fi';

export default function ResponsibleGaming() {
  return (
    <div className="min-h-screen bg-[#0f1117] py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Responsible Gaming</h1>
          <Link to="/" className="text-[#00b3b3] hover:text-[#009999] transition-colors">
            ← Back to Home
          </Link>
        </div>
        <div className="bg-[#1a1f2e] rounded-lg p-8 border border-gray-800">
          <div className="flex items-center space-x-3 mb-8">
            <FiShield className="text-4xl text-[#00b3b3]" />
            <p className="text-xl text-gray-300">
              At BETZENITH, we are committed to providing a safe and enjoyable gaming environment for all our users.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#2a2f3f] rounded-lg p-4 text-center">
              <FiClock className="text-3xl text-[#00b3b3] mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">Set Limits</div>
              <p className="text-sm text-gray-400">Control your time and spending</p>
            </div>
            <div className="bg-[#2a2f3f] rounded-lg p-4 text-center">
              <FiLock className="text-3xl text-[#00b3b3] mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">Self-Exclusion</div>
              <p className="text-sm text-gray-400">Take a break when needed</p>
            </div>
            <div className="bg-[#2a2f3f] rounded-lg p-4 text-center">
              <FiHeart className="text-3xl text-[#00b3b3] mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">Get Support</div>
              <p className="text-sm text-gray-400">24/7 help and assistance</p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Understanding the Risks</h2>
            <p className="text-gray-300 mb-3">
              While sports betting can be an entertaining activity, it's important to understand that it carries
              financial risks. Betting should always be done for entertainment purposes only, and you should never
              bet more than you can afford to lose.
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
              <p className="text-yellow-400 font-semibold">⚠️ Warning Signs of Problem Gambling:</p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                <li>Spending more time or money than intended</li>
                <li>Chasing losses</li>
                <li>Lying about gambling activities</li>
                <li>Borrowing money to gamble</li>
                <li>Neglecting work or family responsibilities</li>
                <li>Feeling anxious or irritable when not gambling</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Setting Limits</h2>
            <p className="text-gray-300 mb-4">
              We provide several tools to help you stay in control of your betting activity:
            </p>
            <div className="space-y-4">
              <div className="bg-[#2a2f3f] rounded-lg p-4">
                <h3 className="text-[#00b3b3] font-semibold mb-2">Deposit Limits</h3>
                <p className="text-gray-400 text-sm">
                  Set daily, weekly, or monthly limits on how much you can deposit into your account.
                </p>
                <Link to="/dashboard" className="inline-block mt-2 text-sm text-[#00b3b3] hover:underline">
                  Set limits in Dashboard →
                </Link>
              </div>
              <div className="bg-[#2a2f3f] rounded-lg p-4">
                <h3 className="text-[#00b3b3] font-semibold mb-2">Loss Limits</h3>
                <p className="text-gray-400 text-sm">
                  Limit the amount you can lose over a specific period.
                </p>
              </div>
              <div className="bg-[#2a2f3f] rounded-lg p-4">
                <h3 className="text-[#00b3b3] font-semibold mb-2">Session Time Limits</h3>
                <p className="text-gray-400 text-sm">
                  Set a maximum time for your betting sessions.
                </p>
              </div>
              <div className="bg-[#2a2f3f] rounded-lg p-4">
                <h3 className="text-[#00b3b3] font-semibold mb-2">Self-Exclusion</h3>
                <p className="text-gray-400 text-sm">
                  Temporarily or permanently exclude yourself from our services.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Get Help & Support</h2>
            <p className="text-gray-300 mb-4">
              If you feel that gambling is becoming a problem, several organizations provide free, confidential help:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#2a2f3f] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Gamblers Anonymous</h3>
                <p className="text-gray-400 text-sm">www.gamblersanonymous.org</p>
                <p className="text-gray-400 text-sm">+1 (855) 222-5542</p>
              </div>
              <div className="bg-[#2a2f3f] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">National Council on Problem Gambling</h3>
                <p className="text-gray-400 text-sm">www.ncpgambling.org</p>
                <p className="text-gray-400 text-sm">1-800-522-4700</p>
              </div>
              <div className="bg-[#2a2f3f] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">GamCare</h3>
                <p className="text-gray-400 text-sm">www.gamcare.org.uk</p>
                <p className="text-gray-400 text-sm">0808 8020 133</p>
              </div>
              <div className="bg-[#2a2f3f] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">BeGambleAware</h3>
                <p className="text-gray-400 text-sm">www.begambleaware.org</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Our Commitment</h2>
            <p className="text-gray-300">
              BETZENITH is committed to promoting responsible gaming through:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-4 space-y-2 ml-4">
              <li>Age verification checks for all users</li>
              <li>Reality checks and session reminders</li>
              <li>Self-assessment tools</li>
              <li>Staff training on responsible gaming</li>
              <li>Partnerships with gambling support organizations</li>
              <li>Clear and transparent terms and conditions</li>
            </ul>
          </section>

          <div className="bg-[#2a2f3f] rounded-lg p-6 mt-8">
            <p className="text-center text-gray-300">
              If you have concerns about your gambling behavior or need immediate assistance,
              please contact our support team:
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Link to="/contact" className="px-6 py-2 bg-[#00b3b3] text-white rounded-lg hover:bg-[#009999]">
                Contact Support
              </Link>
              <a href="tel:18005224700" className="px-6 py-2 border border-[#00b3b3] text-[#00b3b3] rounded-lg hover:bg-[#00b3b3]/10">
                Call Helpline
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
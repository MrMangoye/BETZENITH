import { Link } from 'react-router-dom';

export default function Terms() {
    return (
      <div className="min-h-screen bg-[#0f1117] py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
          <div className="bg-[#1a1f2e] rounded-lg p-8 border border-gray-800 prose prose-invert max-w-none">
            <p className="text-gray-300">Last updated: February 2026</p>
            <h2 className="text-white text-xl mt-6 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-400">By accessing and using BETZENITH, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>

            <h2 className="text-white text-xl mt-6 mb-4">2. Eligibility</h2>
            <p className="text-gray-400">You must be at least 18 years old to use our services. By using BETZENITH, you represent and warrant that you meet this age requirement.</p>

            <h2 className="text-white text-xl mt-6 mb-4">3. Account Registration</h2>
            <p className="text-gray-400">You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

            <h2 className="text-white text-xl mt-6 mb-4">4. Betting Rules</h2>
            <p className="text-gray-400">All bets are final once placed. Payouts are calculated based on the odds at the time of bet placement. We reserve the right to void any bet placed in error.</p>
          </div>
        </div>
      </div>
    );
  }
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { forgotPassword } from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success('Reset link sent! Check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-[#1a1f2e] rounded-xl border border-[#2a3042] p-8">
        <Link to="/login" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <FiArrowLeft className="mr-2" /> Back to Login
        </Link>

        {!submitted ? (
          <>
            <div className="text-center mb-8">
              <FiMail className="text-5xl text-[#2e7d32] mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
              <p className="text-gray-400 mt-2">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2e7d32] text-white rounded-lg font-bold hover:bg-[#1e5a22] transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-[#2e7d32]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiMail className="text-4xl text-[#2e7d32]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
            <p className="text-gray-400 mb-6">
              We've sent a password reset link to <span className="text-[#2e7d32]">{email}</span>
            </p>
            <p className="text-sm text-gray-500">
              Didn't receive it? Check your spam folder or{' '}
              <button onClick={() => setSubmitted(false)} className="text-[#2e7d32] hover:underline">
                try again
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
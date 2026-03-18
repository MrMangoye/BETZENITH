// src/pages/VerifyEmail.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { verifyEmail, resendVerification } from '../services/api';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      handleVerifyEmail(token);
    }
  }, [token]);

  const handleVerifyEmail = async (verificationToken) => {
    setVerifying(true);
    try {
      await verifyEmail(verificationToken);
      setVerified(true);
      toast.success('Email verified successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setResending(true);
    try {
      await resendVerification(email);
      toast.success('Verification email sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-[#1a1f2e] rounded-lg p-8 border border-gray-800 text-center">
          {verifying ? (
            <>
              <div className="w-20 h-20 mx-auto mb-4 border-4 border-[#2e7d32] border-t-transparent rounded-full animate-spin"></div>
              <h1 className="text-2xl font-bold text-white mb-4">Verifying Email</h1>
              <p className="text-gray-400">Please wait while we verify your email address...</p>
            </>
          ) : verified ? (
            <>
              <FiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Email Verified!</h1>
              <p className="text-gray-400 mb-6">Your email has been successfully verified.</p>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </>
          ) : error ? (
            <>
              <FiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Verification Failed</h1>
              <p className="text-red-400 mb-6">{error}</p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-[#2e7d32] text-white rounded-lg font-bold hover:bg-[#1e5a22] transition-colors"
              >
                Back to Login
              </Link>
            </>
          ) : (
            <>
              <FiMail className="text-6xl text-[#2e7d32] mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Verify Your Email</h1>
              <p className="text-gray-400 mb-6">
                We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
              </p>
              
              <div className="mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32] mb-3"
                />
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full py-3 bg-[#2e7d32] text-white rounded-lg font-bold hover:bg-[#1e5a22] transition-colors disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>

              <Link
                to="/login"
                className="text-sm text-[#2e7d32] hover:underline"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
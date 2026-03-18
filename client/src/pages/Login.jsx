import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f1219] to-[#1a1f2e] p-12 flex-col justify-between border-r border-[#2a3042]">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            BET<span className="text-[#00b3b3]">ZENITH</span>
          </h1>
          <p className="text-gray-400 text-lg">Your Premier Sports Betting Platform</p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Account Access</h2>
            <div className="space-y-3">
              <div className="bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3042]">
                <span className="text-[#00b3b3] font-medium">Login</span>
              </div>
              <div className="bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3042]">
                <span className="text-gray-400 font-medium">Sign Up</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          © 2026 BETZENITH. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              BET<span className="text-[#00b3b3]">ZENITH</span>
            </h1>
            <p className="text-gray-400">Your Premier Sports Betting Platform</p>
          </div>
          <h2 className="text-2xl font-bold text-white mb-6">Login to Your Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1f2e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3] border border-[#2a3042]"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1f2e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3] border border-[#2a3042]"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00b3b3] text-white rounded-lg font-bold hover:bg-[#009999] transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#00b3b3] hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
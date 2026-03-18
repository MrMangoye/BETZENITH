import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBetSlip } from '../context/BetSlipContext';
import { FiUser, FiLogOut, FiMenu, FiX, FiDollarSign, FiTrendingUp, FiSun, FiMoon } from 'react-icons/fi';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { selectionCount } = useBetSlip();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      // Switch to light mode
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      // Switch to dark mode
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-[#0f1219] border-b border-[#2a3042] sticky top-0 z-50 ml-64">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo - BETZENITH */}
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-bold text-white">
              BET<span className="text-[#00b3b3] group-hover:text-[#00cccc] transition-colors">ZENITH</span>
            </span>
            <span className="text-xs bg-[#00b3b3]/10 text-[#00b3b3] px-2 py-1 rounded-full">PREMIUM</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-[#00b3b3] transition-colors text-sm font-medium">
              Homepage
            </Link>
            <Link to="/pre-match" className="text-gray-300 hover:text-[#00b3b3] transition-colors text-sm font-medium">
              Pre-match
            </Link>
            <Link to="/live" className="text-gray-300 hover:text-[#00b3b3] transition-colors text-sm font-medium relative">
              Live
              <span className="absolute -top-1 -right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </Link>

            {/* Theme Toggle Button - Only this changes the whole project theme */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#1a1f2e] border border-[#2a3042] hover:border-[#00b3b3] transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <FiSun className="text-yellow-400" size={18} />
              ) : (
                <FiMoon className="text-gray-400" size={18} />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Balance */}
                <div className="flex items-center space-x-2 bg-[#1a1f2e] px-4 py-2 rounded-lg border border-[#2a3042]">
                  <FiDollarSign className="text-[#00b3b3]" />
                  <span className="text-white font-bold">{user?.balance?.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">USD</span>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 bg-[#1a1f2e] px-4 py-2 rounded-lg border border-[#2a3042] hover:border-[#00b3b3]/50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#00b3b3]/20 rounded-full flex items-center justify-center">
                      <FiUser className="text-[#00b3b3]" />
                    </div>
                    <span className="text-white text-sm">{user?.username}</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#1a1f2e] rounded-lg shadow-xl border border-[#2a3042] overflow-hidden">
                      <div className="p-4 border-b border-[#2a3042]">
                        <p className="text-white font-semibold">{user?.username}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-gray-300 hover:bg-[#2a3042] hover:text-white rounded-lg transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/favorites"
                          className="block px-4 py-2 text-gray-300 hover:bg-[#2a3042] hover:text-white rounded-lg transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Favorites
                        </Link>
                        <Link
                          to="/my-bets"
                          className="block px-4 py-2 text-gray-300 hover:bg-[#2a3042] hover:text-white rounded-lg transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          My Bets
                        </Link>
                        <Link
                          to="/analytics"
                          className="block px-4 py-2 text-gray-300 hover:bg-[#2a3042] hover:text-white rounded-lg transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Analytics
                        </Link>
                      </div>
                      <div className="p-2 border-t border-[#2a3042]">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#2a3042] hover:text-white rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <FiLogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bet Slip Counter */}
                {selectionCount > 0 && (
                  <Link to="/bet-slip" className="relative">
                    <div className="bg-[#00b3b3] text-white px-3 py-2 rounded-lg flex items-center space-x-2">
                      <FiTrendingUp />
                      <span className="font-bold">{selectionCount}</span>
                    </div>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-6 py-2 border border-[#2a3042] text-gray-300 rounded-lg hover:border-[#00b3b3] hover:text-white transition-colors"
                >
                  Login
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-[#00b3b3] transition-colors"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#2a3042]">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className="px-4 py-3 text-gray-300 hover:bg-[#1a1f2e] hover:text-[#00b3b3] rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Homepage
              </Link>
              <Link
                to="/pre-match"
                className="px-4 py-3 text-gray-300 hover:bg-[#1a1f2e] hover:text-[#00b3b3] rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pre-match
              </Link>
              <Link
                to="/live"
                className="px-4 py-3 text-gray-300 hover:bg-[#1a1f2e] hover:text-[#00b3b3] rounded-lg transition-colors flex items-center justify-between"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Live</span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </Link>

              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="px-4 py-3 text-gray-300 hover:bg-[#1a1f2e] hover:text-[#00b3b3] rounded-lg transition-colors flex items-center space-x-2"
              >
                {isDarkMode ? (
                  <>
                    <FiSun className="text-yellow-400" size={18} />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <FiMoon className="text-gray-400" size={18} />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 bg-[#1a1f2e] rounded-lg border border-[#2a3042]">
                    <p className="text-white font-semibold">{user?.username}</p>
                    <p className="text-sm text-gray-500">Balance: ₦{user?.balance?.toFixed(2)}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="px-4 py-3 text-gray-300 hover:bg-[#1a1f2e] hover:text-[#00b3b3] rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/favorites"
                    className="px-4 py-3 text-gray-300 hover:bg-[#1a1f2e] hover:text-[#00b3b3] rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Favorites
                  </Link>
                  <Link
                    to="/my-bets"
                    className="px-4 py-3 text-gray-300 hover:bg-[#1a1f2e] hover:text-[#00b3b3] rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Bets
                  </Link>
                  <Link
                    to="/analytics"
                    className="px-4 py-3 text-gray-300 hover:bg-[#1a1f2e] hover:text-[#00b3b3] rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 text-left text-gray-300 hover:bg-[#1a1f2e] hover:text-[#00b3b3] rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2">
                  <Link
                    to="/login"
                    className="px-4 py-3 border border-[#2a3042] text-gray-300 rounded-lg text-center hover:border-[#00b3b3] hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
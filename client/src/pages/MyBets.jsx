import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBets } from '../services/api';
import { format } from 'date-fns';
import { FiTrendingUp, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyBets() {
  const { user, isAuthenticated } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view your bets');
      return;
    }
    loadBets();
  }, [isAuthenticated]);

  const loadBets = async () => {
    try {
      const data = await getMyBets();
      setBets(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error loading bets:', error);
      toast.error('Failed to load bets');
    } finally {
      setLoading(false);
    }
  };

  const filteredBets = bets.filter(bet => {
    if (filter === 'ALL') return true;
    return bet.status === filter;
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case 'WON': return <FiCheckCircle className="text-green-400" />;
      case 'LOST': return <FiXCircle className="text-red-400" />;
      case 'PENDING': return <FiClock className="text-yellow-400" />;
      default: return <FiTrendingUp className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'WON': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'LOST': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f1117] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-[#1a1f2e] rounded-lg p-8 text-center">
            <FiTrendingUp className="text-6xl text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">My Bets</h1>
            <p className="text-gray-400 mb-6">Please login to view your betting history</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-[#00b3b3] text-white rounded-lg font-bold hover:bg-[#009999]"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">My Bets</h1>
          <div className="flex space-x-2">
            {['ALL', 'PENDING', 'WON', 'LOST'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-[#00b3b3] text-white'
                    : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#2a2f3f]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00b3b3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading bets...</p>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="bg-[#1a1f2e] rounded-lg p-12 text-center">
            <FiTrendingUp className="text-6xl text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl text-white mb-2">No bets yet</h2>
            <p className="text-gray-400 mb-6">Start betting on matches to see your history here</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-[#00b3b3] text-white rounded-lg font-bold hover:bg-[#009999]"
            >
              Browse Matches
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBets.map(bet => (
              <div key={bet._id} className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-white font-semibold">
                        {bet.match?.homeTeam?.name} vs {bet.match?.awayTeam?.name}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(bet.status)}`}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(bet.status)}
                          <span>{bet.status}</span>
                        </span>
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <span className="mr-4">Market: {bet.marketName || 'Match Winner'}</span>
                      <span className="mr-4">Odds: {bet.odds}</span>
                      <span className="mr-4">Stake: ₦{bet.stake}</span>
                      {bet.status === 'WON' && (
                        <span className="text-green-400">Won: ₦{bet.potentialWin}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {format(new Date(bet.createdAt), 'dd MMM yyyy, HH:mm')}
                    </div>
                  </div>
                  <Link
                    to={`/bet/${bet._id}`}
                    className="px-4 py-2 bg-[#2a2f3f] text-white rounded-lg hover:bg-[#353b4d] transition-colors text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
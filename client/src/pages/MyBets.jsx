import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBets } from '../services/api';
import { format } from 'date-fns';
import { FiTrendingUp, FiClock, FiCheckCircle, FiXCircle, FiDollarSign, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyBets() {
  const { user, isAuthenticated } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [stats, setStats] = useState({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    pendingBets: 0,
    totalStake: 0,
    totalWinnings: 0,
    profit: 0
  });

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
      const betsData = Array.isArray(data) ? data : data?.data || [];
      setBets(betsData);
      
      // Calculate stats
      const totalBets = betsData.length;
      const wonBets = betsData.filter(b => b.status === 'WON').length;
      const lostBets = betsData.filter(b => b.status === 'LOST').length;
      const pendingBets = betsData.filter(b => b.status === 'PENDING').length;
      const totalStake = betsData.reduce((sum, b) => sum + (b.stake || 0), 0);
      const totalWinnings = betsData
        .filter(b => b.status === 'WON')
        .reduce((sum, b) => sum + (b.potentialWin || 0), 0);
      
      setStats({
        totalBets,
        wonBets,
        lostBets,
        pendingBets,
        totalStake,
        totalWinnings,
        profit: totalWinnings - totalStake
      });
      
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

  const getStatusBadge = (status) => {
    const colors = {
      'WON': 'bg-green-500/20 text-green-400',
      'LOST': 'bg-red-500/20 text-red-400',
      'PENDING': 'bg-yellow-500/20 text-yellow-400',
      'CASHED_OUT': 'bg-blue-500/20 text-blue-400',
      'VOID': 'bg-gray-500/20 text-gray-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
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
        {/* Header with Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1f2e] rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Bets</p>
            <p className="text-2xl font-bold text-white">{stats.totalBets}</p>
          </div>
          <div className="bg-[#1a1f2e] rounded-lg p-4">
            <p className="text-gray-400 text-sm">Win Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {stats.totalBets > 0 ? ((stats.wonBets / stats.totalBets) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-500">{stats.wonBets} Won / {stats.lostBets} Lost</p>
          </div>
          <div className="bg-[#1a1f2e] rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Stake</p>
            <p className="text-2xl font-bold text-white">₦{stats.totalStake.toFixed(2)}</p>
          </div>
          <div className="bg-[#1a1f2e] rounded-lg p-4">
            <p className="text-gray-400 text-sm">Profit/Loss</p>
            <p className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₦{stats.profit.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">My Bets</h1>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'WON', 'LOST', 'CASHED_OUT'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-[#00b3b3] text-white'
                    : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#2a2f3f]'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Bets List */}
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
              <div key={bet._id} className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800 hover:border-[#00b3b3]/30 transition-all">
                {/* Bet Header */}
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(bet.status)}`}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(bet.status)}
                        <span>{bet.status}</span>
                      </span>
                    </span>
                    <span className="text-sm text-gray-400">
                      <FiCalendar className="inline mr-1" />
                      {format(new Date(bet.createdAt), 'dd MMM yyyy, HH:mm')}
                    </span>
                  </div>
                  <span className="text-xs bg-[#2a2f3f] px-2 py-1 rounded text-gray-300">
                    Ref: {bet.reference || bet._id.slice(-8)}
                  </span>
                </div>

                {/* Selections */}
                <div className="space-y-3 mb-4">
                  {bet.selections?.map((selection, idx) => (
                    <div key={idx} className="flex flex-wrap items-center justify-between p-3 bg-[#0f1219] rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">
                            {selection.match?.homeTeam?.name || 'Team A'} vs {selection.match?.awayTeam?.name || 'Team B'}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-[#2a2f3f] rounded text-gray-300">
                            {selection.marketName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selection.match?.league || 'Unknown League'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#00b3b3] font-bold">@{selection.odds}</div>
                        {selection.status !== 'PENDING' && (
                          <div className={`text-xs mt-1 ${
                            selection.status === 'WON' ? 'text-green-400' : 
                            selection.status === 'LOST' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {selection.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bet Details */}
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-800">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm text-white">{bet.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stake</p>
                      <p className="text-sm text-white">₦{bet.stake}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Odds</p>
                      <p className="text-sm text-[#00b3b3] font-bold">{bet.totalOdds}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Potential Win</p>
                      <p className="text-sm text-green-400">₦{bet.potentialWin}</p>
                    </div>
                  </div>
                  <Link
                    to={`/bet/${bet._id}`}
                    className="ml-4 px-4 py-2 bg-[#2a2f3f] text-white rounded-lg hover:bg-[#353b4d] transition-colors text-sm whitespace-nowrap"
                  >
                    View Details
                  </Link>
                </div>

                {/* Cashout Info if available */}
                {bet.cashoutAvailable && !bet.cashoutTaken && bet.status === 'PENDING' && (
                  <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiDollarSign className="text-[#00b3b3]" />
                      <span className="text-sm text-gray-300">Cashout available:</span>
                      <span className="text-lg font-bold text-[#00b3b3]">₦{bet.cashoutValue}</span>
                    </div>
                    <button className="px-4 py-2 bg-[#00b3b3] text-white rounded-lg hover:bg-[#009999] text-sm">
                      Cashout Now
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
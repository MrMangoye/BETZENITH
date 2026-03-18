import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBets } from '../services/api';
import { FiTrendingUp, FiPieChart, FiBarChart2, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Analytics() {
  const { user, isAuthenticated } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view analytics');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const data = await getMyBets();
      setBets(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalBets: bets.length,
    totalStake: bets.reduce((sum, b) => sum + (b.stake || 0), 0),
    totalWon: bets.filter(b => b.status === 'WON').reduce((sum, b) => sum + (b.potentialWin || 0), 0),
    wonBets: bets.filter(b => b.status === 'WON').length,
    lostBets: bets.filter(b => b.status === 'LOST').length,
    pendingBets: bets.filter(b => b.status === 'PENDING').length,
    winRate: bets.length > 0 
      ? ((bets.filter(b => b.status === 'WON').length / bets.length) * 100).toFixed(1)
      : 0,
    profit: bets.filter(b => b.status === 'WON').reduce((sum, b) => sum + (b.potentialWin || 0), 0) 
      - bets.reduce((sum, b) => sum + (b.stake || 0), 0)
  };

  // Get favorite leagues
  const leagueStats = bets.reduce((acc, bet) => {
    const league = bet.match?.league || 'Other';
    if (!acc[league]) {
      acc[league] = { count: 0, stake: 0, won: 0 };
    }
    acc[league].count++;
    acc[league].stake += bet.stake || 0;
    if (bet.status === 'WON') {
      acc[league].won += bet.potentialWin || 0;
    }
    return acc;
  }, {});

  const topLeagues = Object.entries(leagueStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f1117] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-[#1a1f2e] rounded-lg p-8 text-center">
            <FiPieChart className="text-6xl text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Analytics</h1>
            <p className="text-gray-400 mb-6">Please login to view your betting analytics</p>
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
          <h1 className="text-2xl font-bold text-white">Betting Analytics</h1>
          <div className="flex space-x-2">
            {['7d', '30d', '90d', '1y'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[#00b3b3] text-white'
                    : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#2a2f3f]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00b3b3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        ) : bets.length === 0 ? (
          <div className="bg-[#1a1f2e] rounded-lg p-12 text-center">
            <FiBarChart2 className="text-6xl text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl text-white mb-2">No data yet</h2>
            <p className="text-gray-400 mb-6">Place some bets to see your analytics</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-[#00b3b3] text-white rounded-lg font-bold hover:bg-[#009999]"
            >
              Browse Matches
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <FiActivity className="text-[#00b3b3] text-xl" />
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalBets}</div>
                <div className="text-sm text-gray-400">Bets Placed</div>
              </div>

              <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <FiTrendingUp className="text-green-400 text-xl" />
                  <span className="text-xs text-gray-500">Win Rate</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.winRate}%</div>
                <div className="text-sm text-gray-400">{stats.wonBets} Won / {stats.lostBets} Lost</div>
              </div>

              <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <FiBarChart2 className="text-yellow-400 text-xl" />
                  <span className="text-xs text-gray-500">Total Stake</span>
                </div>
                <div className="text-2xl font-bold text-white">₦{stats.totalStake.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Amount Wagered</div>
              </div>

              <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <FiPieChart className="text-purple-400 text-xl" />
                  <span className="text-xs text-gray-500">Profit/Loss</span>
                </div>
                <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₦{stats.profit.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Net Result</div>
              </div>
            </div>

            {/* Favorite Leagues */}
            <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-bold text-white mb-4">Top Leagues</h2>
              <div className="space-y-3">
                {topLeagues.map(([league, data]) => (
                  <div key={league} className="flex items-center justify-between">
                    <span className="text-gray-300">{league}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">{data.count} bets</span>
                      <span className="text-sm text-[#00b3b3]">₦{data.stake.toFixed(2)}</span>
                      {data.won > 0 && (
                        <span className="text-sm text-green-400">+₦{data.won.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBets, getTransactions } from '../services/api';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [betsData, transactionsData] = await Promise.all([
        getMyBets(),
        getTransactions()
      ]);
      setBets(betsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalBets: bets.length,
    wonBets: bets.filter(b => b.status === 'WON').length,
    totalStaked: bets.reduce((acc, b) => acc + b.stake, 0),
    totalWon: bets.filter(b => b.status === 'WON').reduce((acc, b) => acc + b.potentialWin, 0)
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1f2e] p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Balance</p>
          <p className="text-2xl font-bold text-[#00cc88]">₦{user?.balance?.toFixed(2)}</p>
        </div>
        <div className="bg-[#1a1f2e] p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Total Bets</p>
          <p className="text-2xl font-bold text-white">{stats.totalBets}</p>
        </div>
        <div className="bg-[#1a1f2e] p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Won Bets</p>
          <p className="text-2xl font-bold text-green-400">{stats.wonBets}</p>
        </div>
        <div className="bg-[#1a1f2e] p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Win Rate</p>
          <p className="text-2xl font-bold text-white">
            {stats.totalBets ? ((stats.wonBets / stats.totalBets) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/deposit" className="bg-[#00b3b3] p-4 rounded-lg text-center hover:bg-[#009999]">
          <div className="text-2xl mb-2">💰</div>
          <div className="font-bold">Deposit</div>
        </Link>
        <Link to="/withdraw" className="bg-[#2a2f3f] p-4 rounded-lg text-center hover:bg-[#353b4d]">
          <div className="text-2xl mb-2">💸</div>
          <div className="font-bold">Withdraw</div>
        </Link>
        <Link to="/bet-history" className="bg-[#2a2f3f] p-4 rounded-lg text-center hover:bg-[#353b4d]">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-bold">History</div>
        </Link>
        <Link to="/" className="bg-[#2a2f3f] p-4 rounded-lg text-center hover:bg-[#353b4d]">
          <div className="text-2xl mb-2">⚽</div>
          <div className="font-bold">Bet Now</div>
        </Link>
      </div>

      {/* Recent Bets */}
      <div className="bg-[#1a1f2e] rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Bets</h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : bets.length === 0 ? (
          <p className="text-gray-400">No bets yet. <Link to="/" className="text-[#00b3b3]">Start betting!</Link></p>
        ) : (
          <div className="space-y-3">
            {bets.slice(0, 5).map((bet) => (
              <div key={bet._id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                <div>
                  <p className="text-white font-semibold">{bet.match?.homeTeam?.name} vs {bet.match?.awayTeam?.name}</p>
                  <p className="text-sm text-gray-400">Stake: ₦{bet.stake} @ {bet.odds}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  bet.status === 'WON' ? 'bg-green-500/20 text-green-400' :
                  bet.status === 'LOST' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {bet.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { getMyBets } from '../services/api';
import { format } from 'date-fns';

export default function BetHistory() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    try {
      const data = await getMyBets();
      setBets(data);
    } catch (error) {
      console.error('Error loading bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBets = bets.filter(bet => {
    if (filter === 'ALL') return true;
    return bet.status === filter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'WON': return 'bg-green-500/20 text-green-400';
      case 'LOST': return 'bg-red-500/20 text-red-400';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Bet History</h1>
      
      {/* Filters */}
      <div className="flex space-x-2">
        {['ALL', 'PENDING', 'WON', 'LOST'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === status
                ? 'bg-[#00b3b3] text-white'
                : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#2a2f3f]'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
      
      {/* Bets Table */}
      <div className="bg-[#1a1f2e] rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading bet history...</p>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No bets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2a2f3f]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Match</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Market</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Odds</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stake</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Potential Win</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredBets.map((bet) => (
                  <tr key={bet._id} className="hover:bg-[#2a2f3f] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      {bet.match?.homeTeam?.abbreviation} vs {bet.match?.awayTeam?.abbreviation}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {bet.match?.markets[bet.marketIndex]?.name || 'Market'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#00b3b3] font-bold">
                      {bet.odds}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      ₦{bet.stake}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#00cc88]">
                      ₦{bet.potentialWin}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(bet.status)}`}>
                        {bet.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {format(new Date(bet.createdAt), 'dd/MM/yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
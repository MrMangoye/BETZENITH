import { useState, useEffect } from 'react';
import { useBetSlip } from '../context/BetSlipContext';
import { getMatches } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function LiveBetting() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToBetSlip } = useBetSlip();
  const navigate = useNavigate();

  useEffect(() => {
    loadLiveMatches();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadLiveMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLiveMatches = async () => {
    try {
      const data = await getMatches('?status=LIVE');
      setLiveMatches(data);
    } catch (error) {
      console.error('Error loading live matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToBetSlip = (match, market, index) => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    addToBetSlip({ ...match, selectedMarket: { ...market, index } });
  };

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] rounded-lg p-4">
        <h2 className="text-xl font-bold text-white mb-4">Live Betting</h2>
        <div className="text-center py-4">
          <p className="text-gray-400">Loading live matches...</p>
        </div>
      </div>
    );
  }

  if (liveMatches.length === 0) {
    return (
      <div className="bg-[#1a1f2e] rounded-lg p-4">
        <h2 className="text-xl font-bold text-white mb-4">Live Betting</h2>
        <div className="text-center py-4">
          <p className="text-gray-400">No live matches at the moment</p>
          <p className="text-sm text-gray-500 mt-2">Check back soon for live action!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 sticky top-4">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
        Live Betting
        <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
          {liveMatches.length} live
        </span>
      </h2>
      
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {liveMatches.map((match) => (
          <div key={match._id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
            {/* Match header */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{match.homeTeam.abbreviation}</span>
                  <span className="text-xs text-gray-400 mx-2">vs</span>
                  <span className="text-white font-medium">{match.awayTeam.abbreviation}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {match.league} • {match.time}
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full ml-2">
                LIVE
              </span>
            </div>

            {/* Quick odds grid */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {match.markets.slice(0, 4).map((market, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddToBetSlip(match, market, idx)}
                  disabled={!market.isActive}
                  className="bg-[#2a2f3f] p-2 rounded text-center hover:bg-[#353b4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="text-xs text-gray-400 group-hover:text-gray-300">
                    {market.name}
                  </div>
                  <div className="text-sm font-bold text-[#00b3b3] group-hover:text-[#00cccc]">
                    {market.odds}
                  </div>
                </button>
              ))}
            </div>

            {/* Match score if available */}
            {match.result && (
              <div className="mt-2 text-center">
                <span className="text-xs bg-[#2a2f3f] px-2 py-1 rounded text-gray-300">
                  {match.result.homeScore || 0} - {match.result.awayScore || 0}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View all live matches link */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        <button
          onClick={() => navigate('/live')}
          className="w-full text-center text-sm text-[#00b3b3] hover:text-[#00cccc] transition-colors"
        >
          View All Live Matches →
        </button>
      </div>
    </div>
  );
}
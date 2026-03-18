import { useState, useEffect } from 'react';
import { useBetSlip } from '../context/BetSlipContext';
import { getMatches } from '../services/api';

export default function LiveBetting() {
  const [liveMatches, setLiveMatches] = useState([]);
  const { addToBetSlip } = useBetSlip();

  useEffect(() => {
    loadLiveMatches();
  }, []);

  const loadLiveMatches = async () => {
    try {
      const data = await getMatches('?status=LIVE');
      setLiveMatches(data);
    } catch (error) {
      console.error('Error loading live matches:', error);
    }
  };

  if (liveMatches.length === 0) {
    return (
      <div className="bg-[#1a1f2e] rounded-lg p-4">
        <h2 className="text-xl font-bold text-white mb-4">Live Betting</h2>
        <p className="text-gray-400 text-center py-4">No live matches available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4">
      <h2 className="text-xl font-bold text-white mb-4">Live Betting</h2>
      <div className="space-y-3">
        {liveMatches.map((match) => (
          <div key={match._id} className="border-b border-gray-800 pb-3 last:border-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-white">
                {match.homeTeam.abbreviation} vs {match.awayTeam.abbreviation}
              </span>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                LIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {match.markets.slice(0, 2).map((market, idx) => (
                <button
                  key={idx}
                  onClick={() => addToBetSlip({ ...match, selectedMarket: { ...market, index: idx } })}
                  className="bg-[#2a2f3f] p-2 rounded text-center hover:bg-[#353b4d]"
                >
                  <div className="text-xs text-gray-400">{market.name}</div>
                  <div className="text-sm font-bold text-[#00b3b3]">{market.odds}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
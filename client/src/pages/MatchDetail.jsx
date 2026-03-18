import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMatch } from '../services/api';
import BetSlip from '../components/BetSlip';
import { useBetSlip } from '../context/BetSlipContext';

export default function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToBetSlip } = useBetSlip();

  useEffect(() => {
    loadMatch();
  }, [id]);

  const loadMatch = async () => {
    try {
      const data = await getMatch(id);
      setMatch(data);
    } catch (error) {
      console.error('Error loading match:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading match details...</div>;
  }

  if (!match) {
    return <div className="text-center py-12">Match not found</div>;
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div className="bg-[#1a1f2e] rounded-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </h1>
          <p className="text-gray-400 mb-4">{match.league}</p>
          
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{match.homeTeam.abbreviation}</div>
              <div className="text-sm text-gray-400">Home</div>
            </div>
            <div>
              <div className="text-xl text-[#00b3b3]">{match.time}</div>
              <div className="text-sm text-gray-400">
                {new Date(match.date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{match.awayTeam.abbreviation}</div>
              <div className="text-sm text-gray-400">Away</div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-4">Markets</h2>
          <div className="grid grid-cols-2 gap-4">
            {match.markets.map((market, index) => (
              <button
                key={index}
                onClick={() => addToBetSlip({ ...match, selectedMarket: { ...market, index } })}
                disabled={match.status === 'FINISHED' || !market.isActive}
                className="bg-[#2a2f3f] p-4 rounded-lg hover:bg-[#353b4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-sm text-gray-400 mb-1">{market.name}</div>
                <div className="text-2xl font-bold text-[#00b3b3]">{market.odds}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="w-80">
        <BetSlip />
      </div>
    </div>
  );
}
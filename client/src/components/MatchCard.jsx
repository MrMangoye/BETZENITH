// src/components/MatchCard.jsx
import { useState } from 'react';
import { useBetSlip } from '../context/BetSlipContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Match Status Component
const MatchStatus = ({ match }) => {
  if (match.status === 'LIVE') {
    return (
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        <span className="text-red-500 text-xs font-bold">LIVE</span>
        <span className="text-white text-sm">{match.minute}'</span>
      </div>
    );
  }
  
  if (match.status === 'FINISHED') {
    return (
      <div className="text-gray-500 text-xs">
        FT • {match.score?.home || 0} - {match.score?.away || 0}
      </div>
    );
  }
  
  return (
    <div className="text-gray-500 text-xs">
      {match.startsAt ? new Date(match.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '19:00'}
    </div>
  );
};

export default function MatchCard({ match }) {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const { addToBetSlip } = useBetSlip();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Handle both MongoDB format and odds API format
  const matchId = match._id || match.id;
  const homeTeam = {
    name: match.homeTeam?.name || 'Home',
    abbreviation: match.homeTeam?.abbreviation || match.homeTeam?.name?.substring(0, 3).toUpperCase() || 'HOM',
    logo: match.homeTeam?.logo
  };
  
  const awayTeam = {
    name: match.awayTeam?.name || 'Away',
    abbreviation: match.awayTeam?.abbreviation || match.awayTeam?.name?.substring(0, 3).toUpperCase() || 'AWY',
    logo: match.awayTeam?.logo
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '19:00';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMarketClick = (market, category, index) => {
    if (match.status === 'FINISHED' || market.isActive === false) {
      toast.error('Market closed');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSelectedMarket(`${category}-${index}`);
    
    // Create selection object that matches what BetSlip expects
    const selection = {
      _id: matchId,
      id: matchId,
      league: match.league || 'Unknown League',
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      date: match.startsAt || match.date,
      time: formatTime(match.startsAt || match.date),
      status: match.status || 'SCHEDULED',
      selectedMarket: { 
        ...market, 
        category, 
        index,
        odds: market.odds || market.price || 2.00
      }
    };

    addToBetSlip(selection);
    toast.success('Added to bet slip');
    setTimeout(() => setSelectedMarket(null), 200);
  };

  // Get odds from match object (handle different formats)
  const getOdds = () => {
    if (match.odds) {
      // If odds is an object with home/draw/away
      return [
        { name: '1', odds: match.odds.home || 2.10, isActive: true },
        { name: 'X', odds: match.odds.draw || 3.40, isActive: true },
        { name: '2', odds: match.odds.away || 3.20, isActive: true }
      ];
    }
    
    if (match.markets && match.markets.length > 0) {
      return match.markets;
    }
    
    // Default odds
    return [
      { name: '1', odds: 2.10, isActive: true },
      { name: 'X', odds: 3.40, isActive: true },
      { name: '2', odds: 3.20, isActive: true }
    ];
  };

  const markets = getOdds();

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-5 border border-gray-800 hover:border-[#2e7d32]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#2e7d32]/5">
      {/* League Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-400">{match.league || 'Unknown League'}</span>
        <div className="text-right">
          <span className="text-white text-sm">{formatTime(match.startsAt || match.date)}</span>
          <span className="text-gray-500 text-xs ml-2">{formatDate(match.startsAt || match.date)}</span>
        </div>
      </div>

      {/* Teams Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl font-bold text-white">
            {homeTeam.abbreviation}
          </span>
          <span className="text-white font-medium">
            {homeTeam.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Enhanced Match Status */}
          <MatchStatus match={match} />
          <span className="text-white font-medium">
            {awayTeam.name}
          </span>
          <span className="text-2xl font-bold text-white">
            {awayTeam.abbreviation}
          </span>
        </div>
      </div>

      {/* Score Display (for live matches) */}
      {match.score && match.status !== 'SCHEDULED' && (
        <div className="text-center mb-4">
          <span className="text-xl font-bold text-[#2e7d32]">
            {typeof match.score === 'object' 
              ? `${match.score.home || 0} - ${match.score.away || 0}`
              : match.score}
          </span>
        </div>
      )}

      {/* Match Winner Market */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white font-medium">Match Winner</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {markets.slice(0, 3).map((market, idx) => (
            <button
              key={idx}
              onClick={() => handleMarketClick(market, 'winner', idx)}
              disabled={match.status === 'FINISHED' || market.isActive === false}
              className={`
                bg-[#2a2f3f] p-3 rounded text-center transition-all duration-200
                ${match.status === 'FINISHED' || market.isActive === false
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#353b4d] active:scale-95 cursor-pointer'
                }
                ${selectedMarket === `winner-${idx}` ? 'ring-2 ring-[#2e7d32]' : ''}
              `}
            >
              <div className="text-xs text-gray-400 mb-1">{market.name}</div>
              <div className="text-lg font-bold text-[#2e7d32]">
                {market.odds?.toFixed(2) || market.price?.toFixed(2) || '2.00'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Markets - Only show if there are more markets */}
      {markets.length > 3 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white font-medium">More Markets</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {markets.slice(3, 6).map((market, idx) => (
              <button
                key={idx}
                onClick={() => handleMarketClick(market, 'more', idx + 3)}
                disabled={match.status === 'FINISHED' || market.isActive === false}
                className="bg-[#2a2f3f] p-3 rounded text-center hover:bg-[#353b4d] active:scale-95 transition-all duration-200"
              >
                <div className="text-xs text-gray-400 mb-1">{market.name}</div>
                <div className="text-lg font-bold text-[#2e7d32]">
                  {market.odds?.toFixed(2) || market.price?.toFixed(2) || '2.00'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
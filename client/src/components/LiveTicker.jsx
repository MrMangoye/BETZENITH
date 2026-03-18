import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';

export default function LiveTicker() {
  const [liveMatches, setLiveMatches] = useState([]);
  const { connected } = useSocket();

  useEffect(() => {
    const handleMatchUpdate = (e) => {
      const updatedMatch = e.detail;
      setLiveMatches(prev => {
        const exists = prev.find(m => m._id === updatedMatch.matchId);
        if (exists) {
          return prev.map(m => m._id === updatedMatch.matchId 
            ? { ...m, ...updatedMatch } 
            : m
          );
        }
        return prev;
      });
    };

    window.addEventListener('match-update', handleMatchUpdate);
    
    return () => {
      window.removeEventListener('match-update', handleMatchUpdate);
    };
  }, []);

  if (liveMatches.length === 0) return null;

  return (
    <div className="bg-[#1A1F2E] border-y border-[#2A3042] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <div className="flex items-center space-x-2 bg-red-500/20 px-4 py-2 border-r border-[#2A3042]">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-red-400">LIVE</span>
          </div>
          
          <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-2">
            <div className="inline-flex space-x-6 px-4">
              {liveMatches.map(match => (
                <Link
                  key={match._id}
                  to={`/match/${match._id}`}
                  className="flex items-center space-x-3 text-sm hover:text-[#00E5B0] transition-colors"
                >
                  <span className="text-gray-400">{match.league}</span>
                  <span className="text-white font-medium">
                    {match.homeTeam.abbreviation} {match.score.home} - {match.score.away} {match.awayTeam.abbreviation}
                  </span>
                  <span className="text-xs text-gray-500">
                    {match.timeRemaining ? `${match.timeRemaining}'` : 'LIVE'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
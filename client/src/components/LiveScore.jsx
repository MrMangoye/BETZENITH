// src/components/LiveScore.jsx
import { useEffect, useState } from 'react';
import { getLiveScores } from '../services/oddsApi';

export default function LiveScore({ eventId }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const data = await getLiveScores();
        const event = data.events?.find(e => e.id === eventId);
        if (event) {
          setScore({
            home: event.homeScore,
            away: event.awayScore,
            minute: event.minute
          });
        }
      } catch (error) {
        console.error('Error fetching live score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScore();
    
    // Refresh every 10 seconds for live matches
    const interval = setInterval(fetchScore, 10000);
    
    return () => clearInterval(interval);
  }, [eventId]);

  if (loading) return <span className="text-gray-500">...</span>;
  if (!score) return null;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-2xl font-bold text-[#ffd700]">
        {score.home} - {score.away}
      </span>
      <span className="text-xs text-red-400 animate-pulse">
        {score.minute}'
      </span>
    </div>
  );
}
// src/pages/LeaguePage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOddsData } from '../hooks/useOddsData';
import MatchCard from '../components/MatchCard';
import BetSlip from '../components/BetSlip';
import { FiArrowLeft } from 'react-icons/fi';

const leagueLogos = {
  'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'EPL': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', // Add EPL alias
  'La Liga': '🇪🇸',
  'Bundesliga': '🇩🇪',
  'Serie A': '🇮🇹',
  'Ligue 1': '🇫🇷',
  'Champions League': '🏆',
  'Europa League': '🏆',
  'World Cup': '🌍',
  'NBA': '🏀',
  'EuroLeague': '🏀',
  'WNBA': '🏀',
  'NCAA Basketball': '🏀',
  'NFL': '🏈',
  'Super Bowl': '🏆',
  'NFL Playoffs': '🏈',
  'NCAAF': '🏈',
  'MLB': '⚾',
  'NHL': '🏒',
  'UFC': '🥊',
  'Bellator': '🥊',
  'Heavyweight Boxing': '🥊',
  'Wimbledon': '🎾',
  'US Open': '🎾',
  'French Open': '🎾',
  'Australian Open': '🎾',
  'PGA Tour': '⛳',
  'The Masters': '⛳',
  'The Open': '⛳',
  'IPL': '🏏',
  'The Ashes': '🏏',
  'Big Bash': '🏏',
  'T20 World Cup': '🏆',
  'Six Nations': '🏉',
  'Rugby World Cup': '🏆',
  'Formula 1': '🏎️',
  'Monaco GP': '🇲🇨',
  'British GP': '🇬🇧',
  'default': '🏆'
};

export default function LeaguePage() {
  const { leagueName } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedLeagueName = decodeURIComponent(leagueName);
  
  const { liveEvents, upcomingEvents } = useOddsData('all');

  useEffect(() => {
    // Combine live and upcoming events
    const allEvents = [...liveEvents, ...upcomingEvents];
    
    console.log(`🔍 Looking for league: "${decodedLeagueName}"`);
    console.log(`📊 Total events available: ${allEvents.length}`);
    
    // Map common league name variations
    let searchTerm = decodedLeagueName;
    
    // Handle EPL mapping to Premier League
    if (decodedLeagueName === 'EPL' || decodedLeagueName === 'English Premier League') {
      searchTerm = 'Premier League';
      console.log('🔄 Mapping to Premier League');
    }
    
    // Handle other common variations
    if (decodedLeagueName === 'UCL' || decodedLeagueName === 'Champions League') {
      searchTerm = 'Champions League';
    }
    
    // Filter by league name (case insensitive and flexible matching)
    const leagueMatches = allEvents.filter(match => {
      if (!match || !match.league) return false;
      
      const matchLeague = match.league.toLowerCase().trim();
      const searchLeague = searchTerm.toLowerCase().trim();
      
      // Exact match
      if (matchLeague === searchLeague) {
        console.log(`✅ Exact match: ${match.league}`);
        return true;
      }
      
      // Partial match (one contains the other)
      if (matchLeague.includes(searchLeague) || searchLeague.includes(matchLeague)) {
        console.log(`✅ Partial match: ${match.league} contains/in ${searchLeague}`);
        return true;
      }
      
      // Special case for Premier League variations
      if ((searchLeague.includes('premier') || searchLeague.includes('epl')) && 
          matchLeague.includes('premier')) {
        console.log(`✅ Premier League match: ${match.league}`);
        return true;
      }
      
      return false;
    });
    
    console.log(`✅ Found ${leagueMatches.length} matches for ${decodedLeagueName}`);
    
    // Log the first few matches for debugging
    if (leagueMatches.length > 0) {
      console.log('📋 Sample matches:', leagueMatches.slice(0, 3).map(m => ({
        league: m.league,
        home: m.homeTeam?.name,
        away: m.awayTeam?.name,
        status: m.status
      })));
    }
    
    setMatches(leagueMatches);
    setLoading(false);
  }, [liveEvents, upcomingEvents, decodedLeagueName]);

  const getLeagueLogo = () => {
    // Check exact match first
    if (leagueLogos[decodedLeagueName]) {
      return leagueLogos[decodedLeagueName];
    }
    
    // Special case for EPL
    if (decodedLeagueName === 'EPL' || decodedLeagueName === 'Premier League' || 
        decodedLeagueName === 'English Premier League') {
      return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    }
    
    // Try partial matches
    for (const [key, value] of Object.entries(leagueLogos)) {
      if (decodedLeagueName.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(decodedLeagueName.toLowerCase())) {
        return value;
      }
    }
    
    return leagueLogos.default;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 border-4 border-[#2e7d32] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] py-8">
      <div className="container mx-auto px-4">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-6">
              <Link
                to="/"
                className="p-2 bg-[#1a1f2e] rounded-lg hover:bg-[#2a3042] transition-colors"
              >
                <FiArrowLeft className="text-gray-400" />
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getLeagueLogo()}</span>
                <h1 className="text-2xl font-bold text-white">{decodedLeagueName}</h1>
              </div>
              <span className="text-sm bg-[#2e7d32]/10 text-[#2e7d32] px-3 py-1 rounded-full">
                {matches.length} matches
              </span>
            </div>

            {matches.length === 0 ? (
              <div className="bg-[#1a1f2e] rounded-xl p-12 text-center border border-[#2a3042]">
                <p className="text-gray-400 mb-2">No matches found for {decodedLeagueName}</p>
                <p className="text-sm text-gray-500 mb-6">Try checking the Live Matches page for all available games</p>
                <div className="flex justify-center space-x-4">
                  <Link
                    to="/live"
                    className="px-6 py-2 bg-[#2e7d32] text-white rounded-lg hover:bg-[#1e5a22] transition-colors"
                  >
                    View Live Matches
                  </Link>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-[#1a1f2e] text-white rounded-lg hover:bg-[#2a3042] transition-colors border border-[#2a3042]"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map(match => (
                  <MatchCard key={match.id || match._id} match={match} />
                ))}
              </div>
            )}
          </div>

          <div className="w-80 hidden lg:block">
            <div className="sticky top-24">
              <BetSlip />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
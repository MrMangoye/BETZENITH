import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const SportsMenu = () => {
  const [openSport, setOpenSport] = useState(null);
  const navigate = useNavigate();

  const sportsData = [
    {
      name: 'Basketball',
      icon: '🏀',
      subSports: [
        { name: 'American Football', leagues: ['NCAAF'] },
        { name: 'Baseball', leagues: ['MLB Preseason', 'NCAA Baseball'] },
      ]
    },
    {
      name: 'Ice Hockey',
      icon: '🏒',
      leagues: ['NHL', 'KHL', 'World Championship']
    },
    {
      name: 'Cricket',
      icon: '🏏',
      leagues: ['International Twenty20', 'T20 World Cup', 'IPL', 'The Ashes']
    },
    {
      name: 'MMA',
      icon: '🥊',
      leagues: ['UFC', 'Bellator', 'ONE Championship']
    }
  ];

  const handleLeagueClick = (league) => {
    navigate(`/league/${encodeURIComponent(league)}`);
  };

  return (
    <div className="bg-[#0f1219] rounded-lg border border-[#2a3042] overflow-hidden">
      <div className="p-4">
        <h3 className="text-white text-sm font-semibold mb-3">MENU</h3>
        <div className="space-y-2">
          {sportsData.map((sport) => (
            <div key={sport.name}>
              <button
                onClick={() => setOpenSport(openSport === sport.name ? null : sport.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-400 hover:bg-[#1a1f2e] hover:text-white rounded transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <span>{sport.icon}</span>
                  <span>{sport.name}</span>
                </span>
                {openSport === sport.name ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </button>

              {/* Sub-sports or leagues */}
              {openSport === sport.name && (
                <div className="mt-1 ml-8 space-y-2">
                  {sport.subSports ? (
                    // For sports with sub-sports (like Basketball)
                    sport.subSports.map((subSport) => (
                      <div key={subSport.name}>
                        <div className="text-xs text-gray-500 mb-1">{subSport.name}</div>
                        <div className="space-y-1 pl-2">
                          {subSport.leagues.map((league) => (
                            <button
                              key={league}
                              onClick={() => handleLeagueClick(league)}
                              className="w-full text-left text-xs text-gray-400 hover:text-white hover:bg-[#1a1f2e] px-2 py-1 rounded transition-colors"
                            >
                              {league}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    // For sports with direct leagues
                    <div className="space-y-1">
                      {sport.leagues.map((league) => (
                        <button
                          key={league}
                          onClick={() => handleLeagueClick(league)}
                          className="w-full text-left text-xs text-gray-400 hover:text-white hover:bg-[#1a1f2e] px-2 py-1 rounded transition-colors"
                        >
                          {league}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SportsMenu;
// src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMatches } from '../services/api';
import MatchCard from '../components/MatchCard';
import {
  FiShield, FiChevronDown, FiChevronUp, FiStar, FiBarChart2, FiTrendingUp,
  FiChevronLeft, FiChevronRight, FiMail, FiPhone, FiMapPin,
  FiTwitter, FiFacebook, FiInstagram, FiLinkedin, FiYoutube,
  FiHome, FiCalendar, FiTv, FiLock, FiChevronLeft as FiChevronLeftIcon,
  FiChevronRight as FiChevronRightIcon
} from 'react-icons/fi';
import {
  GiSoccerBall, GiBasketballBall, GiAmericanFootballHelmet, GiBaseballBat,
  GiHockey, GiCricketBat, GiBoxingGlove, GiTrophy, GiDiamondTrophy, GiCrown,
  GiCastle, GiDiceFire, GiMoneyStack, GiPokerHand, GiGoldBar, GiQueenCrown,
  GiCardRandom, GiThreeKeys, GiMagicPortal, GiChest, GiDragonHead,
  GiEgyptianPyramids, GiBookCover, GiFireBowl, GiGorilla, GiClover,
  GiWaves, GiJungle, GiSpinningRibbons, GiCowboyBoot, GiSpiralShell,
  GiDragonOrb, GiChickenOven
} from 'react-icons/gi';

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSport, setOpenSport] = useState(null);
  const [openSubSport, setOpenSubSport] = useState(null);
  const [openSportLeagues, setOpenSportLeagues] = useState({});
  const [openAllSports, setOpenAllSports] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Refs for horizontal scrolling
  const topLeaguesScrollRef = useRef(null);
  const royalHotsScrollRef = useRef(null);

  useEffect(() => {
    loadMatches();
    
    // Disable overscroll behavior on the whole page
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    
    // Cleanup function to restore overscroll when component unmounts
    return () => {
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, []);

  const loadMatches = async () => {
    try {
      const data = await getMatches();
      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueClick = (leagueName) => {
    navigate(`/league/${encodeURIComponent(leagueName)}`);
  };

  const toggleSportLeagues = (sportName) => {
    setOpenSportLeagues(prev => ({
      ...prev,
      [sportName]: !prev[sportName]
    }));
  };

  const toggleAllSports = (sportName) => {
    setOpenAllSports(prev => ({
      ...prev,
      [sportName]: !prev[sportName]
    }));
  };

  // Scroll functions for Top Leagues
  const scrollTopLeaguesLeft = () => {
    if (topLeaguesScrollRef.current) {
      topLeaguesScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollTopLeaguesRight = () => {
    if (topLeaguesScrollRef.current) {
      topLeaguesScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Scroll functions for Royal Hots
  const scrollRoyalHotsLeft = () => {
    if (royalHotsScrollRef.current) {
      royalHotsScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRoyalHotsRight = () => {
    if (royalHotsScrollRef.current) {
      royalHotsScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Slides data - UPDATED with Betika green (#2e7d32)
  const slides = [
    {
      id: 1,
      title: "BET ANYWHERE",
      subtitle: "ANYTIME",
      description: "Mobile betting at your fingertips",
      icon: "📱",
      bgImage: "linear-gradient(135deg, #2e7d32 0%, #000000 100%)",
      cta: "Download App"
    },
    {
      id: 2,
      title: "BASKETBALL",
      subtitle: "BETTING",
      description: "NBA, EuroLeague & more",
      icon: "🏀",
      bgImage: "linear-gradient(135deg, #000000 0%, #2e7d32 100%)",
      cta: "View Games"
    },
    {
      id: 3,
      title: "ACCUMULATOR",
      subtitle: "MULTIPLY YOUR WIN",
      description: "Combine bets for bigger returns",
      icon: "✨",
      bgImage: "linear-gradient(135deg, #2e7d32 0%, #000000 100%)",
      cta: "Build Acca"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Royal Hots games with Betika yellow (#ffd700)
  const royalHotsGames = [
    { name: "Stacks o' Gold", icon: <GiGoldBar className="text-[#ffd700] w-full h-full" /> },
    { name: "Tiger Reign", icon: <GiCrown className="text-[#ffd700] w-full h-full" /> },
    { name: "Pharaos Riches", icon: <GiEgyptianPyramids className="text-[#ffd700] w-full h-full" /> },
    { name: "Book of Pharao", icon: <GiBookCover className="text-[#ffd700] w-full h-full" /> },
    { name: "Pharaos Fire", icon: <GiFireBowl className="text-[#ffd700] w-full h-full" /> },
    { name: "Wild Ape", icon: <GiGorilla className="text-[#ffd700] w-full h-full" /> },
    { name: "Lucky Leprechaun", icon: <GiClover className="text-[#ffd700] w-full h-full" /> },
    { name: "Peking Luck", icon: <GiDragonOrb className="text-[#ffd700] w-full h-full" /> },
    { name: "Wild Water", icon: <GiWaves className="text-[#ffd700] w-full h-full" /> },
    { name: "Jumanji", icon: <GiJungle className="text-[#ffd700] w-full h-full" /> },
    { name: "Grand Spin Superpot", icon: <GiSpinningRibbons className="text-[#ffd700] w-full h-full" /> },
    { name: "Fortune Rangers", icon: <GiCowboyBoot className="text-[#ffd700] w-full h-full" /> },
  ];

  // Top Leagues with actual league logos from API-Sports CDN - borders changed to Betika green
  const topLeagues = [
    {
      name: 'EPL',
      count: 20,
      icon: <img src="https://media.api-sports.io/football/leagues/39.png" alt="EPL" className="w-4/5 h-4/5 object-contain" />
    },
    {
      name: 'UEFA Champions League',
      count: 21,
      icon: <img src="https://media.api-sports.io/football/leagues/2.png" alt="Champions League" className="w-4/5 h-4/5 object-contain" />
    },
    {
      name: 'UEFA Europa League',
      count: 24,
      icon: <img src="https://media.api-sports.io/football/leagues/3.png" alt="Europa League" className="w-4/5 h-4/5 object-contain" />
    },
    {
      name: 'La Liga - Spain',
      count: 20,
      icon: <img src="https://media.api-sports.io/football/leagues/140.png" alt="La Liga" className="w-4/5 h-4/5 object-contain" />
    },
    {
      name: 'Championship',
      count: 24,
      icon: <img src="https://media.api-sports.io/football/leagues/40.png" alt="Championship" className="w-4/5 h-4/5 object-contain" />
    },
    {
      name: 'Serie A - Italy',
      count: 19,
      icon: <img src="https://media.api-sports.io/football/leagues/135.png" alt="Serie A" className="w-4/5 h-4/5 object-contain" />
    },
    {
      name: 'Bundesliga - Germany',
      count: 20,
      icon: <img src="https://media.api-sports.io/football/leagues/78.png" alt="Bundesliga" className="w-4/5 h-4/5 object-contain" />
    },
  ];

  // All Sports with leagues and sport icons - UPDATED with Betika green
  const allSportsWithLeagues = [
    {
      name: 'Football',
      icon: <GiSoccerBall className="text-[#2e7d32]" />,
      leagues: [
        'EPL',
        'UEFA Champions League',
        'UEFA Europa League',
        'La Liga - Spain',
        'Serie A - Italy',
        'Bundesliga - Germany',
        'Ligue 1 - France',
        'Championship'
      ]
    },
    {
      name: 'Basketball',
      icon: <GiBasketballBall className="text-[#2e7d32]" />,
      leagues: [
        'NBA',
        'EuroLeague',
        'WNBA',
        'NCAA Basketball',
        'ACB',
        'NBL'
      ]
    },
    {
      name: 'American Football',
      icon: <GiAmericanFootballHelmet className="text-[#2e7d32]" />,
      leagues: [
        'NFL',
        'NCAAF',
        'CFL',
        'XFL',
        'Super Bowl'
      ]
    },
    {
      name: 'Baseball',
      icon: <GiBaseballBat className="text-[#2e7d32]" />,
      leagues: [
        'MLB',
        'MLB Preseason',
        'NPB',
        'KBO',
        'College Baseball'
      ]
    },
    {
      name: 'Ice Hockey',
      icon: <GiHockey className="text-[#2e7d32]" />,
      leagues: [
        'NHL',
        'KHL',
        'World Championship',
        'SHL',
        'Liiga'
      ]
    },
    {
      name: 'Cricket',
      icon: <GiCricketBat className="text-[#2e7d32]" />,
      leagues: [
        'IPL',
        'The Ashes',
        'Big Bash',
        'T20 World Cup',
        'World Cup',
        'County Championship'
      ]
    },
    {
      name: 'MMA',
      icon: <GiBoxingGlove className="text-[#2e7d32]" />,
      leagues: [
        'UFC',
        'Bellator',
        'ONE Championship',
        'PFL',
        'Boxing'
      ]
    }
  ];

  // Quick Access - UPDATED with Betika green
  const quickAccess = [
    { name: 'Favorites', icon: <FiStar className="text-[#2e7d32]" />, path: '/favorites' },
    { name: 'My Bets', icon: <FiBarChart2 className="text-[#2e7d32]" />, path: '/my-bets' },
    { name: 'Analytics', icon: <FiTrendingUp className="text-[#2e7d32]" />, path: '/analytics' },
    { name: 'Responsible Gambling', icon: <FiShield className="text-[#2e7d32]" />, path: '/responsible-gaming' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0c14]" style={{ overscrollBehavior: 'none' }}>
      {/* Hero Carousel - DIRECT CHILD, NO MAIN ELEMENT */}
      <div className="relative w-full h-[400px] overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="min-w-full h-full relative"
              style={{ background: slide.bgImage }}
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, #ffd700 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              <div className="absolute inset-0 flex items-center container mx-auto px-4">
                <div className="flex-1">
                  <span className="text-8xl opacity-20 absolute top-10 right-20 rotate-12">
                    {slide.icon}
                  </span>
                  <h1 className="text-6xl font-bold text-white mb-2">{slide.title}</h1>
                  <h2 className="text-5xl font-bold text-white/90 mb-4">{slide.subtitle}</h2>
                  <p className="text-xl text-white/80 mb-6 max-w-lg">{slide.description}</p>
                  <button className="px-8 py-3 bg-[#2e7d32] text-white font-bold rounded-lg hover:bg-[#1e5a22] transition-colors shadow-lg">
                    {slide.cta}
                  </button>
                </div>
                <div className="flex-1 flex justify-end">
                  <div className="w-96 h-64 bg-black/30 backdrop-blur-lg rounded-2xl border border-[#ffd700]/20 p-6">
                    <div className="text-[#ffd700] text-sm mb-4">FEATURED</div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Special Offer</span>
                        <span className="text-2xl font-bold text-[#ffd700]">500%</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-[#2e7d32] rounded-full"></div>
                      </div>
                      <div className="text-white/80 text-sm">
                        {slide.id === 1 && "Bet on the go with our mobile app"}
                        {slide.id === 2 && "Live basketball odds now available"}
                        {slide.id === 3 && "Combine up to 10 selections"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10">
          <FiChevronLeft size={20} />
        </button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10">
          <FiChevronRight size={20} />
        </button>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${index === currentSlide ? 'w-8 bg-[#2e7d32]' : 'w-2 bg-white/50 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area - DIRECT CHILD, NO MAIN ELEMENT */}
      <div className="container mx-auto px-4 py-8">
        {/* Top Leagues - with SHARP inner corners - UPDATED border to Betika green */}
        <div className="bg-[#0f1219] rounded-lg border border-[#2a3042] p-5 mb-5 relative max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Top Leagues</h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-[#2e7d32]/10 text-[#2e7d32] px-2 py-1 rounded">
                ACCUMULATOR BETS
              </span>
              <span className="text-xs text-gray-500">3x 5x - Multiply Your Win</span>
            </div>
          </div>

          {/* Scroll buttons */}
          <button
            onClick={scrollTopLeaguesLeft}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
          >
            <FiChevronLeftIcon size={20} />
          </button>
          <button
            onClick={scrollTopLeaguesRight}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
          >
            <FiChevronRightIcon size={20} />
          </button>

          {/* Scrollable container */}
          <div
            ref={topLeaguesScrollRef}
            className="flex overflow-x-auto pb-2 gap-4 hide-scrollbar scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topLeagues.map(league => (
              <div
                key={league.name}
                onClick={() => handleLeagueClick(league.name)}
                className="flex-shrink-0 w-[160px] flex flex-col items-center border-[25px] border-[#2e7d32] rounded-2xl relative cursor-pointer transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: '#000000',
                  aspectRatio: '1/1'
                }}
              >
                {/* Inner white container - SHARP CORNERS (rounded-none) */}
                <div className="absolute inset-0 m-[0] bg-white rounded-none flex items-center justify-center overflow-hidden">
                  <div className="w-3/4 h-3/4 flex items-center justify-center transition-transform duration-300 hover:scale-125">
                    {league.icon}
                  </div>
                </div>
                {/* League name at bottom of green margin */}
                <span className="absolute bottom-[-8px] left-0 right-0 text-center text-xs text-white font-medium line-clamp-1 px-1 bg-transparent">
                  {league.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Royal Hots - with SHARP inner corners - UPDATED border to Betika green */}
        <div className="bg-[#0f1219] rounded-lg border border-[#2a3042] p-5 mb-5 relative max-w-5xl mx-auto">
          <h2 className="text-white font-semibold mb-4 flex items-center">
            <span className="w-1 h-5 bg-[#2e7d32] rounded-full mr-3"></span>
            Royal Hots
          </h2>

          {/* Scroll buttons */}
          <button
            onClick={scrollRoyalHotsLeft}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
          >
            <FiChevronLeftIcon size={20} />
          </button>
          <button
            onClick={scrollRoyalHotsRight}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
          >
            <FiChevronRightIcon size={20} />
          </button>

          {/* Scrollable container */}
          <div
            ref={royalHotsScrollRef}
            className="overflow-x-auto pb-2 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* First Row - 6 items */}
            <div className="flex gap-4 mb-4">
              {royalHotsGames.slice(0, 6).map((game, index) => (
                <div
                  key={index}
                  onClick={() => {}}
                  className="flex-shrink-0 w-[160px] aspect-square border-[25px] border-[#2e7d32] rounded-2xl relative cursor-pointer transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: '#000000'
                  }}
                >
                  {/* Inner white container - SHARP CORNERS (rounded-none) */}
                  <div className="absolute inset-0 m-[0] bg-white rounded-none flex items-center justify-center overflow-hidden">
                    <div className="w-3/4 h-3/4 flex items-center justify-center transition-transform duration-300 hover:scale-125">
                      <span className="text-[#ffd700] w-full h-full flex items-center justify-center text-2xl">
                        {game.icon}
                      </span>
                    </div>
                  </div>
                  {/* Game name at bottom of green margin */}
                  <span className="absolute bottom-[-8px] left-0 right-0 text-center text-xs text-white font-medium px-1 bg-transparent">
                    {game.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Second Row - remaining 6 items */}
            <div className="flex gap-4">
              {royalHotsGames.slice(6, 12).map((game, index) => (
                <div
                  key={index + 6}
                  onClick={() => {}}
                  className="flex-shrink-0 w-[160px] aspect-square border-[25px] border-[#2e7d32] rounded-2xl relative cursor-pointer transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: '#000000'
                  }}
                >
                  {/* Inner white container - SHARP CORNERS (rounded-none) */}
                  <div className="absolute inset-0 m-[0] bg-white rounded-none flex items-center justify-center overflow-hidden">
                    <div className="w-3/4 h-3/4 flex items-center justify-center transition-transform duration-300 hover:scale-125">
                      <span className="text-[#ffd700] w-full h-full flex items-center justify-center text-2xl">
                        {game.icon}
                      </span>
                    </div>
                  </div>
                  {/* Game name at bottom of green margin */}
                  <span className="absolute bottom-[-8px] left-0 right-0 text-center text-xs text-white font-medium px-1 bg-transparent">
                    {game.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Sports Panel - UPDATED accent color to Betika green */}
        <div className="bg-[#0f1219] rounded-lg border border-[#2a3042] p-5 max-w-5xl mx-auto">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <span className="w-1 h-5 bg-[#2e7d32] rounded-full mr-3"></span>
            LiveSports
          </h3>
          
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-white">Football</span>
            </div>
            <div className="space-y-2 pl-3">
              <div
                onClick={() => handleLeagueClick('Bundesliga - Germany')}
                className="text-xs text-gray-400 hover:text-white cursor-pointer flex items-center justify-between group"
              >
                <span>Bundesliga - Germany</span>
                <span className="text-[10px] text-[#2e7d32] opacity-0 group-hover:opacity-100 transition-opacity">
                  SERIEA
                </span>
              </div>
              <div
                onClick={() => handleLeagueClick('Serie A - Italy')}
                className="text-xs text-gray-400 hover:text-white cursor-pointer flex items-center justify-between group"
              >
                <span>Serie A - Italy</span>
                <span className="text-[10px] text-[#2e7d32] opacity-0 group-hover:opacity-100 transition-opacity">
                  BUNDESLIGA
                </span>
              </div>
              <div className="text-xs text-gray-400 flex items-center justify-between">
                <span>Ligue 1 - France</span>
                <span className="text-[10px] text-[#2e7d32]">
                  UEFACHAMPIONS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
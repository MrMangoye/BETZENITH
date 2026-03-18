import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LeagueCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      id: 1,
      title: "BUNDESLIGA",
      subtitle: "Germany",
      icon: "🇩🇪",
      multiplier: "5x",
      color: "from-red-600 to-red-800",
      leagues: [
        { name: "Bayern Munich", odds: "1.85" },
        { name: "Borussia Dortmund", odds: "2.10" },
        { name: "RB Leipzig", odds: "3.20" },
      ]
    },
    {
      id: 2,
      title: "UEFA Champions League",
      subtitle: "Europe",
      icon: "🏆",
      multiplier: "3x",
      color: "from-blue-600 to-blue-800",
      leagues: [
        { name: "Real Madrid", odds: "2.05" },
        { name: "Manchester City", odds: "1.95" },
        { name: "Bayern Munich", odds: "2.15" },
      ]
    },
    {
      id: 3,
      title: "Ligue 1",
      subtitle: "France",
      icon: "🇫🇷",
      multiplier: "2x",
      color: "from-sky-600 to-sky-800",
      leagues: [
        { name: "PSG", odds: "1.75" },
        { name: "Marseille", odds: "2.35" },
        { name: "Lyon", odds: "2.85" },
      ]
    },
    {
      id: 4,
      title: "SERIE A",
      subtitle: "Italy",
      icon: "🇮🇹",
      multiplier: "3x",
      color: "from-green-600 to-green-800",
      leagues: [
        { name: "Inter Milan", odds: "1.95" },
        { name: "AC Milan", odds: "2.15" },
        { name: "Juventus", odds: "2.25" },
      ]
    },
    {
      id: 5,
      title: "EPL",
      subtitle: "England",
      icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      multiplier: "5x",
      color: "from-purple-600 to-purple-800",
      leagues: [
        { name: "Manchester City", odds: "1.85" },
        { name: "Arsenal", odds: "2.05" },
        { name: "Liverpool", odds: "2.25" },
      ]
    },
    {
      id: 6,
      title: "La Liga",
      subtitle: "Spain",
      icon: "🇪🇸",
      multiplier: "3x",
      color: "from-yellow-600 to-yellow-800",
      leagues: [
        { name: "Real Madrid", odds: "1.90" },
        { name: "Barcelona", odds: "2.10" },
        { name: "Atletico Madrid", odds: "2.40" },
      ]
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleLeagueClick = (leagueName) => {
    navigate(`/league/${encodeURIComponent(leagueName)}`);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#0f1219] border border-[#2a3042] p-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold flex items-center">
          <span className="w-1 h-5 bg-[#00b3b3] rounded-full mr-3"></span>
          TOP LEAGUES
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-[#00b3b3]/10 text-[#00b3b3] px-2 py-1 rounded">ACCUMULATOR BETS</span>
          <span className="text-xs text-gray-500">- Multiply Your Win</span>
        </div>
      </div>

      {/* Carousel container */}
      <div className="relative">
        {/* Main slide */}
        <div className="relative h-48 overflow-hidden rounded-lg">
          <div
            className="absolute inset-0 transition-all duration-500 ease-in-out"
            style={{
              background: `linear-gradient(135deg, #1a1f2e 0%, #0f1219 100%)`,
            }}
          >
            {/* Slide content */}
            <div className="absolute inset-0 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-3xl">{slides[currentIndex].icon}</span>
                    <span className="text-4xl font-bold text-white">{slides[currentIndex].multiplier}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{slides[currentIndex].title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{slides[currentIndex].subtitle}</p>
                  
                  {/* League odds */}
                  <div className="space-y-1">
                    {slides[currentIndex].leagues.map((league, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleLeagueClick(league.name)}
                        className="flex items-center justify-between text-sm cursor-pointer group"
                      >
                        <span className="text-gray-300 group-hover:text-white transition-colors">{league.name}</span>
                        <span className="text-[#00b3b3] font-bold">{league.odds}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Multiplier badges */}
                <div className="flex flex-col space-y-2">
                  <span className="text-2xl font-bold text-[#00b3b3]">3x</span>
                  <span className="text-2xl font-bold text-[#00b3b3]">5x</span>
                  <span className="text-2xl font-bold text-[#00b3b3]">2x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1a1f2e] border border-[#2a3042] rounded-full flex items-center justify-center text-white hover:bg-[#00b3b3] transition-colors z-10"
        >
          ←
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1a1f2e] border border-[#2a3042] rounded-full flex items-center justify-center text-white hover:bg-[#00b3b3] transition-colors z-10"
        >
          →
        </button>

        {/* Dots indicator */}
        <div className="flex justify-center space-x-2 mt-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-[#00b3b3]'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Quick multiplier badges */}
      <div className="flex items-center justify-end space-x-2 mt-3">
        <span className="text-xs text-gray-500">Quick multipliers:</span>
        <span className="px-2 py-1 bg-[#00b3b3]/10 text-[#00b3b3] text-xs rounded border border-[#00b3b3]/20">3x</span>
        <span className="px-2 py-1 bg-[#00b3b3]/10 text-[#00b3b3] text-xs rounded border border-[#00b3b3]/20">5x</span>
        <span className="px-2 py-1 bg-[#00b3b3]/10 text-[#00b3b3] text-xs rounded border border-[#00b3b3]/20">2x</span>
      </div>
    </div>
  );
};

export default LeagueCarousel;
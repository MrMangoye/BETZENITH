import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMatches } from '../services/api';
import MatchCard from '../components/MatchCard';
import { FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Favorites() {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view favorites');
      return;
    }
    loadFavorites();
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    try {
      // Get user's favorite matches from localStorage or API
      const savedFavorites = localStorage.getItem('favorites');
      const favoriteIds = savedFavorites ? JSON.parse(savedFavorites) : [];
      
      if (favoriteIds.length > 0) {
        const matches = await getMatches();
        const favoriteMatches = matches.filter(m => favoriteIds.includes(m._id));
        setFavorites(favoriteMatches);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (matchId) => {
    const savedFavorites = localStorage.getItem('favorites');
    let favoriteIds = savedFavorites ? JSON.parse(savedFavorites) : [];
    favoriteIds = favoriteIds.filter(id => id !== matchId);
    localStorage.setItem('favorites', JSON.stringify(favoriteIds));
    
    setFavorites(prev => prev.filter(m => m._id !== matchId));
    toast.success('Removed from favorites');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f1117] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-[#1a1f2e] rounded-lg p-8 text-center">
            <FiHeart className="text-6xl text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Favorites</h1>
            <p className="text-gray-400 mb-6">Please login to view your favorite matches</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-[#00b3b3] text-white rounded-lg font-bold hover:bg-[#009999]"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Your Favorites</h1>
          <span className="text-gray-400">{favorites.length} matches</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00b3b3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-[#1a1f2e] rounded-lg p-12 text-center">
            <FiHeart className="text-6xl text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl text-white mb-2">No favorites yet</h2>
            <p className="text-gray-400 mb-6">Add matches to your favorites to see them here</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-[#00b3b3] text-white rounded-lg font-bold hover:bg-[#009999]"
            >
              Browse Matches
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {favorites.map(match => (
              <div key={match._id} className="relative">
                <button
                  onClick={() => removeFavorite(match._id)}
                  className="absolute top-2 right-2 z-10 p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                >
                  <FiHeart className="fill-current" />
                </button>
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getMatches, 
  getUsers, 
  createMatch, 
  updateMatch, 
  settleMatch,
  deleteMatch,
  updateUserRole,
  getDashboardStats 
} from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateMatch, setShowCreateMatch] = useState(false);

  const [newMatch, setNewMatch] = useState({
    league: 'Japan. Samurai League',
    homeTeam: { name: '', abbreviation: '' },
    awayTeam: { name: '', abbreviation: '' },
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    status: 'SCHEDULED'
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/');
      return;
    }
    
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load data based on active tab
      const promises = [];
      
      if (activeTab === 'matches' || activeTab === 'all') {
        promises.push(getMatches());
      }
      
      if (activeTab === 'users' || activeTab === 'all') {
        promises.push(getUsers());
      }
      
      if (activeTab === 'reports' || activeTab === 'all') {
        promises.push(getDashboardStats().catch(() => null));
      }
      
      const results = await Promise.allSettled(promises);
      let resultIndex = 0;
      
      if (activeTab === 'matches' || activeTab === 'all') {
        if (results[resultIndex]?.status === 'fulfilled') {
          setMatches(results[resultIndex].value);
        }
        resultIndex++;
      }
      
      if (activeTab === 'users' || activeTab === 'all') {
        if (results[resultIndex]?.status === 'fulfilled') {
          setUsers(results[resultIndex].value);
        }
        resultIndex++;
      }
      
      if (activeTab === 'reports' || activeTab === 'all') {
        if (results[resultIndex]?.status === 'fulfilled') {
          setStats(results[resultIndex].value);
        }
      }
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [activeTab]);

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newMatch.homeTeam.name || !newMatch.homeTeam.abbreviation ||
        !newMatch.awayTeam.name || !newMatch.awayTeam.abbreviation) {
      toast.error('Please fill in all team details');
      return;
    }
    
    try {
      await createMatch(newMatch);
      toast.success('Match created successfully');
      setShowCreateMatch(false);
      setNewMatch({
        league: 'Japan. Samurai League',
        homeTeam: { name: '', abbreviation: '' },
        awayTeam: { name: '', abbreviation: '' },
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        status: 'SCHEDULED'
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create match');
    }
  };

  const handleSettleMatch = async (matchId, winner) => {
    if (!winner) return;
    
    if (!confirm('Are you sure you want to settle this match? This action cannot be undone.')) {
      return;
    }
    
    try {
      await settleMatch(matchId, winner);
      toast.success('Match settled successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to settle match');
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!confirm('Are you sure you want to delete this match?')) {
      return;
    }
    
    try {
      await deleteMatch(matchId);
      toast.success('Match deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete match');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success('User role updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00b3b3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <div className="bg-[#1a1f2e] px-4 py-2 rounded-lg">
          <span className="text-gray-400">Logged in as: </span>
          <span className="text-[#00b3b3] font-semibold">{user?.username}</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-800">
        {[
          { id: 'matches', label: 'Matches', icon: '⚽' },
          { id: 'users', label: 'Users', icon: '👥' },
          { id: 'reports', label: 'Reports', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium capitalize flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'text-[#00b3b3] border-b-2 border-[#00b3b3] bg-[#1a1f2e]'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1f2e]'
            } rounded-t-lg transition-colors`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Manage Matches</h2>
            <button
              onClick={() => setShowCreateMatch(!showCreateMatch)}
              className="px-4 py-2 bg-[#00b3b3] text-white rounded-lg hover:bg-[#009999] transition-colors flex items-center space-x-2"
            >
              <span>+</span>
              <span>{showCreateMatch ? 'Cancel' : 'Create Match'}</span>
            </button>
          </div>

          {/* Create Match Form */}
          {showCreateMatch && (
            <div className="bg-[#1a1f2e] rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Create New Match</h3>
              <form onSubmit={handleCreateMatch} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">League</label>
                  <input
                    type="text"
                    value={newMatch.league}
                    onChange={(e) => setNewMatch({...newMatch, league: e.target.value})}
                    className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3]"
                    placeholder="e.g., Japan. Samurai League"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Home Team Name</label>
                    <input
                      type="text"
                      value={newMatch.homeTeam.name}
                      onChange={(e) => setNewMatch({
                        ...newMatch, 
                        homeTeam: {...newMatch.homeTeam, name: e.target.value}
                      })}
                      className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3]"
                      placeholder="e.g., Shadow Warriors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Home Team Abbr</label>
                    <input
                      type="text"
                      value={newMatch.homeTeam.abbreviation}
                      onChange={(e) => setNewMatch({
                        ...newMatch, 
                        homeTeam: {...newMatch.homeTeam, abbreviation: e.target.value.toUpperCase()}
                      })}
                      className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3]"
                      placeholder="e.g., S"
                      maxLength="3"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Away Team Name</label>
                    <input
                      type="text"
                      value={newMatch.awayTeam.name}
                      onChange={(e) => setNewMatch({
                        ...newMatch, 
                        awayTeam: {...newMatch.awayTeam, name: e.target.value}
                      })}
                      className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3]"
                      placeholder="e.g., Orchard SC"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Away Team Abbr</label>
                    <input
                      type="text"
                      value={newMatch.awayTeam.abbreviation}
                      onChange={(e) => setNewMatch({
                        ...newMatch, 
                        awayTeam: {...newMatch.awayTeam, abbreviation: e.target.value.toUpperCase()}
                      })}
                      className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3]"
                      placeholder="e.g., O"
                      maxLength="3"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Date</label>
                    <input
                      type="date"
                      value={newMatch.date}
                      onChange={(e) => setNewMatch({...newMatch, date: e.target.value})}
                      className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Time</label>
                    <input
                      type="time"
                      value={newMatch.time}
                      onChange={(e) => setNewMatch({...newMatch, time: e.target.value})}
                      className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3]"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#00b3b3] text-white rounded-lg hover:bg-[#009999] transition-colors"
                  >
                    Create Match
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateMatch(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Matches List */}
          <div className="bg-[#1a1f2e] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2a2f3f]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Match</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">League</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date/Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Odds</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {matches.map((match) => (
                    <tr key={match._id} className="hover:bg-[#2a2f3f] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          {match.homeTeam?.name || 'Home'} vs {match.awayTeam?.name || 'Away'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {match.homeTeam?.abbreviation || 'H'} - {match.awayTeam?.abbreviation || 'A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{match.league}</td>
                      <td className="px-6 py-4">
                        <div className="text-white">{new Date(match.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{match.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          match.status === 'LIVE' ? 'bg-green-500/20 text-green-400' :
                          match.status === 'FINISHED' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {match.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-1">
                          {match.markets?.map((m, idx) => (
                            <span key={idx} className="text-xs bg-[#2a2f3f] px-2 py-1 rounded text-[#00b3b3]">
                              {m.odds}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {match.status !== 'FINISHED' && (
                            <select
                              onChange={(e) => handleSettleMatch(match._id, e.target.value)}
                              className="bg-[#2a2f3f] text-white text-xs rounded px-2 py-1 border border-gray-700"
                              defaultValue=""
                            >
                              <option value="" disabled>Settle as</option>
                              <option value="HOME">Home Win</option>
                              <option value="AWAY">Away Win</option>
                              <option value="DRAW">Draw</option>
                            </select>
                          )}
                          <button
                            onClick={() => handleDeleteMatch(match._id)}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/10 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-[#1a1f2e] rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2a2f3f]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-[#2a2f3f] transition-colors">
                    <td className="px-6 py-4 text-white">{userItem.username}</td>
                    <td className="px-6 py-4 text-gray-400">{userItem.email}</td>
                    <td className="px-6 py-4 text-[#00cc88] font-medium">₦{userItem.balance}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        userItem.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {userItem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {userItem._id !== user?._id && (
                        <select
                          onChange={(e) => handleUpdateUserRole(userItem._id, e.target.value)}
                          className="bg-[#2a2f3f] text-white text-xs rounded px-2 py-1 border border-gray-700"
                          value={userItem.role}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-[#1a1f2e] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Reports & Analytics</h2>
          
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#2a2f3f] p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm">Total Bets</h3>
                <p className="text-2xl font-bold text-white">{stats.totalBets || 0}</p>
              </div>
              <div className="bg-[#2a2f3f] p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm">Total Users</h3>
                <p className="text-2xl font-bold text-white">{stats.totalUsers || users.length}</p>
              </div>
              <div className="bg-[#2a2f3f] p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm">Total Revenue</h3>
                <p className="text-2xl font-bold text-[#00cc88]">₦{stats.totalRevenue || 0}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              Analytics dashboard coming soon. Check back later for detailed reports.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
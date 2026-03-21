// src/pages/Deposit.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deposit } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';

// Till Deposit Component
const TillDeposit = ({ onSuccess, user, setUser }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleMpesaDeposit = async () => {
    if (amount < 100) {
      toast.error('Minimum deposit is KSh 100');
      return;
    }
    
    if (!phoneNumber.match(/^254[0-9]{9}$/)) {
      toast.error('Enter a valid phone number (e.g., 254712345678)');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('/api/payments/mpesa', {
        phoneNumber,
        amount,
        paymentMethod: 'till'
      });
      
      toast.success(`Enter PIN on your phone to complete payment`);
      
      // Poll for payment confirmation
      const checkInterval = setInterval(async () => {
        try {
          const status = await axios.get(`/api/payments/status/${response.data.transactionId}`);
          if (status.data.completed) {
            clearInterval(checkInterval);
            toast.success(`KSh ${amount} deposited successfully!`);
            if (onSuccess) {
              onSuccess(status.data.newBalance);
            }
            setPhoneNumber('');
            setAmount('');
          }
        } catch (err) {
          console.error('Error checking payment status:', err);
        }
      }, 3000);
      
      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!response.data.completed) {
          toast.info('Payment still processing. Check your balance in a few minutes.');
        }
      }, 120000);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-[#1a1f2e] rounded-xl p-6 mt-6 border border-[#2a3042]">
      <h3 className="text-white font-bold mb-4 flex items-center">
        <span className="text-2xl mr-2">📱</span>
        Deposit via Till Number
      </h3>
      
      <div className="bg-gradient-to-r from-[#2e7d32]/20 to-[#2e7d32]/5 rounded-lg p-4 mb-4 text-center border border-[#2e7d32]/30">
        <p className="text-gray-400 text-sm">Paybill/Till Number</p>
        <p className="text-3xl font-bold text-[#2e7d32]">5243333</p>
        <p className="text-gray-500 text-xs mt-1">Account: Your Phone Number</p>
      </div>
      
      <input
        type="tel"
        placeholder="Phone Number (e.g., 254712345678)"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="w-full px-4 py-3 bg-[#2a2f3f] rounded-lg text-white mb-3 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
      />
      
      <input
        type="number"
        placeholder="Amount (Min KSh 100)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full px-4 py-3 bg-[#2a2f3f] rounded-lg text-white mb-4 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
        min="100"
      />
      
      <button
        onClick={handleMpesaDeposit}
        disabled={loading || !phoneNumber || !amount || amount < 100}
        className="w-full py-3 bg-gradient-to-r from-[#2e7d32] to-[#1e5a22] text-white rounded-lg font-bold hover:from-[#1e5a22] hover:to-[#0e3a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : 'Pay with M-Pesa'}
      </button>
      
      <p className="text-gray-500 text-xs text-center mt-3">
        You will receive a prompt on your phone to enter PIN
      </p>
    </div>
  );
};

// Betting Trends Component with Authentication
const BettingTrends = () => {
  const [trends, setTrends] = useState({
    mostBetTeams: [],
    averageStake: 0,
    totalBetsToday: 0,
    personalized: null
  });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/ai/trends');
        setTrends(response.data.data);
      } catch (error) {
        console.error('Error fetching trends:', error);
        // Fallback data
        setTrends({
          mostBetTeams: [{ name: 'Manchester City', betCount: 1250 }, { name: 'Real Madrid', betCount: 980 }],
          averageStake: 1250,
          totalBetsToday: 342,
          personalized: isAuthenticated ? {
            yourMostBetTeam: 'Loading...',
            yourWinRate: 0,
            yourAverageStake: 0,
            comparisonMessage: 'Complete more bets to see your stats!'
          } : null
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrends();
    const interval = setInterval(fetchTrends, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  
  if (loading) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl p-4 border border-[#2a3042] animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#1a1f2e] rounded-xl p-4 border border-[#2a3042]">
      <h3 className="text-white font-bold mb-3 flex items-center">
        <span className="text-lg mr-2">🔥</span>
        Betting Trends
        {isAuthenticated && trends.personalized && trends.personalized.yourWinRate > 0 && (
          <span className="ml-2 text-xs bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
            Personalized
          </span>
        )}
      </h3>
      
      {/* Personalized section for authenticated users with data */}
      {isAuthenticated && trends.personalized && trends.personalized.yourWinRate > 0 && (
        <div className="mb-4 p-3 bg-[#2e7d32]/10 rounded-lg border border-[#2e7d32]/30">
          <div className="text-xs text-[#2e7d32] font-semibold mb-2 flex items-center">
            <span className="mr-1">📊</span> YOUR STATS
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
            <div>
              <span className="text-gray-400 text-xs">Most bet team:</span>
              <p className="text-white font-bold text-sm">{trends.personalized.yourMostBetTeam || 'None yet'}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Your win rate:</span>
              <p className="text-green-400 font-bold text-sm">{trends.personalized.yourWinRate}%</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Your avg stake:</span>
              <p className="text-white text-sm">KSh {trends.personalized.yourAverageStake?.toLocaleString() || 0}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Total bets:</span>
              <p className="text-white text-sm">{trends.personalized.yourBetCount || 0}</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-[#2e7d32]/30">
            {trends.personalized.comparisonMessage}
          </div>
        </div>
      )}
      
      {/* Message for authenticated users with no data yet */}
      {isAuthenticated && trends.personalized && trends.personalized.yourWinRate === 0 && (
        <div className="mb-4 p-3 bg-[#2a2f3f] rounded-lg text-center">
          <p className="text-xs text-gray-400">Place your first bet to see personalized stats!</p>
        </div>
      )}
      
      {/* Public trends */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Most Bet Team Today:</span>
          <span className="text-white font-bold text-sm">{trends.mostBetTeams[0]?.name || 'Loading...'}</span>
          <span className="text-[#2e7d32] text-xs font-semibold">{trends.mostBetTeams[0]?.betCount || 0} bets</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Average Stake:</span>
          <span className="text-white font-bold">KSh {trends.averageStake?.toLocaleString() || 1250}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Total Bets Today:</span>
          <span className="text-white font-bold">{trends.totalBetsToday?.toLocaleString() || 342}</span>
        </div>
        {trends.mostBetTeams[1] && (
          <div className="text-center pt-2 border-t border-[#2a3042] mt-2">
            <span className="text-xs text-gray-500">🔥 {trends.mostBetTeams[1]?.name} also trending</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState('card');
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const predefinedAmounts = [100, 500, 1000, 5000, 10000, 50000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (amount < 100) {
      toast.error('Minimum deposit is 100');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await deposit(amount);
      setUser({ ...user, balance: response.newBalance });
      toast.success(`Successfully deposited KSh ${amount}`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSuccess = (newBalance) => {
    setUser({ ...user, balance: newBalance });
    navigate('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#1a1f2e] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Deposit Funds</h1>
        
        <div className="mb-6">
          <p className="text-gray-400">Current Balance</p>
          <p className="text-3xl font-bold text-[#00cc88]">KSh {user?.balance?.toLocaleString() || 0}</p>
        </div>

        {/* Payment Method Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveMethod('card')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeMethod === 'card'
                ? 'bg-[#2e7d32] text-white'
                : 'bg-[#2a2f3f] text-gray-400 hover:text-white'
            }`}
          >
            💳 Card
          </button>
          <button
            onClick={() => setActiveMethod('till')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeMethod === 'till'
                ? 'bg-[#2e7d32] text-white'
                : 'bg-[#2a2f3f] text-gray-400 hover:text-white'
            }`}
          >
            📱 M-Pesa
          </button>
        </div>
        
        {activeMethod === 'card' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Amount (KSh)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                placeholder="Enter amount"
                min="100"
                required
              />
            </div>
            
            <div>
              <p className="text-gray-400 mb-2">Quick Select</p>
              <div className="grid grid-cols-3 gap-2">
                {predefinedAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className="py-2 bg-[#2a2f3f] rounded hover:bg-[#353b4d] text-white"
                  >
                    KSh {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-[#2a2f3f] p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Payment Method</p>
              <div className="flex items-center space-x-2">
                <input type="radio" checked readOnly className="text-[#2e7d32]" />
                <span className="text-white">Credit/Debit Card</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <input type="radio" checked={false} readOnly className="text-[#2e7d32]" />
                <span className="text-gray-500">Bank Transfer</span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2e7d32] text-white rounded-lg font-bold hover:bg-[#1e5a22] transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Deposit Now'}
            </button>
          </form>
        ) : (
          <TillDeposit 
            onSuccess={handleDepositSuccess}
            user={user}
            setUser={setUser}
          />
        )}

        {/* Betting Trends Section */}
        <div className="mt-6">
          <BettingTrends />
        </div>
      </div>
    </div>
  );
}
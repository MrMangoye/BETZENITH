import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deposit } from '../services/api';
import toast from 'react-hot-toast';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
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
      toast.success(`Successfully deposited ₦${amount}`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#1a1f2e] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Deposit Funds</h1>
        
        <div className="mb-6">
          <p className="text-gray-400">Current Balance</p>
          <p className="text-3xl font-bold text-[#00cc88]">₦{user?.balance?.toFixed(2)}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00b3b3]"
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
                  ₦{amt}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-[#2a2f3f] p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Mock Payment Method</p>
            <div className="flex items-center space-x-2">
              <input type="radio" checked readOnly className="text-[#00b3b3]" />
              <span className="text-white">Credit Card (Test Mode)</span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00b3b3] text-white rounded-lg font-bold hover:bg-[#009999] transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Deposit Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
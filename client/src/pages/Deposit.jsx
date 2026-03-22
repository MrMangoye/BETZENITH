// src/pages/Deposit.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://betzenith-9dx1.onrender.com/api';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [minDeposit, setMinDeposit] = useState(500);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const predefinedAmounts = [500, 1000, 2500, 5000, 10000, 25000, 50000];

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/payments/methods`);
      if (response.data && response.data.success) {
        setMinDeposit(response.data.data.minDeposit || 500);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setMinDeposit(500);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum < minDeposit) {
      toast.error(`Minimum deposit is KSh ${minDeposit.toLocaleString()}`);
      return;
    }
    
    if (!phoneNumber) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        method: 'POST',
        url: `${BACKEND_URL}/payments/deposit`,
        data: {
          amount: amountNum,
          paymentMethod: 'till',
          currency: 'KES',
          phoneNumber
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (response.data && response.data.success) {
        setPendingTransaction(response.data.data);
        
        // Show success message
        toast.success(
          `✅ Payment initiated! Check your phone for the M-Pesa prompt.`,
          { duration: 5000 }
        );
        
        toast(
          `📱 Enter your M-Pesa PIN on your phone to complete the payment of KSh ${amountNum.toLocaleString()}.`,
          { duration: 8000, icon: '📱' }
        );
        
        // Start polling for confirmation
        startPollingForConfirmation(response.data.data.reference);
      } else {
        toast.error(response.data?.message || 'Failed to initiate deposit');
      }
      
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  const startPollingForConfirmation = (reference) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios({
          method: 'GET',
          url: `${BACKEND_URL}/payments/check-deposit/${reference}`,
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (response.data && response.data.success && response.data.data.status === 'COMPLETED') {
          clearInterval(interval);
          toast.success('✅ Deposit confirmed! Your balance has been updated.');
          
          // Trigger balance update
          window.dispatchEvent(new CustomEvent('balance-update', { 
            detail: { newBalance: (user?.balance || 0) + parseFloat(amount) }
          }));
          
          setPendingTransaction(null);
          setAmount('');
          setPhoneNumber('');
          navigate('/dashboard');
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          toast('⏳ Still waiting for confirmation. Check your M-Pesa messages.', { icon: '⏳' });
        }
      } catch (error) {
        console.error('Error checking deposit status:', error);
      }
    }, 5000);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#1a1f2e] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Deposit Funds</h1>
        
        {/* Balance Display */}
        <div className="mb-6 p-4 bg-[#2a2f3f] rounded-lg">
          <p className="text-gray-400 text-sm mb-2">Your Balance</p>
          <p className="text-2xl font-bold text-[#00cc88]">KSh {user?.balance?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            ≈ UGX {((user?.balance || 0) * 28.5).toLocaleString()} | 
            ≈ MWK {((user?.balance || 0) * 12.8).toLocaleString()}
          </p>
        </div>

        {/* Phone Number Input */}
        <div className="mb-4">
          <label className="block text-gray-400 mb-2 text-sm">
            M-Pesa Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g., 254712345678 or 0712345678"
            className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            You will receive a prompt on this number to enter your PIN
          </p>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-gray-400 mb-2 text-sm">
            Amount (KSh)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
            placeholder={`Min KSh ${minDeposit.toLocaleString()}`}
            min={minDeposit}
            required
          />
        </div>
        
        {/* Quick Amount Select */}
        <div className="mb-6">
          <p className="text-gray-400 mb-2 text-sm">Quick Select</p>
          <div className="grid grid-cols-4 gap-2">
            {predefinedAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className="py-2 bg-[#2a2f3f] rounded hover:bg-[#353b4d] text-white text-sm"
              >
                KSh {amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Info Card */}
        <div className="mb-6 p-4 bg-[#2e7d32]/10 rounded-lg border border-[#2e7d32]/30">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2">📱</span>
            <h3 className="text-white font-bold text-sm">M-Pesa Till Number</h3>
          </div>
          <p className="text-3xl font-bold text-[#2e7d32] mb-3 text-center">9960318</p>
          <div className="text-xs text-gray-300">
            <p>1️⃣ You'll receive a prompt on your phone</p>
            <p>2️⃣ Enter your M-Pesa PIN</p>
            <p>3️⃣ Payment will be processed instantly</p>
          </div>
          <div className="mt-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded">
            ⚠️ Minimum deposit: KSh {minDeposit.toLocaleString()}
          </div>
        </div>
        
        <button
          onClick={handleDeposit}
          disabled={loading || !amount || !phoneNumber}
          className="w-full py-3 bg-[#2e7d32] text-white rounded-lg font-bold hover:bg-[#1e5a22] transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay with M-Pesa'}
        </button>

        {pendingTransaction && (
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <p className="text-blue-400 text-sm text-center">
              ⏳ Waiting for payment confirmation...<br />
              Check your phone for the M-Pesa prompt.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-4">
          You will receive a prompt on your phone to enter your M-Pesa PIN.<br />
          Payment is processed instantly.
        </p>
      </div>
    </div>
  );
}
// src/pages/Deposit.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
      const response = await axios.get('/api/payments/methods');
      if (response.data && response.data.success) {
        setMinDeposit(response.data.data.minDeposit || 500);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setMinDeposit(500);
    }
  };

  const handleInitiateDeposit = async (e) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum < minDeposit) {
      toast.error(`Minimum deposit is KSh ${minDeposit.toLocaleString()}`);
      return;
    }
    
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/payments/deposit', {
        amount: amountNum,
        paymentMethod: 'till',
        currency: 'KES',
        phoneNumber
      });
      
      if (response.data && response.data.success) {
        setPendingTransaction(response.data.data);
        
        // Show payment instructions
        toast.success(
          `Send KSh ${amountNum.toLocaleString()} to Till Number: 9960318`,
          { duration: 5000 }
        );
        
        toast.info(
          `📱 M-Pesa Instructions:\n\n` +
          `1. Go to M-Pesa\n` +
          `2. Select "Lipa na M-Pesa"\n` +
          `3. Select "Till Number"\n` +
          `4. Enter Till Number: 9960318\n` +
          `5. Enter Amount: KSh ${amountNum.toLocaleString()}\n` +
          `6. Enter your M-Pesa PIN\n` +
          `7. Confirm payment\n\n` +
          `✅ You will receive a confirmation SMS`,
          { duration: 10000 }
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
        const response = await axios.get(`/api/payments/check-deposit/${reference}`);
        
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
          toast.info('⏳ Still waiting for confirmation. You can check your balance later.');
        }
      } catch (error) {
        console.error('Error checking deposit status:', error);
      }
    }, 5000);
  };

  const handleConfirmManually = async () => {
    if (!pendingTransaction) return;
    
    setConfirming(true);
    const transactionId = prompt('Enter the M-Pesa transaction code from your SMS:');
    if (!transactionId) {
      setConfirming(false);
      return;
    }
    
    try {
      const response = await axios.post('/api/payments/confirm-deposit', {
        reference: pendingTransaction.reference,
        transactionId: transactionId,
        phoneNumber
      });
      
      if (response.data && response.data.success) {
        toast.success('✅ Deposit confirmed!');
        
        window.dispatchEvent(new CustomEvent('balance-update', { 
          detail: { newBalance: response.data.data.newBalance }
        }));
        
        setPendingTransaction(null);
        setAmount('');
        setPhoneNumber('');
        navigate('/dashboard');
      } else {
        toast.error(response.data?.message || 'Failed to confirm deposit');
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm deposit');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#1a1f2e] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Deposit Funds</h1>
        
        {/* Balance Display */}
        <div className="mb-6 p-4 bg-[#2a2f3f] rounded-lg">
          <p className="text-gray-400 text-sm mb-2">Your Balance</p>
          <p className="text-2xl font-bold text-[#00cc88]">KSh {user?.balance?.toLocaleString() || 0}</p>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>≈ UGX {((user?.balance || 0) * 28.5).toLocaleString()}</span>
            <span>≈ MWK {((user?.balance || 0) * 12.8).toLocaleString()}</span>
          </div>
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
            placeholder="e.g., 254712345678"
            className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This is your M-Pesa registered number
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

        {/* Payment Instructions Card */}
        <div className="mb-6 p-4 bg-[#2e7d32]/10 rounded-lg border border-[#2e7d32]/30">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2">📱</span>
            <h3 className="text-white font-bold text-sm">M-Pesa Till Number</h3>
          </div>
          <p className="text-3xl font-bold text-[#2e7d32] mb-3 text-center">9960318</p>
          <div className="text-xs text-gray-300 whitespace-pre-line bg-[#0f1219] p-3 rounded-lg">
            📱 M-Pesa Payment Instructions:
            
            1️⃣ Go to M-Pesa
            2️⃣ Select "Lipa na M-Pesa"
            3️⃣ Select "Till Number"
            4️⃣ Enter Till Number: 9960318
            5️⃣ Enter Amount: KSh {amount || 'AMOUNT'}
            6️⃣ Enter your M-Pesa PIN
            7️⃣ Confirm payment
            
            ✅ You will receive a confirmation SMS
          </div>
          <div className="mt-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded">
            ⚠️ Minimum deposit: KSh {minDeposit.toLocaleString()}
          </div>
        </div>
        
        <button
          onClick={handleInitiateDeposit}
          disabled={loading || !amount || !phoneNumber}
          className="w-full py-3 bg-[#2e7d32] text-white rounded-lg font-bold hover:bg-[#1e5a22] transition-colors disabled:opacity-50 mb-3"
        >
          {loading ? 'Initiating...' : 'Pay with M-Pesa Till'}
        </button>

        {pendingTransaction && (
          <button
            onClick={handleConfirmManually}
            disabled={confirming}
            className="w-full py-2 bg-[#2a2f3f] text-white rounded-lg font-bold hover:bg-[#353b4d] transition-colors disabled:opacity-50 text-sm"
          >
            {confirming ? 'Confirming...' : 'I have sent the money (Confirm)'}
          </button>
        )}

        <p className="text-center text-xs text-gray-500 mt-4">
          Minimum deposit is KSh {minDeposit.toLocaleString()}.<br />
          You will receive a confirmation once payment is verified.
        </p>
      </div>
    </div>
  );
}
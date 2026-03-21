import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deposit } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('KES');
  const [paymentMethod, setPaymentMethod] = useState('till');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState('KSh');
  const [minDeposit, setMinDeposit] = useState(500);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Available currencies with updated minimums
  const currencies = [
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', minDeposit: 500 },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬', minDeposit: 14250 },
    { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', flag: '🇲🇼', minDeposit: 6400 }
  ];

  // Payment instructions by country
  const paymentInstructions = {
    KES: {
      till: {
        title: 'M-Pesa Till Number',
        number: '5243333',
        minDeposit: 500,
        instructions: '1. Go to M-Pesa\n2. Select "Lipa na M-Pesa"\n3. Select "Pay Bill"\n4. Enter Business Number: 5243333\n5. Enter Account Number: Your Phone Number\n6. Enter Amount (Min KSh 500)\n7. Enter PIN and confirm',
        action: 'Pay with M-Pesa'
      },
      card: {
        title: 'Card Payment',
        minDeposit: 500,
        instructions: 'Enter your card details below to complete payment',
        action: 'Pay with Card'
      }
    },
    UGX: {
      mobile: {
        title: 'Airtel Money / MTN Mobile Money',
        number: '+256 700 123 456',
        minDeposit: 14250,
        instructions: '1. Go to Airtel Money or MTN Mobile Money\n2. Select "Send Money"\n3. Enter Number: +256 700 123 456\n4. Enter Amount (Min USh 14,250)\n5. Enter Reference: BETZENITH\n6. Enter PIN and confirm',
        action: 'Send Money'
      }
    },
    MWK: {
      mobile: {
        title: 'Airtel Money / TNM Mpamba',
        number: '+265 888 123 456',
        minDeposit: 6400,
        instructions: '1. Go to Airtel Money or TNM Mpamba\n2. Select "Send Money"\n3. Enter Number: +265 888 123 456\n4. Enter Amount (Min MK 6,400)\n5. Enter Reference: BETZENITH\n6. Enter PIN and confirm',
        action: 'Send Money'
      }
    }
  };

  const predefinedAmounts = {
    KES: [500, 1000, 2500, 5000, 10000, 25000, 50000],
    UGX: [14250, 28500, 50000, 100000, 250000, 500000, 1000000],
    MWK: [6400, 12800, 25000, 50000, 100000, 250000, 500000]
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [selectedCurrency]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/api/payments/methods');
      setPaymentMethods(response.data.data.methods);
      setExchangeRates(response.data.data.exchangeRates);
      setCurrencySymbol(response.data.data.symbol);
      setMinDeposit(response.data.data.minDeposit);
      
      // Set default payment method based on currency
      if (selectedCurrency === 'KES') {
        setPaymentMethod('till');
      } else {
        setPaymentMethod('mobile');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const getCurrentMinDeposit = () => {
    const currency = currencies.find(c => c.code === selectedCurrency);
    return currency?.minDeposit || 500;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentMinDeposit = getCurrentMinDeposit();
    const amountNum = parseFloat(amount);
    
    if (amountNum < currentMinDeposit) {
      toast.error(`Minimum deposit is ${currencySymbol} ${currentMinDeposit.toLocaleString()}`);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/payments/deposit', {
        amount: amountNum,
        paymentMethod,
        currency: selectedCurrency,
        phoneNumber
      });
      
      // Show payment instructions
      const instructions = paymentInstructions[selectedCurrency]?.[paymentMethod];
      if (instructions) {
        toast.success(
          `Send ${currencySymbol} ${amountNum.toLocaleString()} to ${instructions.number}`
        );
        
        // Show detailed instructions
        setTimeout(() => {
          toast.info(
            instructions.instructions,
            { duration: 8000 }
          );
        }, 1000);
      } else {
        toast.success('Deposit initiated!');
      }
      
      // Poll for balance update
      const checkBalance = setInterval(async () => {
        try {
          const balanceResponse = await axios.get('/api/payments/balance');
          const newBalance = balanceResponse.data.data.balances.KES;
          
          if (newBalance > (user?.balance || 0)) {
            clearInterval(checkBalance);
            setUser({ ...user, balance: newBalance });
            toast.success(`Successfully deposited ${currencySymbol} ${amountNum.toLocaleString()}!`);
            navigate('/dashboard');
          }
        } catch (err) {
          console.error('Error checking balance:', err);
        }
      }, 3000);
      
      // Timeout after 5 minutes
      setTimeout(() => clearInterval(checkBalance), 300000);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentInstructions = () => {
    return paymentInstructions[selectedCurrency]?.[paymentMethod] || null;
  };

  const currentInstructions = getCurrentInstructions();
  const currentMinDeposit = getCurrentMinDeposit();

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#1a1f2e] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Deposit Funds</h1>
        
        {/* Balance Display */}
        <div className="mb-6 p-4 bg-[#2a2f3f] rounded-lg">
          <p className="text-gray-400 text-sm">Your Balance</p>
          <div className="space-y-1 mt-2">
            <p className="text-2xl font-bold text-[#00cc88]">
              KSh {user?.balance?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500">
              ≈ UGX {(user?.balance * 28.5).toLocaleString()} | 
              ≈ MWK {(user?.balance * 12.8).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="mb-6">
          <label className="block text-gray-400 mb-2 text-sm">Select Currency</label>
          <div className="flex space-x-2">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                type="button"
                onClick={() => setSelectedCurrency(curr.code)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCurrency === curr.code
                    ? 'bg-[#2e7d32] text-white'
                    : 'bg-[#2a2f3f] text-gray-400 hover:text-white'
                }`}
              >
                <span className="mr-1">{curr.flag}</span>
                {curr.code}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selection */}
        {paymentMethods.length > 0 && (
          <div className="mb-6">
            <label className="block text-gray-400 mb-2 text-sm">Payment Method</label>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    paymentMethod === method.id
                      ? 'bg-[#2e7d32]/20 border border-[#2e7d32]'
                      : 'bg-[#2a2f3f] border border-transparent'
                  }`}
                >
                  <div className="font-medium text-white">{method.name}</div>
                  {method.number && (
                    <div className="text-sm text-[#2e7d32] mt-1">{method.number}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Min: {currencySymbol} {currentMinDeposit.toLocaleString()} | 
                    Max: {method.max?.toLocaleString() || 'Unlimited'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment Instructions */}
        {currentInstructions && (
          <div className="mb-6 p-4 bg-[#2a2f3f] rounded-lg">
            <h3 className="text-white font-bold text-sm mb-2">{currentInstructions.title}</h3>
            <p className="text-2xl font-bold text-[#2e7d32] mb-2">{currentInstructions.number}</p>
            <div className="text-xs text-gray-400 whitespace-pre-line">
              {currentInstructions.instructions}
            </div>
            <div className="mt-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded">
              ⚠️ Minimum deposit: {currencySymbol} {currentMinDeposit.toLocaleString()}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2 text-sm">
              Amount ({currencySymbol})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
              placeholder={`Min ${currencySymbol} ${currentMinDeposit.toLocaleString()}`}
              min={currentMinDeposit}
              required
            />
          </div>
          
          {/* Phone Number for M-Pesa/Mobile */}
          {selectedCurrency === 'KES' && paymentMethod === 'till' && (
            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Phone Number (M-Pesa)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 254712345678"
                className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">You will receive a prompt on your phone</p>
            </div>
          )}
          
          {selectedCurrency !== 'KES' && (
            <div>
              <label className="block text-gray-400 mb-2 text-sm">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={selectedCurrency === 'UGX' ? 'e.g., 256712345678' : 'e.g., 265888123456'}
                className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                required
              />
            </div>
          )}
          
          {/* Quick Amount Select */}
          <div>
            <p className="text-gray-400 mb-2 text-sm">Quick Select</p>
            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts[selectedCurrency].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className="py-2 bg-[#2a2f3f] rounded hover:bg-[#353b4d] text-white text-sm"
                >
                  {currencySymbol} {amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2e7d32] text-white rounded-lg font-bold hover:bg-[#1e5a22] transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : currentInstructions?.action || 'Deposit Now'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          Minimum deposit is {currencySymbol} {currentMinDeposit.toLocaleString()}. 
          Deposits are processed instantly.
        </p>
      </div>
    </div>
  );
}
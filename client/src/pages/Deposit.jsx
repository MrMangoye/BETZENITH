import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('KES');
  const [paymentMethod, setPaymentMethod] = useState('till');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState('KSh');
  const [currencyName, setCurrencyName] = useState('Kenyan Shilling');
  const [currencyFlag, setCurrencyFlag] = useState('🇰🇪');
  const [minDeposit, setMinDeposit] = useState(500);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Available currencies
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
        number: '9960318',
        minDeposit: 500,
        instructions: `📱 M-Pesa Payment Instructions:\n\n1️⃣ Go to M-Pesa on your phone\n2️⃣ Select "Lipa na M-Pesa"\n3️⃣ Select "Pay Bill"\n4️⃣ Enter Business Number: 9960318\n5️⃣ Enter Account Number: ${phoneNumber || 'YOUR_PHONE'}\n6️⃣ Enter Amount: KSh ${amount || 'AMOUNT'}\n7️⃣ Enter your M-Pesa PIN\n8️⃣ Confirm payment\n\n✅ You will receive a confirmation SMS`,
        action: 'Pay with M-Pesa'
      }
    },
    UGX: {
      mobile: {
        title: 'Airtel Money / MTN Mobile Money',
        number: '+256 776 785216',
        minDeposit: 14250,
        instructions: `📱 Mobile Money Payment Instructions:\n\n1️⃣ Go to Airtel Money or MTN Mobile Money\n2️⃣ Select "Send Money"\n3️⃣ Enter Number: +256 776 785216\n4️⃣ Enter Amount: USh ${amount || 'AMOUNT'}\n5️⃣ Enter Reference: BETZENITH\n6️⃣ Enter your PIN\n7️⃣ Confirm payment\n\n✅ You will receive a confirmation SMS`,
        action: 'Send Money'
      }
    },
    MWK: {
      mobile: {
        title: 'Airtel Money / TNM Mpamba',
        number: '+256 776 785216',
        minDeposit: 6400,
        instructions: `📱 Mobile Money Payment Instructions:\n\n1️⃣ Go to Airtel Money or TNM Mpamba\n2️⃣ Select "Send Money"\n3️⃣ Enter Number: +256 776 785216\n4️⃣ Enter Amount: MK ${amount || 'AMOUNT'}\n5️⃣ Enter Reference: BETZENITH\n6️⃣ Enter your PIN\n7️⃣ Confirm payment\n\n✅ You will receive a confirmation SMS`,
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
    fetchBalance();
  }, [selectedCurrency]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/api/payments/methods');
      setPaymentMethods(response.data.data.methods);
      setExchangeRates(response.data.data.exchangeRates);
      setCurrencySymbol(response.data.data.symbol);
      setCurrencyName(response.data.data.name);
      setCurrencyFlag(response.data.data.flag);
      setMinDeposit(response.data.data.minDeposit);
      
      if (selectedCurrency === 'KES') {
        setPaymentMethod('till');
      } else {
        setPaymentMethod('mobile');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await axios.get('/api/payments/balance');
      const { balances, symbols, flags } = response.data.data;
      // Update user balance in context
      setUser({ ...user, balance: balances.KES });
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleInitiateDeposit = async (e) => {
    e.preventDefault();
    
    const currentCurrency = currencies.find(c => c.code === selectedCurrency);
    const currentMinDeposit = currentCurrency?.minDeposit;
    const amountNum = parseFloat(amount);
    
    if (amountNum < currentMinDeposit) {
      toast.error(`Minimum deposit is ${currencySymbol} ${currentMinDeposit.toLocaleString()}`);
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
        paymentMethod,
        currency: selectedCurrency,
        phoneNumber
      });
      
      setPendingTransaction(response.data.data);
      
      // Show payment instructions
      const instructions = paymentInstructions[selectedCurrency]?.[paymentMethod];
      if (instructions) {
        // Create a modal or detailed alert
        toast.success(
          `Please send ${currencySymbol} ${amountNum.toLocaleString()} to ${instructions.number}`,
          { duration: 5000 }
        );
        
        // Show detailed instructions
        const detailedInstructions = instructions.instructions
          .replace('YOUR_PHONE', phoneNumber)
          .replace('AMOUNT', amountNum.toLocaleString());
        
        toast.info(detailedInstructions, { duration: 10000 });
      }
      
      // Start polling for confirmation
      startPollingForConfirmation(response.data.data.reference);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  const startPollingForConfirmation = (reference) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (every 5 seconds)
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await axios.get(`/api/payments/check-deposit/${reference}`);
        
        if (response.data.data.status === 'COMPLETED') {
          clearInterval(interval);
          toast.success('Deposit confirmed! Your balance has been updated.');
          fetchBalance();
          setPendingTransaction(null);
          setAmount('');
          setPhoneNumber('');
          navigate('/dashboard');
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          toast.info('Still waiting for confirmation. You can check your balance later.');
        }
      } catch (error) {
        console.error('Error checking deposit status:', error);
      }
    }, 5000);
  };

  const handleConfirmManually = async () => {
    if (!pendingTransaction) return;
    
    setConfirming(true);
    try {
      const response = await axios.post('/api/payments/confirm-deposit', {
        reference: pendingTransaction.reference,
        transactionId: prompt('Enter the transaction ID from your SMS:'),
        phoneNumber
      });
      
      toast.success('Deposit confirmed!');
      fetchBalance();
      setPendingTransaction(null);
      setAmount('');
      setPhoneNumber('');
      navigate('/dashboard');
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm deposit');
    } finally {
      setConfirming(false);
    }
  };

  const getCurrentInstructions = () => {
    const instructions = paymentInstructions[selectedCurrency]?.[paymentMethod];
    if (instructions && phoneNumber && amount) {
      return {
        ...instructions,
        instructions: instructions.instructions
          .replace('YOUR_PHONE', phoneNumber)
          .replace('AMOUNT', parseFloat(amount).toLocaleString())
      };
    }
    return instructions;
  };

  const currentInstructions = getCurrentInstructions();
  const currentMinDeposit = currencies.find(c => c.code === selectedCurrency)?.minDeposit || 500;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#1a1f2e] rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Deposit Funds</h1>
        
        {/* Balance Display - Shows all currencies */}
        <div className="mb-6 p-4 bg-[#2a2f3f] rounded-lg">
          <p className="text-gray-400 text-sm mb-2">Your Balance</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🇰🇪 Kenyan Shilling (KES):</span>
              <span className="text-2xl font-bold text-[#00cc88]">KSh {user?.balance?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🇺🇬 Ugandan Shilling (UGX):</span>
              <span className="text-lg font-bold text-white">USh {((user?.balance || 0) * 28.5).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🇲🇼 Malawian Kwacha (MWK):</span>
              <span className="text-lg font-bold text-white">MK {((user?.balance || 0) * 12.8).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="mb-6">
          <label className="block text-gray-400 mb-2 text-sm">Select Currency</label>
          <div className="grid grid-cols-3 gap-2">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                type="button"
                onClick={() => setSelectedCurrency(curr.code)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
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

        {/* Phone Number Input */}
        <div className="mb-4">
          <label className="block text-gray-400 mb-2 text-sm">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={selectedCurrency === 'KES' ? 'e.g., 254712345678' : 'e.g., 256776785216'}
            className="w-full px-4 py-2 bg-[#2a2f3f] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {selectedCurrency === 'KES' 
              ? 'This is your M-Pesa registered number' 
              : 'This is your mobile money registered number'}
          </p>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
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
        
        {/* Quick Amount Select */}
        <div className="mb-6">
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

        {/* Payment Instructions Card */}
        {currentInstructions && amount && phoneNumber && (
          <div className="mb-6 p-4 bg-[#2e7d32]/10 rounded-lg border border-[#2e7d32]/30">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">📱</span>
              <h3 className="text-white font-bold text-sm">{currentInstructions.title}</h3>
            </div>
            <p className="text-2xl font-bold text-[#2e7d32] mb-3 text-center">
              {currentInstructions.number}
            </p>
            <div className="text-xs text-gray-300 whitespace-pre-line bg-[#0f1219] p-3 rounded-lg">
              {currentInstructions.instructions}
            </div>
          </div>
        )}
        
        <button
          onClick={handleInitiateDeposit}
          disabled={loading || !amount || !phoneNumber}
          className="w-full py-3 bg-[#2e7d32] text-white rounded-lg font-bold hover:bg-[#1e5a22] transition-colors disabled:opacity-50 mb-3"
        >
          {loading ? 'Initiating...' : (currentInstructions?.action || 'Deposit Now')}
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
          Minimum deposit is {currencySymbol} {currentMinDeposit.toLocaleString()}.<br />
          You will receive a confirmation once payment is verified.
        </p>
      </div>
    </div>
  );
}
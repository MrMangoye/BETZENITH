// src/context/CurrencyContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'KES';
  });
  
  const [exchangeRates, setExchangeRates] = useState({
    KES: 1,
    UGX: 28.5, // 1 KES = 28.5 UGX (example rate)
    MWK: 12.8  // 1 KES = 12.8 MWK (example rate)
  });

  const currencies = {
    KES: {
      symbol: 'KSh',
      name: 'Kenyan Shilling',
      paymentMethod: 'till',
      tillNumber: '5243333',
      minStake: 500,
      flag: '🇰🇪'
    },
    UGX: {
      symbol: 'USh',
      name: 'Ugandan Shilling',
      paymentMethod: 'mobile',
      phonePrefix: '+256',
      minStake: 14000, // 500 KES equivalent
      flag: '🇺🇬'
    },
    MWK: {
      symbol: 'MK',
      name: 'Malawian Kwacha',
      paymentMethod: 'mobile',
      phonePrefix: '+265',
      minStake: 6400, // 500 KES equivalent
      flag: '🇲🇼'
    }
  };

  const convertAmount = (amountInKES) => {
    return {
      KES: amountInKES,
      UGX: Math.round(amountInKES * exchangeRates.UGX),
      MWK: Math.round(amountInKES * exchangeRates.MWK)
    };
  };

  const formatAmount = (amount, targetCurrency = currency) => {
    const converted = convertAmount(amount);
    const value = converted[targetCurrency];
    const currencyInfo = currencies[targetCurrency];
    
    if (targetCurrency === 'KES') {
      return `${currencyInfo.symbol} ${value.toLocaleString()}`;
    }
    return `${currencyInfo.symbol} ${value.toLocaleString()}`;
  };

  const getMinStake = () => {
    return currencies[currency].minStake;
  };

  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      currencies,
      convertAmount,
      formatAmount,
      getMinStake,
      exchangeRates
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
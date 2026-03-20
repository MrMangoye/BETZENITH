import { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const BetSlipContext = createContext();

export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  if (!context) throw new Error('useBetSlip must be used within BetSlipProvider');
  return context;
};

export const BetSlipProvider = ({ children }) => {
  const [selections, setSelections] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [totalStake, setTotalStake] = useState(0);
  const [potentialWin, setPotentialWin] = useState(0);
  const [betHistory, setBetHistory] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('betSlip');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelections(parsed);
      } catch (e) {
        console.error('Failed to load bet slip');
      }
    }
    
    const savedHistory = localStorage.getItem('betHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setBetHistory(parsed);
      } catch (e) {
        console.error('Failed to load bet history');
      }
    }
  }, []);

  // Save to localStorage and recalculate
  useEffect(() => {
    localStorage.setItem('betSlip', JSON.stringify(selections));
    
    // Calculate totals
    const stake = selections.reduce((sum, sel) => sum + (sel.stake || 0), 0);
    const odds = selections.reduce((product, sel) => product * (sel.selectedMarket?.odds || 1), 1);
    
    setTotalStake(stake);
    setPotentialWin(stake * odds);
  }, [selections]);

  // Save bet history
  useEffect(() => {
    localStorage.setItem('betHistory', JSON.stringify(betHistory));
  }, [betHistory]);

  const addToBetSlip = (selection) => {
    setSelections(prev => {
      // Check if already exists
      const exists = prev.find(s =>
        s._id === selection._id &&
        s.selectedMarket?.index === selection.selectedMarket?.index
      );
      
      if (exists) {
        toast.error('Selection already in bet slip');
        return prev;
      }

      // Check if match is finished
      if (selection.status === 'FINISHED') {
        toast.error('Cannot bet on finished matches');
        return prev;
      }

      // Check max selections (typically 20)
      if (prev.length >= 20) {
        toast.error('Maximum 20 selections allowed');
        return prev;
      }

      // Check if match is live and has started
      if (selection.status === 'LIVE' || selection.status === 'FIRST_HALF' || selection.status === 'SECOND_HALF') {
        // Can still bet on live matches, but show warning
        toast.success('Added to bet slip (Live betting)');
      } else {
        toast.success('Added to bet slip');
      }
      
      setIsOpen(true);
      return [...prev, {
        ...selection,
        stake: 0,
        addedAt: new Date().toISOString()
      }];
    });
  };

  const removeFromBetSlip = (matchId, marketIndex) => {
    setSelections(prev => {
      const filtered = prev.filter(s =>
        !(s._id === matchId && s.selectedMarket?.index === marketIndex)
      );
      toast.success('Removed from bet slip');
      return filtered;
    });
  };

  const updateStake = (matchId, marketIndex, stake) => {
    const numericStake = parseFloat(stake) || 0;
    
    setSelections(prev =>
      prev.map(s => {
        if (s._id === matchId && s.selectedMarket?.index === marketIndex) {
          return { ...s, stake: numericStake };
        }
        return s;
      })
    );
  };

  const updateOdds = (matchId, marketIndex, newOdds) => {
    setSelections(prev =>
      prev.map(s => {
        if (s._id === matchId && s.selectedMarket?.index === marketIndex) {
          return {
            ...s,
            selectedMarket: { ...s.selectedMarket, odds: newOdds }
          };
        }
        return s;
      })
    );
  };

  const clearBetSlip = () => {
    setSelections([]);
    toast.success('Bet slip cleared');
  };

  const getTotalOdds = () => {
    return selections.reduce((product, sel) =>
      product * (sel.selectedMarket?.odds || 1), 1
    );
  };

  const addToBetHistory = (bet) => {
    setBetHistory(prev => [bet, ...prev].slice(0, 50)); // Keep last 50 bets
  };

  const clearBetHistory = () => {
    setBetHistory([]);
    localStorage.removeItem('betHistory');
  };

  return (
    <BetSlipContext.Provider value={{
      selections,
      isOpen,
      setIsOpen,
      totalStake,
      potentialWin,
      betHistory,
      addToBetSlip,
      removeFromBetSlip,
      updateStake,
      updateOdds,
      clearBetSlip,
      getTotalOdds,
      addToBetHistory,
      clearBetHistory,
      selectionCount: selections.length
    }}>
      {children}
    </BetSlipContext.Provider>
  );
};
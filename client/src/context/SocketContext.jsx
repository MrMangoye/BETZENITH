import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const [matchUpdates, setMatchUpdates] = useState({});

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to real-time server');
      setConnected(true);
      
      // Get live matches list
      newSocket.emit('get-live-matches');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from real-time server');
      setConnected(false);
    });

    newSocket.on('match-updated', (data) => {
      setMatchUpdates(prev => ({
        ...prev,
        [data.matchId]: {
          ...prev[data.matchId],
          ...data,
          timestamp: Date.now()
        }
      }));
      
      // Trigger custom event for components
      window.dispatchEvent(new CustomEvent('match-update', { detail: data }));
    });

    newSocket.on('odds-updated', (data) => {
      window.dispatchEvent(new CustomEvent('odds-update', { detail: data }));
    });

    newSocket.on('match-event', (event) => {
      window.dispatchEvent(new CustomEvent('match-event', { detail: event }));
      
      // Show notification for goals
      if (event.type === 'GOAL') {
        const notification = new CustomEvent('show-notification', {
          detail: {
            type: 'goal',
            message: `⚽ GOAL! ${event.player} (${event.homeScore}-${event.awayScore})`,
            duration: 5000
          }
        });
        window.dispatchEvent(notification);
      }
    });

    newSocket.on('live-matches-list', (matches) => {
      setLiveMatches(matches);
    });

    newSocket.on('live-match-update', (update) => {
      setLiveMatches(prev => 
        prev.map(m => 
          m.matchId === update.matchId ? { ...m, ...update } : m
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const subscribeToMatch = (matchId) => {
    if (socket && connected) {
      socket.emit('subscribe-match', matchId);
    }
  };

  const unsubscribeFromMatch = (matchId) => {
    if (socket && connected) {
      socket.emit('unsubscribe-match', matchId);
    }
  };

  const getLiveMatches = () => {
    if (socket && connected) {
      socket.emit('get-live-matches');
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      liveMatches,
      matchUpdates,
      subscribeToMatch,
      unsubscribeFromMatch,
      getLiveMatches
    }}>
      {children}
    </SocketContext.Provider>
  );
};
// src/hooks/useOddsData.js
import { useState, useEffect, useCallback } from 'react';
import * as mockMatches from '../data/mockMatches';

const MAX_LIVE = 15;
const MAX_UPCOMING = 30;
const MAX_FINISHED = 20;

export const useOddsData = (initialSport = 'all') => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [finishedEvents, setFinishedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSport, setSelectedSport] = useState(initialSport);

  const fetchAllEvents = useCallback(() => {
    try {
      const live = mockMatches.getLiveMatches(selectedSport);
      const upcoming = mockMatches.getUpcomingMatches(selectedSport);
      const finished = mockMatches.getFinishedMatches(selectedSport);
      
      setLiveEvents(live.slice(0, MAX_LIVE));
      setUpcomingEvents(upcoming.slice(0, MAX_UPCOMING));
      setFinishedEvents(finished.slice(0, MAX_FINISHED));
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
      setLoading(false);
    }
  }, [selectedSport]);

  const changeSport = (sport) => {
    setSelectedSport(sport);
  };

  const refreshAll = () => {
    fetchAllEvents();
  };

  useEffect(() => {
    fetchAllEvents();
    const interval = setInterval(fetchAllEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchAllEvents]);

  return {
    liveEvents,
    upcomingEvents,
    finishedEvents,
    loading,
    error,
    selectedSport,
    changeSport,
    refreshAll
  };
};
// src/services/oddsApi.js
import axios from 'axios';

// Use your backend API URL instead of the external API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const oddsApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// Request interceptor for logging
oddsApi.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
oddsApi.interceptors.response.use(
  (response) => {
    console.log('✅ API Response successful');
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('❌ API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('📡 No response received:', error.request);
    } else {
      console.error('⚙️ Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Get live events (now calls your backend)
export const getLiveEvents = async (sport = 'football') => {
  try {
    const response = await oddsApi.get('/odds/live', {
      params: { sport }
    });
    return response.data.data || { events: [] };
  } catch (error) {
    console.error('Error fetching live events:', error);
    return { events: [] };
  }
};

// Get upcoming events by date (now calls your backend)
export const getUpcomingEvents = async (sport = 'football', date = 'today') => {
  try {
    const response = await oddsApi.get('/odds/upcoming', {
      params: { sport, date }
    });
    return response.data.data || { events: [] };
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return { events: [] };
  }
};

// Get event odds (now calls your backend)
export const getEventOdds = async (eventId) => {
  try {
    const response = await oddsApi.get(`/odds/event/${eventId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching event odds:', error);
    return null;
  }
};

// Get live scores (now calls your backend)
export const getLiveScores = async (sport = 'football') => {
  try {
    const response = await oddsApi.get('/odds/scores/live', {
      params: { sport }
    });
    return response.data.data || { scores: [] };
  } catch (error) {
    console.error('Error fetching live scores:', error);
    return { scores: [] };
  }
};

// Get all available sports (now calls your backend)
export const getSports = async () => {
  try {
    const response = await oddsApi.get('/odds/sports');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching sports:', error);
    return [];
  }
};

// Get event details with scores (now calls your backend)
export const getEventDetails = async (eventId) => {
  try {
    const response = await oddsApi.get(`/odds/event/${eventId}/details`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching event details:', error);
    return null;
  }
};

// Search events (now calls your backend)
export const searchEvents = async (query) => {
  try {
    const response = await oddsApi.get('/odds/search', {
      params: { q: query }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error searching events:', error);
    return [];
  }
};

export default oddsApi;
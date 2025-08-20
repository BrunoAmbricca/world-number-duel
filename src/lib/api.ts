const API_BASE = '/api';

export const api = {
  // Matchmaking
  joinQueue: async (playerId: string) => {
    const response = await fetch(`${API_BASE}/matchmaking/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });
    return response.json();
  },

  leaveQueue: async (playerId: string) => {
    const response = await fetch(`${API_BASE}/matchmaking/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });
    return response.json();
  },

  // Matches
  getMatch: async (matchId: string) => {
    const response = await fetch(`${API_BASE}/matches/${matchId}`);
    return response.json();
  },

  submitAnswer: async (matchId: string, playerId: string, answer: number) => {
    const response = await fetch(`${API_BASE}/matches/${matchId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, answer }),
    });
    return response.json();
  },

  // High Scores
  getHighScore: async (playerId: string) => {
    const response = await fetch(`${API_BASE}/high-score?playerId=${playerId}`);
    return response.json();
  },

  saveHighScore: async (playerId: string, score: number) => {
    const response = await fetch(`${API_BASE}/high-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, score }),
    });
    return response.json();
  },

  // Leaderboards
  getLeaderboard: async (type: 'weekly' | 'daily' | 'singleplayer', limit = 100, offset = 0) => {
    const params = new URLSearchParams({
      type,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const response = await fetch(`${API_BASE}/leaderboards?${params}`);
    return response.json();
  },
};
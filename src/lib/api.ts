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
};
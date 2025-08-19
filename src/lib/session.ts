export interface GameSession {
  playerId: string;
  createdAt: string;
}

const SESSION_KEY = 'game-session';

export const generatePlayerId = (): string => {
  const playerNumber = Math.floor(Math.random() * 1000) + 1;
  return `player${playerNumber}`;
};

export const createSession = (): GameSession => {
  const session: GameSession = {
    playerId: generatePlayerId(),
    createdAt: new Date().toISOString(),
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  
  return session;
};

export const getSession = (): GameSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

export const clearSession = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
};
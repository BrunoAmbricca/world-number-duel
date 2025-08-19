'use client';

import { useState, useEffect } from 'react';
import { GameSession, getSession, createSession, clearSession } from '@/lib/session';

export const useSession = () => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingSession = getSession();
    setSession(existingSession);
    setIsLoading(false);
  }, []);

  const startSession = () => {
    const newSession = createSession();
    setSession(newSession);
    return newSession;
  };

  const endSession = () => {
    clearSession();
    setSession(null);
  };

  return {
    session,
    isLoading,
    startSession,
    endSession,
    hasSession: !!session,
  };
};
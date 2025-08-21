'use client';

import { useState, useEffect } from 'react';
import { useSession } from './useSession';

const COINS_STORAGE_KEY = 'player-coins';
const DEFAULT_STARTING_COINS = 1000;

export const useCoins = () => {
  const { session } = useSession();
  const [coins, setCoins] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load coins from localStorage on mount
  useEffect(() => {
    if (!session) {
      setCoins(0);
      setIsLoading(false);
      return;
    }

    const savedCoins = localStorage.getItem(`${COINS_STORAGE_KEY}-${session.playerId}`);
    if (savedCoins !== null) {
      try {
        const parsedCoins = parseInt(savedCoins, 10);
        setCoins(isNaN(parsedCoins) ? DEFAULT_STARTING_COINS : parsedCoins);
      } catch {
        setCoins(DEFAULT_STARTING_COINS);
      }
    } else {
      // First time player - give starting coins
      setCoins(DEFAULT_STARTING_COINS);
      localStorage.setItem(`${COINS_STORAGE_KEY}-${session.playerId}`, DEFAULT_STARTING_COINS.toString());
    }
    setIsLoading(false);
  }, [session]);

  // Save coins to localStorage whenever coins change
  useEffect(() => {
    if (session && !isLoading) {
      localStorage.setItem(`${COINS_STORAGE_KEY}-${session.playerId}`, coins.toString());
    }
  }, [coins, session, isLoading]);

  const addCoins = (amount: number) => {
    if (amount > 0) {
      setCoins(prev => prev + amount);
    }
  };

  const spendCoins = (amount: number): boolean => {
    if (amount <= coins && amount > 0) {
      setCoins(prev => prev - amount);
      return true;
    }
    return false;
  };

  const setCoinsAmount = (amount: number) => {
    if (amount >= 0) {
      setCoins(amount);
    }
  };

  const hasEnoughCoins = (amount: number): boolean => {
    return coins >= amount;
  };

  return {
    coins,
    isLoading,
    addCoins,
    spendCoins,
    setCoinsAmount,
    hasEnoughCoins,
  };
};
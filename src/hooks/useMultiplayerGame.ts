import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getPusherClient } from '@/lib/pusher';
import { MatchState, PusherEvents } from '@/types/multiplayer';

interface MultiplayerGameState extends MatchState {
  isLoading: boolean;
  error?: string;
  selectedNumbers: number[];
  isSubmitting: boolean;
  waitingForOpponent: boolean;
}

export function useMultiplayerGame(matchId: string, playerId: string) {
  const [state, setState] = useState<MultiplayerGameState>({
    match: {} as MultiplayerGameState['match'],
    currentRound: undefined,
    rounds: [],
    isLoading: true,
    selectedNumbers: [],
    isSubmitting: false,
    waitingForOpponent: false,
  });

  const loadMatch = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const result = await api.getMatch(matchId);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, isLoading: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        match: result.match,
        currentRound: result.currentRound,
        rounds: result.rounds,
        isLoading: false,
      }));
    } catch {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load match', 
        isLoading: false 
      }));
    }
  }, [matchId]);

  const toggleNumber = useCallback((number: number) => {
    setState(prev => ({
      ...prev,
      selectedNumbers: prev.selectedNumbers.includes(number)
        ? prev.selectedNumbers.filter(n => n !== number)
        : [...prev.selectedNumbers, number],
    }));
  }, []);

  const submitAnswer = useCallback(async () => {
    if (state.selectedNumbers.length === 0 || state.isSubmitting) return;

    setState(prev => ({ ...prev, isSubmitting: true, error: undefined }));

    try {
      const result = await api.submitAnswer(matchId, playerId, state.selectedNumbers);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, isSubmitting: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        selectedNumbers: [],
        waitingForOpponent: !result.roundCompleted,
      }));

      if (result.roundCompleted) {
        // Reload match data to get updated state
        await loadMatch();
      }
    } catch {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to submit answer', 
        isSubmitting: false 
      }));
    }
  }, [matchId, playerId, state.selectedNumbers, state.isSubmitting, loadMatch]);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedNumbers: [] }));
  }, []);

  // Real-time updates
  useEffect(() => {
    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    const channel = pusherClient.subscribe(`match-${matchId}`);

    channel.bind('round-completed', (data: PusherEvents['round-completed']) => {
      setState(prev => ({
        ...prev,
        match: data.match,
        currentRound: data.nextRoundNeeded ? undefined : data.round,
        waitingForOpponent: false,
      }));

      if (data.nextRoundNeeded) {
        // Reload to get new round
        loadMatch();
      }
    });

    channel.bind('answer-submitted', (data: PusherEvents['answer-submitted']) => {
      if (data.playerId !== playerId) {
        setState(prev => ({ ...prev, waitingForOpponent: false }));
      }
    });

    return () => {
      pusherClient.unsubscribe(`match-${matchId}`);
    };
  }, [matchId, playerId, loadMatch]);

  // Load match on mount
  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  const isMyTurn = state.match.current_turn === playerId;
  const isGameActive = state.match.status === 'active';
  const canSubmit = isMyTurn && isGameActive && state.selectedNumbers.length > 0 && !state.isSubmitting && !state.waitingForOpponent;

  return {
    ...state,
    toggleNumber,
    submitAnswer,
    clearSelection,
    loadMatch,
    isMyTurn,
    isGameActive,
    canSubmit,
  };
}
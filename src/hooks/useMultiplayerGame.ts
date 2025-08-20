import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getPusherClient } from '@/lib/pusher';
import { MatchState, PusherEvents } from '@/types/multiplayer';

interface MultiplayerGameState extends MatchState {
  isLoading: boolean;
  error?: string;
  isSubmitting: boolean;
  waitingForOpponent: boolean;
}

export function useMultiplayerGame(matchId: string, playerId: string) {
  const [state, setState] = useState<MultiplayerGameState>({
    match: null as any,
    currentRound: undefined,
    rounds: [],
    isLoading: true,
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

  const submitAnswer = useCallback(async (answer: number) => {
    if (state.isSubmitting) return;

    setState(prev => ({ ...prev, isSubmitting: true, error: undefined }));

    try {
      const result = await api.submitAnswer(matchId, playerId, answer);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, isSubmitting: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        isSubmitting: false,
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
  }, [matchId, playerId, state.isSubmitting, loadMatch]);

  // Real-time updates
  useEffect(() => {
    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    const channel = pusherClient.subscribe(`match-${matchId}`);

    channel.bind('round-completed', (data: PusherEvents['round-completed']) => {
      console.log('🔔 Round completed event received:', data);
      console.log('📊 Current state before update:', {
        match: state.match,
        currentRound: state.currentRound,
        waitingForOpponent: state.waitingForOpponent
      });
      
      setState(prev => {
        console.log('🔄 Updating state with round completed data...');
        const newState = {
          ...prev,
          match: data.match,
          waitingForOpponent: false,
        };
        console.log('📊 New state after update:', newState);
        return newState;
      });

      if (data.nextRoundNeeded) {
        console.log('🔄 Next round needed, reloading match data...');
        // Small delay to ensure new round is created in database
        setTimeout(() => {
          console.log('🔄 Calling loadMatch to get new round...');
          loadMatch();
        }, 500);
      } else {
        console.log('🏁 Match completed, final state should show winner');
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

  const isGameActive = state.match?.status === 'active';

  return {
    ...state,
    submitAnswer,
    loadMatch,
    isGameActive,
  };
}
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getPusherClient } from '@/lib/pusher';

interface MatchmakingState {
  isInQueue: boolean;
  isSearching: boolean;
  matchFound: boolean;
  matchId?: string;
  opponentId?: string;
  error?: string;
}

export function useMatchmaking(playerId?: string) {
  const [state, setState] = useState<MatchmakingState>({
    isInQueue: false,
    isSearching: false,
    matchFound: false,
  });

  const joinQueue = useCallback(async () => {
    if (!playerId) return;

    setState(prev => ({ ...prev, isSearching: true, error: undefined }));

    try {
      const result = await api.joinQueue(playerId);
      
      if (result.error) {
        setState(prev => ({ ...prev, error: result.error, isSearching: false }));
        return;
      }

      if (result.matched) {
        setState(prev => ({
          ...prev,
          isSearching: false,
          isInQueue: false,
          matchFound: true,
          matchId: result.matchId,
          opponentId: result.opponentId,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSearching: false,
          isInQueue: true,
        }));
      }
    } catch {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to join queue', 
        isSearching: false 
      }));
    }
  }, [playerId]);

  const leaveQueue = useCallback(async () => {
    if (!playerId) return;

    try {
      await api.leaveQueue(playerId);
      setState(prev => ({
        ...prev,
        isInQueue: false,
        isSearching: false,
        error: undefined,
      }));
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to leave queue' }));
    }
  }, [playerId]);

  const resetMatchmaking = useCallback(() => {
    setState({
      isInQueue: false,
      isSearching: false,
      matchFound: false,
    });
  }, []);

  // Listen for match found events
  useEffect(() => {
    if (!playerId || !state.isInQueue) return;

    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    const channel = pusherClient.subscribe(`player-${playerId}`);
    
    channel.bind('match-found', (data: { matchId: string; opponentId: string }) => {
      setState(prev => ({
        ...prev,
        isInQueue: false,
        matchFound: true,
        matchId: data.matchId,
        opponentId: data.opponentId,
      }));
    });

    return () => {
      pusherClient.unsubscribe(`player-${playerId}`);
    };
  }, [playerId, state.isInQueue]);

  return {
    ...state,
    joinQueue,
    leaveQueue,
    resetMatchmaking,
  };
}
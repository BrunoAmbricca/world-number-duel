import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getPusherClient } from '@/lib/pusher';
import { createClient } from '@/lib/supabase';

interface MatchmakingState {
  isInQueue: boolean;
  isSearching: boolean;
  matchFound: boolean;
  matchId?: string;
  opponentId?: string;
  error?: string;
  pollCount?: number;
}

export function useMatchmaking(playerId?: string) {
  const [state, setState] = useState<MatchmakingState>({
    isInQueue: false,
    isSearching: false,
    matchFound: false,
    pollCount: 0,
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
        // Second player gets immediate match response
        console.log('🎯 Immediate match found for second player');
        setState(prev => ({
          ...prev,
          isSearching: false,
          isInQueue: false,
          matchFound: true,
          matchId: result.matchId,
          opponentId: result.opponentId,
        }));
      } else {
        // First player enters queue and waits for Pusher notification
        console.log('⏳ First player entered queue, waiting for match...');
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

    console.log(`🔔 Setting up Pusher listener for player: ${playerId}`);

    const pusherClient = getPusherClient();
    if (!pusherClient) {
      console.warn('❌ Pusher client not available');
      return;
    }

    const channelName = `player-${playerId}`;
    console.log(`📡 Subscribing to channel: ${channelName}`);
    const channel = pusherClient.subscribe(channelName);
    
    channel.bind('match-found', (data: { matchId: string; opponentId: string }) => {
      console.log(`🎯 Match found event received!`, data);
      setState(prev => ({
        ...prev,
        isInQueue: false,
        matchFound: true,
        matchId: data.matchId,
        opponentId: data.opponentId,
      }));
    });

    // Also listen for connection state
    pusherClient.connection.bind('connected', () => {
      console.log('✅ Pusher connected');
    });

    pusherClient.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected');
    });

    return () => {
      console.log(`📡 Unsubscribing from channel: ${channelName}`);
      pusherClient.unsubscribe(channelName);
    };
  }, [playerId, state.isInQueue]);

  // Polling fallback - check for matches every few seconds if Pusher fails
  useEffect(() => {
    if (!playerId || !state.isInQueue || state.matchFound) return;

    console.log(`🔄 Starting polling fallback for ${playerId} (attempt ${state.pollCount})`);

    const pollInterval = setInterval(async () => {
      try {
        setState(prev => ({ ...prev, pollCount: (prev.pollCount || 0) + 1 }));
        
        // Check if player is still in queue (if not, they've been matched)
        const supabase = createClient();
        const { data } = await supabase.from('matchmaking_queue')
          .select('*')
          .eq('player_id', playerId)
          .single();

        if (!data) {
          console.log('🎯 Polling detected: Player no longer in queue, checking for match...');
          
          // Player not in queue anymore, check for active matches
          const { data: matches } = await supabase
            .from('matches')
            .select('*')
            .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);

          if (matches && matches.length > 0) {
            const match = matches[0];
            const opponentId = match.player1_id === playerId ? match.player2_id : match.player1_id;
            
            console.log('🎯 Polling fallback found match:', match.id);
            setState(prev => ({
              ...prev,
              isInQueue: false,
              matchFound: true,
              matchId: match.id,
              opponentId: opponentId,
            }));
          }
        }
      } catch (error) {
        console.warn('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 30 seconds
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      console.log('⏰ Polling timeout reached');
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [playerId, state.isInQueue, state.matchFound, state.pollCount]);

  return {
    ...state,
    joinQueue,
    leaveQueue,
    resetMatchmaking,
  };
}
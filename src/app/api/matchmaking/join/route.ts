import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { pusherServer } from '@/lib/pusher';
import { generateRandomSequence, calculateSum } from '@/utils/gameHelpers';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Matchmaking join request received');
    const supabase = createClient();
    const { playerId } = await request.json();
    console.log('👤 Player ID:', playerId);

    if (!playerId) {
      console.log('❌ Missing player ID');
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }

    // Check if player is already in queue
    const { data: existingEntry } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('player_id', playerId)
      .single();

    if (existingEntry) {
      return NextResponse.json({ message: 'Already in queue', queueId: existingEntry.id });
    }

    // Add player to queue
    const { data: queueEntry, error: queueError } = await supabase
      .from('matchmaking_queue')
      .insert({ player_id: playerId })
      .select()
      .single();

    if (queueError) {
      return NextResponse.json({ error: queueError.message }, { status: 500 });
    }

    // Try to find a match
    const { data: waitingPlayers } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .neq('player_id', playerId)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (waitingPlayers && waitingPlayers.length > 0) {
      const opponent = waitingPlayers[0];
      
      // Create match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          player1_id: opponent.player_id,
          player2_id: playerId,
          status: 'active',
          current_turn: opponent.player_id // First player goes first
        })
        .select()
        .single();

      if (matchError) {
        return NextResponse.json({ error: matchError.message }, { status: 500 });
      }

      // Remove both players from queue
      await supabase
        .from('matchmaking_queue')
        .delete()
        .in('player_id', [playerId, opponent.player_id]);

      // Generate first round using the same logic as single-player
      const sequence = generateRandomSequence(5); // Same as single-player: 5 numbers
      const correctSum = calculateSum(sequence);   // Calculate the actual sum

      const { error: roundError } = await supabase
        .from('match_rounds')
        .insert({
          match_id: match.id,
          round_number: 1,
          sequence,
          correct_sum: correctSum
        });

      if (roundError) {
        return NextResponse.json({ error: roundError.message }, { status: 500 });
      }

      // Notify the first player via Pusher
      try {
        await pusherServer.trigger(`player-${opponent.player_id}`, 'match-found', {
          matchId: match.id,
          opponentId: playerId
        });
        console.log(`📡 Notified player ${opponent.player_id} about match ${match.id}`);
      } catch (pusherError) {
        console.warn('Failed to send Pusher notification to first player:', pusherError);
      }

      return NextResponse.json({
        matched: true,
        matchId: match.id,
        opponentId: opponent.player_id
      });
    }

    return NextResponse.json({
      matched: false,
      queueId: queueEntry.id,
      message: 'Waiting for opponent'
    });

  } catch (error) {
    console.error('❌ Matchmaking join error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}


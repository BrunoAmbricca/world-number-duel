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

    // The atomic_matchmaking function now handles all checks internally
    // This eliminates the need for separate checks and prevents race conditions

    // Use a database transaction to ensure atomic matchmaking
    const { data: matchResult, error: transactionError } = await supabase.rpc('atomic_matchmaking', {
      new_player_id: playerId
    });

    if (transactionError) {
      console.error('❌ Transaction error:', transactionError);
      return NextResponse.json({ error: transactionError.message }, { status: 500 });
    }

    if (!matchResult || matchResult.length === 0) {
      return NextResponse.json({ error: 'Unexpected database response' }, { status: 500 });
    }

    const result = matchResult[0];

    if (result.matched) {
      if (result.already_active) {
        // Player already has an active match
        console.log(`🔄 Player ${playerId} already has active match ${result.match_id}`);
        return NextResponse.json({
          matched: true,
          matchId: result.match_id,
          opponentId: result.opponent_id,
          message: 'Already in active match'
        });
      } else {
        // New match was created, generate first round
        console.log(`🎯 New match created: ${result.match_id} (${result.opponent_id} vs ${playerId})`);
        
        // Get match details to access difficulty settings
        const { data: match } = await supabase
          .from('matches')
          .select('*')
          .eq('id', result.match_id)
          .single();
          
        const sequenceLength = match?.sequence_length || 5;
        const sequence = generateRandomSequence(sequenceLength);
        const correctSum = calculateSum(sequence);

        const { error: roundError } = await supabase
          .from('match_rounds')
          .insert({
            match_id: result.match_id,
            round_number: 1,
            sequence,
            correct_sum: correctSum
          });

        if (roundError) {
          console.error('❌ Failed to create round:', roundError);
          // Clean up the match if round creation fails
          await supabase
            .from('matches')
            .update({ status: 'abandoned' })
            .eq('id', result.match_id);
          
          return NextResponse.json({ error: roundError.message }, { status: 500 });
        }

        // Notify the first player via Pusher (only for new matches, not existing ones)
        try {
          await pusherServer.trigger(`player-${result.opponent_id}`, 'match-found', {
            matchId: result.match_id,
            opponentId: playerId
          });
          console.log(`📡 Notified player ${result.opponent_id} about match ${result.match_id}`);
        } catch (pusherError) {
          console.warn('Failed to send Pusher notification to first player:', pusherError);
        }

        return NextResponse.json({
          matched: true,
          matchId: result.match_id,
          opponentId: result.opponent_id
        });
      }
    } else {
      // Player was added to queue
      console.log(`⏳ Player ${playerId} added to queue (${result.queue_id})`);
      return NextResponse.json({
        matched: false,
        queueId: result.queue_id,
        message: 'Waiting for opponent'
      });
    }

  } catch (error) {
    console.error('❌ Matchmaking join error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}


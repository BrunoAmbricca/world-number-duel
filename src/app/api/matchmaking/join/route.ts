import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

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

      // Generate first round
      const sequence = generateSequence();
      const targetSum = calculateTargetSum(sequence);

      const { error: roundError } = await supabase
        .from('match_rounds')
        .insert({
          match_id: match.id,
          round_number: 1,
          sequence,
          target_sum: targetSum
        });

      if (roundError) {
        return NextResponse.json({ error: roundError.message }, { status: 500 });
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
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

function generateSequence(): number[] {
  const length = Math.floor(Math.random() * 3) + 8; // 8-10 numbers
  return Array.from({ length }, () => Math.floor(Math.random() * 20) + 1);
}

function calculateTargetSum(sequence: number[]): number {
  // Find a valid subset sum (ensure it's solvable)
  const subsetSize = Math.floor(Math.random() * 3) + 3; // 3-5 numbers
  const shuffled = [...sequence].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, subsetSize).reduce((sum, num) => sum + num, 0);
}
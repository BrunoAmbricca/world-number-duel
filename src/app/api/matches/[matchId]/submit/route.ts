import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { pusherServer } from '@/lib/pusher';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = createClient();
    const { matchId } = await params;
    const { playerId, selectedNumbers } = await request.json();

    if (!playerId || !selectedNumbers) {
      return NextResponse.json({ error: 'Player ID and selected numbers required' }, { status: 400 });
    }

    // Get match and current round
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status !== 'active') {
      return NextResponse.json({ error: 'Match is not active' }, { status: 400 });
    }

    const { data: currentRound, error: roundError } = await supabase
      .from('match_rounds')
      .select('*')
      .eq('match_id', matchId)
      .eq('round_number', match.current_round)
      .single();

    if (roundError || !currentRound) {
      return NextResponse.json({ error: 'Current round not found' }, { status: 404 });
    }

    // Check if answer is correct
    const selectedSum = selectedNumbers.reduce((sum: number, num: number) => sum + num, 0);
    const isCorrect = selectedSum === currentRound.target_sum;

    // Determine which player submitted
    const isPlayer1 = playerId === match.player1_id;
    const updateData = {
      [`player${isPlayer1 ? '1' : '2'}_answer`]: selectedNumbers,
      [`player${isPlayer1 ? '1' : '2'}_correct`]: isCorrect,
      [`player${isPlayer1 ? '1' : '2'}_submitted_at`]: new Date().toISOString()
    } as Record<string, unknown>;

    // Update round with player's answer
    const { data: updatedRound, error: updateError } = await supabase
      .from('match_rounds')
      .update(updateData)
      .eq('id', currentRound.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Check if both players have submitted
    const bothSubmitted = updatedRound.player1_answer && updatedRound.player2_answer;

    if (bothSubmitted) {
      // Determine round outcome
      const player1Correct = updatedRound.player1_correct;
      const player2Correct = updatedRound.player2_correct;

      let matchUpdate: Record<string, unknown> = {};
      let nextRoundNeeded = false;

      if (player1Correct && !player2Correct) {
        // Player 1 wins
        matchUpdate = {
          status: 'completed',
          winner_id: match.player1_id
        };
      } else if (!player1Correct && player2Correct) {
        // Player 2 wins
        matchUpdate = {
          status: 'completed',
          winner_id: match.player2_id
        };
      } else {
        // Both correct or both incorrect - continue to next round
        nextRoundNeeded = true;
        matchUpdate = {
          current_round: match.current_round + 1,
          current_turn: match.current_turn === match.player1_id ? match.player2_id : match.player1_id
        };
      }

      // Mark round as completed
      await supabase
        .from('match_rounds')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', currentRound.id);

      // Update match
      const { data: updatedMatch } = await supabase
        .from('matches')
        .update(matchUpdate)
        .eq('id', matchId)
        .select()
        .single();

      // Create next round if needed
      if (nextRoundNeeded) {
        const sequence = generateSequence();
        const targetSum = calculateTargetSum(sequence);

        await supabase
          .from('match_rounds')
          .insert({
            match_id: matchId,
            round_number: match.current_round + 1,
            sequence,
            target_sum: targetSum
          });
      }

      // Notify via Pusher
      try {
        await pusherServer.trigger(`match-${matchId}`, 'round-completed', {
          round: updatedRound,
          match: updatedMatch,
          nextRoundNeeded
        });
      } catch (pusherError) {
        console.warn('Failed to send Pusher notification:', pusherError);
      }

      return NextResponse.json({
        success: true,
        roundCompleted: true,
        isCorrect,
        match: updatedMatch,
        round: updatedRound
      });
    } else {
      // Switch turns
      const newTurn = match.current_turn === match.player1_id ? match.player2_id : match.player1_id;
      await supabase
        .from('matches')
        .update({ current_turn: newTurn })
        .eq('id', matchId);

      // Notify via Pusher
      try {
        await pusherServer.trigger(`match-${matchId}`, 'answer-submitted', {
          playerId,
          isCorrect,
          waitingForOpponent: true
        });
      } catch (pusherError) {
        console.warn('Failed to send Pusher notification:', pusherError);
      }

      return NextResponse.json({
        success: true,
        roundCompleted: false,
        isCorrect,
        waitingForOpponent: true
      });
    }

  } catch (error) {
    console.error('Submit answer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
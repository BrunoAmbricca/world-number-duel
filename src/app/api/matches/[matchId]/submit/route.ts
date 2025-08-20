import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { pusherServer } from '@/lib/pusher';
import { generateRandomSequence, calculateSum } from '@/utils/gameHelpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = createClient();
    const { matchId } = await params;
    const { playerId, answer } = await request.json();

    if (!playerId || answer === undefined) {
      return NextResponse.json({ error: 'Player ID and answer required' }, { status: 400 });
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

    // Check if answer is correct (same logic as single-player)
    const userSum = parseInt(answer.toString(), 10);
    const isCorrect = userSum === currentRound.correct_sum;

    // Determine which player submitted
    const isPlayer1 = playerId === match.player1_id;
    const updateData = {
      [`player${isPlayer1 ? '1' : '2'}_answer`]: userSum,
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

    // Check if both players have submitted (handle both JSONB and INTEGER types)
    const player1HasAnswered = updatedRound.player1_answer !== null && updatedRound.player1_answer !== undefined;
    const player2HasAnswered = updatedRound.player2_answer !== null && updatedRound.player2_answer !== undefined;
    const bothSubmitted = player1HasAnswered && player2HasAnswered;
    
    console.log('🔍 Round status:', {
      player1_answer: updatedRound.player1_answer,
      player2_answer: updatedRound.player2_answer,
      player1_answer_type: typeof updatedRound.player1_answer,
      player2_answer_type: typeof updatedRound.player2_answer,
      player1HasAnswered,
      player2HasAnswered,
      bothSubmitted,
      player1_correct: updatedRound.player1_correct,
      player2_correct: updatedRound.player2_correct
    });

    if (bothSubmitted) {
      console.log('🎯 Both players submitted, processing round completion...');
      // Determine round outcome
      const player1Correct = updatedRound.player1_correct;
      const player2Correct = updatedRound.player2_correct;

      let matchUpdate: Record<string, unknown> = {};
      let nextRoundNeeded = false;

      if (player1Correct && !player2Correct) {
        // Player 1 wins (one correct, one incorrect)
        console.log('🏆 Player 1 wins!');
        matchUpdate = {
          status: 'completed',
          winner_id: match.player1_id
        };
      } else if (!player1Correct && player2Correct) {
        // Player 2 wins (one correct, one incorrect)
        console.log('🏆 Player 2 wins!');
        matchUpdate = {
          status: 'completed',
          winner_id: match.player2_id
        };
      } else {
        // Both correct OR both incorrect - generate new sequence and continue
        console.log('🔄 Both players same result, continuing to next round...');
        nextRoundNeeded = true;
        matchUpdate = {
          current_round: match.current_round + 1
          // No turn switching - both players answer simultaneously
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
        const sequence = generateRandomSequence(5); // Same as single-player
        const correctSum = calculateSum(sequence);

        await supabase
          .from('match_rounds')
          .insert({
            match_id: matchId,
            round_number: match.current_round + 1,
            sequence,
            correct_sum: correctSum
          });
      }

      // Notify via Pusher
      try {
        const pusherData = {
          round: updatedRound,
          match: updatedMatch,
          nextRoundNeeded
        };
        
        await pusherServer.trigger(`match-${matchId}`, 'round-completed', pusherData);
        console.log('✅ Pusher round-completed notification sent:', pusherData);
      } catch (pusherError) {
        console.warn('❌ Failed to send Pusher notification:', pusherError);
      }

      return NextResponse.json({
        success: true,
        roundCompleted: true,
        isCorrect,
        match: updatedMatch,
        round: updatedRound
      });
    } else {
      // Only one player has submitted, wait for the other
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


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = createClient();
    const { matchId } = await params;

    // Get match details with current round
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get current round
    const { data: currentRound } = await supabase
      .from('match_rounds')
      .select('*')
      .eq('match_id', matchId)
      .eq('round_number', match.current_round)
      .single();

    // Get all rounds for history
    const { data: rounds } = await supabase
      .from('match_rounds')
      .select('*')
      .eq('match_id', matchId)
      .order('round_number', { ascending: true });

    return NextResponse.json({
      match,
      currentRound,
      rounds: rounds || []
    });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
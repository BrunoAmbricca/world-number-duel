import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { matchId, winnerId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
    }

    console.log(`🏁 Finishing match ${matchId} with winner: ${winnerId || 'none'}`);

    // Use the database function to safely finish the match
    const { data, error } = await supabase.rpc('finish_match', {
      match_uuid: matchId,
      winner_player_id: winnerId || null
    });

    if (error) {
      console.error('❌ Error finishing match:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        error: 'Match not found or already finished' 
      }, { status: 404 });
    }

    console.log(`✅ Match ${matchId} finished successfully`);
    return NextResponse.json({ 
      message: 'Match finished successfully',
      matchId,
      winnerId: winnerId || null
    });

  } catch (error) {
    console.error('❌ Finish match error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
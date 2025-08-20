import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }

    // Remove player from matchmaking queue
    const { error } = await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('player_id', playerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Left matchmaking queue' });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
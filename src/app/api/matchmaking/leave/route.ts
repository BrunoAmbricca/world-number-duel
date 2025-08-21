import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }

    // Remove player from matchmaking queue only if they're still waiting
    const { error, count } = await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('player_id', playerId)
      .eq('status', 'waiting');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 0) {
      // Player wasn't in queue (either not there or already matched)
      return NextResponse.json({ 
        message: 'Player not in queue or already matched',
        removed: false 
      });
    }

    return NextResponse.json({ 
      message: 'Left matchmaking queue',
      removed: true 
    });

  } catch (error) {
    console.error('❌ Leave queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
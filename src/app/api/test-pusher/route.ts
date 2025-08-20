import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const { playerId } = await request.json();
    
    if (!playerId) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }

    console.log(`🧪 Testing Pusher notification for player: ${playerId}`);

    // Send test match-found event
    await pusherServer.trigger(`player-${playerId}`, 'match-found', {
      matchId: 'test-match-123',
      opponentId: 'test-opponent'
    });

    console.log(`✅ Test Pusher event sent to player-${playerId}`);

    return NextResponse.json({ 
      success: true, 
      message: `Test event sent to player-${playerId}`,
      channel: `player-${playerId}`
    });

  } catch (error) {
    console.error('❌ Test Pusher error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to send test event', details: errorMessage }, { status: 500 });
  }
}
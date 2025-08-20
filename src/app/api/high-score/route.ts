import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('single_player_scores')
      .select('high_score')
      .eq('player_id', playerId)
      .single();

    if (error && error.code === 'PGRST205') { 
      // Table doesn't exist, return default score
      return NextResponse.json({ highScore: 0 });
    } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching high score:', error);
      return NextResponse.json({ error: 'Failed to fetch high score' }, { status: 500 });
    }

    return NextResponse.json({ 
      highScore: data ? data.high_score : 0 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playerId, score } = await request.json();

    if (!playerId || typeof score !== 'number') {
      return NextResponse.json({ 
        error: 'Player ID and score are required' 
      }, { status: 400 });
    }

    const supabase = createClient();
    
    // Try to update existing record first
    const { data: existingData, error: fetchError } = await supabase
      .from('single_player_scores')
      .select('high_score')
      .eq('player_id', playerId)
      .single();

    if (fetchError && fetchError.code === 'PGRST205') {
      // Table doesn't exist, just return the score as new record
      return NextResponse.json({ 
        highScore: score, 
        isNewRecord: true 
      });
    }

    if (existingData) {
      // Update only if new score is higher
      if (score > existingData.high_score) {
        const { error } = await supabase
          .from('single_player_scores')
          .update({ 
            high_score: score, 
            updated_at: new Date().toISOString() 
          })
          .eq('player_id', playerId);

        if (error) {
          console.error('Error updating high score:', error);
          return NextResponse.json({ error: 'Failed to update high score' }, { status: 500 });
        }

        return NextResponse.json({ 
          highScore: score, 
          isNewRecord: true 
        });
      } else {
        return NextResponse.json({ 
          highScore: existingData.high_score, 
          isNewRecord: false 
        });
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from('single_player_scores')
        .insert({ 
          player_id: playerId, 
          high_score: score 
        });

      if (error) {
        console.error('Error creating high score:', error);
        return NextResponse.json({ error: 'Failed to create high score' }, { status: 500 });
      }

      return NextResponse.json({ 
        highScore: score, 
        isNewRecord: true 
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
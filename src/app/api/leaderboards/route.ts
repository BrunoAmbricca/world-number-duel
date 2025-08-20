import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export type LeaderboardType = 'weekly' | 'daily' | 'singleplayer';

export interface LeaderboardEntry {
  rank: number;
  player_id: string;
  score: number;
  last_updated?: string;
}

export interface LeaderboardResponse {
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  updated_at: string;
  total_entries: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as LeaderboardType;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!type || !['weekly', 'daily', 'singleplayer'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid leaderboard type. Must be one of: weekly, daily, singleplayer' 
      }, { status: 400 });
    }

    if (limit > 1000) {
      return NextResponse.json({ 
        error: 'Limit cannot exceed 1000 entries' 
      }, { status: 400 });
    }

    const supabase = createClient();
    let query;
    let countQuery;

    switch (type) {
      case 'weekly':
        // Try to refresh the materialized view first (ignore errors if permissions don't allow)
        try {
          await supabase.rpc('refresh_leaderboards');
        } catch (error) {
          console.warn('Could not refresh leaderboards:', error);
        }

        query = supabase
          .from('weekly_leaderboard')
          .select('rank, player_id, score')
          .range(offset, offset + limit - 1)
          .order('rank');

        countQuery = supabase
          .from('weekly_leaderboard')
          .select('*', { count: 'exact', head: true });
        break;

      case 'daily':
        // Try to refresh the materialized view first (ignore errors if permissions don't allow)
        try {
          await supabase.rpc('refresh_leaderboards');
        } catch (error) {
          console.warn('Could not refresh leaderboards:', error);
        }

        query = supabase
          .from('daily_leaderboard')
          .select('rank, player_id, score')
          .range(offset, offset + limit - 1)
          .order('rank');

        countQuery = supabase
          .from('daily_leaderboard')
          .select('*', { count: 'exact', head: true });
        break;

      case 'singleplayer':
        query = supabase
          .from('singleplayer_leaderboard')
          .select('rank, player_id, score, last_updated')
          .range(offset, offset + limit - 1)
          .order('rank');

        countQuery = supabase
          .from('singleplayer_leaderboard')
          .select('*', { count: 'exact', head: true });
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid leaderboard type' 
        }, { status: 400 });
    }

    // Execute both queries in parallel
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      query,
      countQuery
    ]);

    // Handle the case where tables/views don't exist (graceful fallback)
    if (error && (error.code === 'PGRST205' || error.message?.includes('does not exist'))) {
      return NextResponse.json({
        type,
        entries: [],
        updated_at: new Date().toISOString(),
        total_entries: 0
      } as LeaderboardResponse);
    }

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch leaderboard data' 
      }, { status: 500 });
    }

    if (countError) {
      console.error('Error counting leaderboard entries:', countError);
    }

    // Format the response
    const entries: LeaderboardEntry[] = (data || []).map(entry => ({
      rank: entry.rank,
      player_id: entry.player_id,
      score: entry.score,
      ...(type === 'singleplayer' && entry.last_updated && {
        last_updated: entry.last_updated
      })
    }));

    const response: LeaderboardResponse = {
      type,
      entries,
      updated_at: new Date().toISOString(),
      total_entries: count || entries.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
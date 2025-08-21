'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

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

const LEADERBOARD_TABS = [
  {
    id: 'weekly' as LeaderboardType,
    label: 'Weekly Winners',
    shortLabel: 'Weekly',
    description: 'Multiplayer Weekly Winners (reset weekly at Monday 00 UTC)',
    scoreLabel: 'Wins',
  },
  {
    id: 'daily' as LeaderboardType,
    label: 'Daily Winners',
    shortLabel: 'Daily',
    description: 'Multiplayer Daily Winners (reset daily at 00 UTC)',
    scoreLabel: 'Wins',
  },
  {
    id: 'singleplayer' as LeaderboardType,
    label: 'Highest Round',
    shortLabel: 'Singleplayer',
    description: 'Singleplayer Highest Round (historical)',
    scoreLabel: 'Round',
  },
] as const;

export const LeaderboardTabs = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('weekly');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (type: LeaderboardType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.getLeaderboard(type, 50, 0); // Get top 50 entries
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setLeaderboardData(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      setLeaderboardData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const handleTabChange = (tabId: LeaderboardType) => {
    setActiveTab(tabId);
  };

  const handleRefresh = () => {
    fetchLeaderboard(activeTab);
  };

  const formatPlayerName = (playerId: string): string => {
    return playerId;
  };

  const getRankDisplay = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const currentTab = LEADERBOARD_TABS.find(tab => tab.id === activeTab);

  return (
    <div className="h-full flex flex-col">
      {/* Mobile-First Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex" aria-label="Tabs">
          {LEADERBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-4 px-2 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <div className="truncate">
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Current tab description - mobile optimized */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            {currentTab?.description}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 text-lg">Loading leaderboard...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 px-4">
              <div className="text-red-600 text-center">
                <p className="font-semibold text-lg">Error loading leaderboard</p>
                <p className="text-sm mt-2">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : !leaderboardData || leaderboardData.entries.length === 0 ? (
            <div className="flex items-center justify-center py-12 px-4">
              <div className="text-gray-500 text-center">
                <p className="font-semibold text-lg">No entries yet</p>
                <p className="text-sm mt-2">
                  {activeTab === 'singleplayer' 
                    ? 'Play some single-player games to appear here!'
                    : 'Play some multiplayer matches to appear here!'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* Leaderboard Entries */}
              <div className="space-y-3 max-w-2xl mx-auto">
                {leaderboardData.entries.map((entry, index) => (
                  <div
                    key={`${entry.player_id}-${entry.rank}`}
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                      index < 3 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Left side - Rank and Player */}
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <span className="text-2xl md:text-3xl font-bold min-w-[3rem] text-center">
                        {getRankDisplay(entry.rank)}
                      </span>
                      <span className="font-semibold text-gray-900 truncate text-lg md:text-xl">
                        {formatPlayerName(entry.player_id)}
                      </span>
                    </div>
                    
                    {/* Right side - Score */}
                    <div className="text-right ml-4">
                      <div className="font-bold text-2xl md:text-3xl text-blue-600">
                        {entry.score}
                      </div>
                      <div className="text-sm text-gray-500">
                        {currentTab?.scoreLabel}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Info */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-4 text-sm text-gray-600">
                  <span>Showing top {leaderboardData.entries.length} of {leaderboardData.total_entries} players</span>
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
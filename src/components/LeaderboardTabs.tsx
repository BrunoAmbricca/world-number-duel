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
    label: 'Weekly Wins',
    description: 'Most multiplayer wins this week',
    scoreLabel: 'Wins',
  },
  {
    id: 'daily' as LeaderboardType,
    label: 'Daily Wins',
    description: 'Most multiplayer wins today',
    scoreLabel: 'Wins',
  },
  {
    id: 'singleplayer' as LeaderboardType,
    label: 'Best Singleplayer',
    description: 'Highest rounds reached',
    scoreLabel: 'Round',
  },
] as const;

export const LeaderboardTabs = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('weekly');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchLeaderboard = async (type: LeaderboardType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.getLeaderboard(type, 50, 0); // Get top 50 entries
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setLeaderboardData(data);
      setLastRefresh(new Date());
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

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getRankDisplay = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const currentTab = LEADERBOARD_TABS.find(tab => tab.id === activeTab);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {LEADERBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentTab?.label}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentTab?.description}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500">
                Updated: {formatTimestamp(lastRefresh.toISOString())}
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-600">Loading leaderboard...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-600">
                <p className="font-medium">Error loading leaderboard</p>
                <p className="text-sm mt-1">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : !leaderboardData || leaderboardData.entries.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 text-center">
                <p className="font-medium">No entries yet</p>
                <p className="text-sm mt-1">
                  {activeTab === 'singleplayer' 
                    ? 'Play some single-player games to appear here!'
                    : 'Play some multiplayer matches to appear here!'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                <div>Rank & Player</div>
                <div className="text-center">{currentTab?.scoreLabel}</div>
                {activeTab === 'singleplayer' && <div className="text-right">Last Updated</div>}
                {activeTab !== 'singleplayer' && <div></div>}
              </div>

              {/* Leaderboard Entries */}
              {leaderboardData.entries.map((entry, index) => (
                <div
                  key={`${entry.player_id}-${entry.rank}`}
                  className={`grid grid-cols-3 gap-4 py-3 px-2 rounded-lg transition-colors ${
                    index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium min-w-[2rem]">
                      {getRankDisplay(entry.rank)}
                    </span>
                    <span className="font-medium text-gray-900 truncate">
                      {formatPlayerName(entry.player_id)}
                    </span>
                  </div>
                  <div className="text-center font-bold text-lg text-blue-600">
                    {entry.score}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {activeTab === 'singleplayer' && entry.last_updated && (
                      formatTimestamp(entry.last_updated)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {leaderboardData && leaderboardData.entries.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="text-sm text-gray-600 text-center">
              Showing top {leaderboardData.entries.length} of {leaderboardData.total_entries} players
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
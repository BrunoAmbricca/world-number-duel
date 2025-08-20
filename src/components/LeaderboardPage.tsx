'use client';

import { useRouter } from 'next/navigation';
import { LeaderboardTabs } from './LeaderboardTabs';

export const LeaderboardPage = () => {
  const router = useRouter();

  const handleBackToMenu = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leaderboards</h1>
            <p className="text-gray-600 mt-2">
              See how you rank against other players
            </p>
          </div>
          <button
            onClick={handleBackToMenu}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm border border-gray-200 transition-colors"
          >
            ← Back to Menu
          </button>
        </div>

        {/* Leaderboard Content */}
        <LeaderboardTabs />

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">How Rankings Work</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Weekly Wins</h4>
              <p>
                Ranks players by total multiplayer matches won during the current week.
                Resets every Monday at 00:00 UTC.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Daily Wins</h4>
              <p>
                Ranks players by total multiplayer matches won during the current day.
                Resets every day at 00:00 UTC.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Best Singleplayer</h4>
              <p>
                Ranks players by the highest round they have ever reached in single-player mode.
                This ranking never resets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
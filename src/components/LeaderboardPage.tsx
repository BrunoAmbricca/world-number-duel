'use client';

import { useRouter } from 'next/navigation';
import { LeaderboardTabs } from './LeaderboardTabs';
import { HelpButton } from './HelpButton';
import { AppLayout } from './AppLayout';

export const LeaderboardPage = () => {
  const router = useRouter();

  const handleBackToMenu = () => {
    router.push('/');
  };

  return (
    <AppLayout>
      <div className="h-screen w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Leaderboards</h1>
            <p className="text-sm text-gray-600 hidden sm:block">
              See how you rank against other players
            </p>
          </div>
          <button
            onClick={handleBackToMenu}
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 text-lg rounded-xl shadow-sm border border-gray-200 transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Leaderboard Content */}
        <div className="flex-1 overflow-hidden">
          <LeaderboardTabs />
        </div>

        {/* Floating Help Button */}
        <HelpButton />
      </div>
    </AppLayout>
  );
};
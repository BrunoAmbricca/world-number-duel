'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Settings } from 'lucide-react';
import { useState } from 'react';

interface TopNavBarProps {
  coins?: number;
  onSettingsClick?: () => void;
}

export const TopNavBar = ({ coins = 0, onSettingsClick }: TopNavBarProps) => {
  const router = useRouter();

  const handleLeaderboardClick = () => {
    router.push('/leaderboard');
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      // Default settings action - could open a modal
      console.log('Settings clicked - implement modal');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full h-14 bg-white shadow-md border-b border-gray-200">
      <div className="flex items-center justify-between px-3 sm:px-4 h-full max-w-7xl mx-auto">
        {/* Leaderboard Button (Left) - Mobile-first design */}
        <button
          onClick={handleLeaderboardClick}
          className="flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 rounded-full bg-purple-100 hover:bg-purple-200 active:bg-purple-300 text-purple-600 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation"
          aria-label="View Leaderboard"
        >
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Coin Counter (Center) - Responsive sizing */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 sm:px-4 py-2 rounded-full border border-yellow-200 shadow-sm">
          {/* WorldCoin Icon - Custom circular W */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0">
            W
          </div>
          <span className="font-semibold text-base sm:text-lg text-gray-800 min-w-0">
            {coins.toLocaleString()}
          </span>
        </div>

        {/* Settings Button (Right) - Mobile-first design */}
        <button
          onClick={handleSettingsClick}
          className="flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </nav>
  );
};
'use client';

import { useState } from 'react';
import { TopNavBar } from './TopNavBar';
import { SettingsModal } from './SettingsModal';
import { useCoins } from '@/hooks/useCoins';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavBar?: boolean;
}

export const AppLayout = ({ children, showNavBar = true }: AppLayoutProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { coins, isLoading } = useCoins();

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {showNavBar && (
        <TopNavBar 
          coins={isLoading ? 0 : coins} 
          onSettingsClick={handleSettingsClick}
        />
      )}
      
      {/* Main content area with proper top padding when nav bar is shown */}
      <main className={showNavBar ? 'pt-14' : ''}>
        {children}
      </main>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={handleSettingsClose}
      />
    </div>
  );
};
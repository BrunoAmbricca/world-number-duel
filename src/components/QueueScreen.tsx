'use client';

import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { HelpButton } from './HelpButton';
import { AppLayout } from './AppLayout';

export default function QueueScreen() {
  const { session } = useSession();
  const router = useRouter();
  const {
    isInQueue,
    isSearching,
    matchFound,
    matchId,
    error,
    joinQueue,
    leaveQueue,
  } = useMatchmaking(session?.playerId);

  useEffect(() => {
    console.log('🔄 QueueScreen state:', { matchFound, matchId, isInQueue, isSearching });
    if (matchFound && matchId) {
      console.log(`🎮 Redirecting to game: /game/${matchId}`);
      router.push(`/game/${matchId}`);
    }
  }, [matchFound, matchId, router, isInQueue, isSearching]);

  if (!session) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Please start a session to play multiplayer
            </h2>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 mb-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multiplayer Queue
          </h1>
          <p className="text-gray-600 mb-8">
            Find an opponent for a number sum challenge!
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!isInQueue && !isSearching && (
            <div className="space-y-4">
              <button
                onClick={joinQueue}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Join Queue
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back to Home
              </button>
            </div>
          )}

          {isSearching && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600">Finding a match...</p>
            </div>
          )}

          {isInQueue && !isSearching && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <p className="text-gray-600">Waiting for opponent...</p>
              <button
                onClick={leaveQueue}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Leave Queue
              </button>
            </div>
          )}

          {matchFound && (
            <div className="space-y-4">
              <div className="text-green-600">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">Match found! Redirecting...</p>
            </div>
          )}
        </div>
      </div>

        {/* Floating Help Button */}
        <HelpButton />
      </div>
    </AppLayout>
  );
}
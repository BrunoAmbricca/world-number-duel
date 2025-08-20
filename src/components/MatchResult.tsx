'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { Match } from '@/types/multiplayer';

interface MatchResultProps {
  match: Match;
}

export default function MatchResult({ match }: MatchResultProps) {
  const { session } = useSession();
  const router = useRouter();

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please start a session to view results
          </h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isWinner = match.winner_id === session.playerId;
  const opponentId = match.player1_id === session.playerId ? match.player2_id : match.player1_id;

  const handleBackToMenu = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        {/* Result Icon and Message */}
        <div className="mb-6">
          {isWinner ? (
            <div className="text-6xl mb-4">🎉</div>
          ) : (
            <div className="text-6xl mb-4">😞</div>
          )}
          
          <h1 className={`text-3xl font-bold mb-2 ${
            isWinner ? 'text-green-600' : 'text-red-600'
          }`}>
            {isWinner ? 'You Won!' : 'You Lost'}
          </h1>
          
          <p className="text-gray-600">
            {isWinner 
              ? 'Congratulations! You calculated the sum correctly while your opponent did not.'
              : 'Better luck next time! Your opponent calculated the sum correctly while you did not.'
            }
          </p>
        </div>

        {/* Match Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Match Summary</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>You:</span>
              <span className="font-medium">{session.playerId}</span>
            </div>
            <div className="flex justify-between">
              <span>Opponent:</span>
              <span className="font-medium">{opponentId}</span>
            </div>
            <div className="flex justify-between">
              <span>Rounds Played:</span>
              <span className="font-medium">{match.current_round}</span>
            </div>
            <div className="flex justify-between">
              <span>Winner:</span>
              <span className={`font-medium ${
                isWinner ? 'text-green-600' : 'text-red-600'
              }`}>
                {isWinner ? 'You' : 'Opponent'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleBackToMenu}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Main Menu
          </button>
          
          <button
            onClick={() => router.push('/queue')}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
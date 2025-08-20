'use client';

import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { useSession } from '@/hooks/useSession';
import { usePusher } from '@/hooks/usePusher';
import { useRouter } from 'next/navigation';

interface MultiplayerGamePageProps {
  matchId: string;
}

export default function MultiplayerGamePage({ matchId }: MultiplayerGamePageProps) {
  const { session } = useSession();
  const router = useRouter();
  usePusher(); // Initialize Pusher connection

  const {
    match,
    currentRound,
    selectedNumbers,
    isLoading,
    error,
    isMyTurn,
    isGameActive,
    canSubmit,
    isSubmitting,
    waitingForOpponent,
    toggleNumber,
    submitAnswer,
    clearSelection,
  } = useMultiplayerGame(matchId, session?.playerId || '');

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please start a session to play
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/queue')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  if (!currentRound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Waiting for next round...</p>
        </div>
      </div>
    );
  }

  const opponent = match.player1_id === session.playerId ? match.player2 : match.player1;
  const selectedSum = selectedNumbers.reduce((sum, num) => sum + num, 0);

  const getStatusMessage = () => {
    if (!isGameActive) {
      if (match.status === 'completed') {
        if (match.winner_id === session.playerId) {
          return { text: 'You won! 🎉', color: 'text-green-600' };
        } else if (match.winner_id) {
          return { text: 'You lost 😞', color: 'text-red-600' };
        } else {
          return { text: 'Match ended', color: 'text-gray-600' };
        }
      }
      return { text: 'Match not active', color: 'text-gray-600' };
    }

    if (waitingForOpponent) {
      return { text: 'Waiting for opponent...', color: 'text-blue-600' };
    }

    if (isMyTurn) {
      return { text: 'Your turn!', color: 'text-green-600' };
    } else {
      return { text: `${opponent?.username || 'Opponent'}'s turn`, color: 'text-orange-600' };
    }
  };

  const status = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Multiplayer Game
            </h1>
            <button
              onClick={() => router.push('/queue')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Leave Game
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`text-center p-4 rounded-lg ${match.player1_id === session.playerId ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <p className="font-semibold">{match.player1?.username || session.playerId === match.player1_id ? session.playerId : 'Player 1'}</p>
              <p className="text-sm text-gray-600">
                {match.player1_id === session.playerId ? '(You)' : '(Opponent)'}
              </p>
            </div>
            <div className={`text-center p-4 rounded-lg ${match.player2_id === session.playerId ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <p className="font-semibold">{match.player2?.username || session.playerId === match.player2_id ? session.playerId : 'Player 2'}</p>
              <p className="text-sm text-gray-600">
                {match.player2_id === session.playerId ? '(You)' : '(Opponent)'}
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className={`text-lg font-semibold ${status.color}`}>
              {status.text}
            </p>
            <p className="text-sm text-gray-600">
              Round {match.current_round}
            </p>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Find numbers that sum to: {currentRound.target_sum}
            </h2>
            <p className="text-gray-600">
              Current selection sum: {selectedSum}
            </p>
          </div>

          {/* Number Sequence */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {currentRound.sequence.map((number, index) => (
              <button
                key={index}
                onClick={() => isMyTurn && isGameActive && toggleNumber(number)}
                disabled={!isMyTurn || !isGameActive || waitingForOpponent}
                className={`
                  w-12 h-12 rounded-lg font-semibold text-lg transition-all
                  ${selectedNumbers.includes(number)
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }
                  ${(!isMyTurn || !isGameActive || waitingForOpponent) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-md cursor-pointer'
                  }
                `}
              >
                {number}
              </button>
            ))}
          </div>

          {/* Controls */}
          {isGameActive && (
            <div className="flex justify-center gap-4">
              <button
                onClick={clearSelection}
                disabled={selectedNumbers.length === 0 || !isMyTurn || waitingForOpponent}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                onClick={submitAnswer}
                disabled={!canSubmit}
                className={`
                  px-6 py-3 rounded-lg font-semibold transition-colors
                  ${canSubmit
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          )}

          {waitingForOpponent && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-600">Waiting for opponent to submit...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
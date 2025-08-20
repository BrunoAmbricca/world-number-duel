'use client';

import { GameState } from '@/hooks/useGameLogic';

interface GameControlsProps {
  gameState: GameState;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  correctSum: number;
  isCorrect: boolean | null;
  currentRound: number;
  finalScore: number;
  highScore: number;
  onStart: () => void;
  onSubmit: () => void;
  onNextRound: () => void;
  onReset: () => void;
  onBackToMenu: () => void;
  disabled?: boolean;
}

export const GameControls = ({
  gameState,
  userAnswer,
  setUserAnswer,
  correctSum,
  isCorrect,
  currentRound,
  finalScore,
  highScore,
  onStart,
  onSubmit,
  onNextRound,
  onReset,
  onBackToMenu,
  disabled = false
}: GameControlsProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && gameState === 'input' && userAnswer.trim() && !disabled) {
      onSubmit();
    }
  };

  if (gameState === 'idle') {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Number Sequence Game</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Watch the sequence of numbers appear on screen, then calculate their sum. Keep going until you make a mistake!
        </p>
        <button
          onClick={onStart}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Start Game
        </button>
      </div>
    );
  }

  if (gameState === 'input') {
    return (
      <div className="text-center">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Round {currentRound}
          </h2>
          <h3 className="text-xl text-gray-600 mt-2">
            What&apos;s the sum of all numbers?
          </h3>
        </div>
        <div className="mb-6">
          <input
            type="number"
            value={userAnswer}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter your answer"
            className={`text-2xl text-center border-2 border-gray-300 rounded-lg px-4 py-2 w-64 focus:border-blue-500 focus:outline-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            autoFocus
            disabled={disabled}
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={!userAnswer.trim() || disabled}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Submit Answer
        </button>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="text-center">
        <div className={`text-6xl mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? '✓' : '✗'}
        </div>
        <h2 className={`text-3xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect!'}
        </h2>
        <div className="mb-6 text-lg text-gray-700">
          <p>Your answer: <span className="font-semibold">{userAnswer}</span></p>
          <p>Correct answer: <span className="font-semibold">{correctSum}</span></p>
          <p className="mt-2 font-semibold text-blue-600">Round {currentRound} Complete!</p>
        </div>
        {isCorrect && (
          <button
            onClick={onNextRound}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors mr-4"
          >
            Next Round
          </button>
        )}
        <button
          onClick={onReset}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          End Game
        </button>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    const isNewRecord = finalScore > highScore;
    return (
      <div className="text-center">
        <div className="text-6xl mb-4 text-red-600">
          💀
        </div>
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Game Over!</h1>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-2xl font-semibold mb-2 text-gray-700">
            You reached Round {finalScore}
          </p>
          {isNewRecord ? (
            <div className="text-green-600">
              <p className="text-lg font-semibold">🎉 New Personal Best! 🎉</p>
              <p className="text-sm">Previous best: {highScore}</p>
            </div>
          ) : (
            <div className="text-gray-600">
              <p className="text-lg">Personal Best: {highScore}</p>
              {highScore > finalScore && (
                <p className="text-sm">Keep trying to beat your record!</p>
              )}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <button
            onClick={onReset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors w-full sm:w-auto"
          >
            Play Again
          </button>
          <br />
          <button
            onClick={onBackToMenu}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors w-full sm:w-auto"
          >
            Back to Main Menu
          </button>
        </div>
      </div>
    );
  }

  return null;
};
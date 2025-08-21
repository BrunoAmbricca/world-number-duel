'use client';

import { GameState } from '@/hooks/useGameLogic';

interface GameControlsProps {
  gameState: GameState;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  correctSum: number;
  isCorrect: boolean | null;
  currentRound: number;
  completedRounds: number;
  finalScore: number;
  highScore: number;
  timeLeft: number;
  isTimerActive: boolean;
  timerStartTime: number;
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
  completedRounds,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && gameState === 'input' && userAnswer.trim() && !disabled) {
      onSubmit();
    }
  };

  if (gameState === 'idle') {
    return (
      <div className="flex flex-col h-full">
        {/* Middle Section - Title and Description */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">Number Sequence Game</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md leading-relaxed">
            Watch the sequence of numbers appear on screen, then calculate their sum. Keep going until you make a mistake!
          </p>
        </div>
        
        {/* Bottom Section - Action Button */}
        <div className="p-6 pb-24">
          <button
            onClick={onStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-4 px-6 rounded-xl transition-colors shadow-lg"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'input') {
    return (
      <div className="flex flex-col h-full">
        {/* Round Info */}
        <div className="px-6 py-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Round {currentRound}
          </h2>
          <h3 className="text-lg text-gray-600 mt-2">
            What&apos;s the sum of all numbers?
          </h3>
        </div>

        {/* Middle Section - Input Field */}
        <div className="flex-1 flex items-center justify-center px-6">
          <input
            type="number"
            value={userAnswer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your answer"
            className={`text-3xl md:text-4xl text-center border-2 border-gray-300 rounded-xl px-6 py-4 w-full max-w-sm focus:border-blue-500 focus:outline-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            autoFocus
            disabled={disabled}
          />
        </div>
        
        {/* Bottom Section - Submit Button */}
        <div className="p-6 pb-24">
          <button
            onClick={onSubmit}
            disabled={!userAnswer.trim() || disabled}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-xl py-4 px-6 rounded-xl transition-colors shadow-lg"
          >
            Submit Answer
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="flex flex-col h-full">
        {/* Middle Section - Result Display */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className={`text-8xl mb-6 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? '✓' : '✗'}
          </div>
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? 'Correct!' : 'Incorrect!'}
          </h2>
          <div className="mb-6 text-lg text-gray-700 space-y-2">
            <p>Your answer: <span className="font-bold">{userAnswer}</span></p>
            <p>Correct answer: <span className="font-bold">{correctSum}</span></p>
            <p className="mt-4 font-bold text-blue-600 text-xl">Round {completedRounds} Complete!</p>
          </div>
        </div>
        
        {/* Bottom Section - Action Buttons */}
        <div className="p-6 pb-24 space-y-3">
          {isCorrect && (
            <button
              onClick={onNextRound}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 px-6 rounded-xl transition-colors shadow-lg"
            >
              Next Round
            </button>
          )}
          <button
            onClick={onReset}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold text-xl py-4 px-6 rounded-xl transition-colors shadow-lg"
          >
            End Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    const isNewRecord = finalScore > highScore;
    return (
      <div className="flex flex-col h-full">
        {/* Middle Section - Game Over Display */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="text-8xl mb-6 text-red-600">
            💀
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">Game Over!</h1>
          <div className="bg-gray-50 rounded-xl p-6 mb-6 max-w-sm w-full">
            <p className="text-2xl font-bold mb-4 text-gray-700">
              You reached Round {finalScore}
            </p>
            {isNewRecord ? (
              <div className="text-green-600">
                <p className="text-lg font-bold mb-2">🎉 New Personal Best! 🎉</p>
                <p className="text-sm">Previous best: {highScore}</p>
              </div>
            ) : (
              <div className="text-gray-600">
                <p className="text-lg font-semibold">Personal Best: {highScore}</p>
                {highScore > finalScore && (
                  <p className="text-sm mt-2">Keep trying to beat your record!</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Section - Action Buttons */}
        <div className="p-6 pb-24 space-y-3">
          <button
            onClick={onReset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-4 px-6 rounded-xl transition-colors shadow-lg"
          >
            Play Again
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold text-xl py-4 px-6 rounded-xl transition-colors shadow-lg"
          >
            Back to Main Menu
          </button>
        </div>
      </div>
    );
  }

  return null;
};
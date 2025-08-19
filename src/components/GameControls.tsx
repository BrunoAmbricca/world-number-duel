'use client';

import { GameState } from '@/hooks/useGameLogic';

interface GameControlsProps {
  gameState: GameState;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  correctSum: number;
  isCorrect: boolean | null;
  onStart: () => void;
  onSubmit: () => void;
  onReset: () => void;
}

export const GameControls = ({
  gameState,
  userAnswer,
  setUserAnswer,
  correctSum,
  isCorrect,
  onStart,
  onSubmit,
  onReset
}: GameControlsProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && gameState === 'input' && userAnswer.trim()) {
      onSubmit();
    }
  };

  if (gameState === 'idle') {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Number Sequence Game</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Watch the sequence of numbers appear on screen, then calculate their sum!
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
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          What&apos;s the sum of all numbers?
        </h2>
        <div className="mb-6">
          <input
            type="number"
            value={userAnswer}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter your answer"
            className="text-2xl text-center border-2 border-gray-300 rounded-lg px-4 py-2 w-64 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={!userAnswer.trim()}
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
        </div>
        <button
          onClick={onReset}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  return null;
};
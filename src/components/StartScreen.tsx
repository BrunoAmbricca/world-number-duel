'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export const StartScreen = () => {
  const router = useRouter();
  const { startSession } = useSession();

  const handlePlay = () => {
    startSession();
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-12 w-full max-w-lg text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Number Sequence Game
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Watch numbers appear on screen, remember them, and calculate their sum!
          </p>
        </div>
        
        <div className="mb-8">
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">How to Play:</h2>
            <ul className="text-gray-600 space-y-2 text-left">
              <li>• Numbers will appear one by one</li>
              <li>• Each number can be positive (+) or negative (-)</li>
              <li>• Remember all the numbers</li>
              <li>• Calculate their total sum</li>
              <li>• Enter your answer when prompted</li>
            </ul>
          </div>
        </div>

        <button
          onClick={handlePlay}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-4 px-12 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Start Playing
        </button>
        
        <p className="text-gray-500 text-sm mt-6">
          A unique player ID will be assigned to track your session
        </p>
      </div>
    </div>
  );
};
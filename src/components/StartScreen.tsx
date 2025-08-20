"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export const StartScreen = () => {
  const router = useRouter();
  const { startSession } = useSession();

  const handlePlay = () => {
    startSession();
    router.push("/game");
  };

  const handleMultiplayer = () => {
    startSession();
    router.push("/queue");
  };

  const handleLeaderboard = () => {
    router.push("/leaderboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      {/* Leaderboard button in top-right corner */}
      <button
        onClick={handleLeaderboard}
        className="absolute top-6 right-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg z-10"
      >
        Leaderboard
      </button>

      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
          {/* Title and description */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Number Sequence Game
            </h1>
            <p className="text-gray-600 text-xl leading-relaxed max-w-3xl mx-auto">
              Challenge yourself or compete against other players in real-time!
            </p>
          </div>

          {/* Game mode sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Singleplayer Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* Placeholder background */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl h-48 mb-6 flex items-center justify-center">
                <div className="text-white text-2xl font-bold">
                  Single Player
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Practice Mode
              </h2>
              <p className="text-gray-600 mb-6">
                Improve your skills and beat your personal best score
              </p>

              <button
                onClick={handlePlay}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Start Singleplayer
              </button>
            </div>

            {/* Multiplayer Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* Placeholder background */}
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl h-48 mb-6 flex items-center justify-center">
                <div className="text-white text-2xl font-bold">Multiplayer</div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Compete Online
              </h2>
              <p className="text-gray-600 mb-6">
                Challenge other players in real-time matches
              </p>

              <button
                onClick={handleMultiplayer}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Find Match
              </button>
            </div>
          </div>

          {/* How to play section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              How to Play
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Game Rules:
                </h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Numbers will appear one by one</li>
                  <li>• Each number can be positive (+) or negative (-)</li>
                  <li>• Remember all the numbers</li>
                  <li>• Calculate their total sum</li>
                  <li>• Enter your answer within 5 seconds</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Tips:
                </h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Focus on each number as it appears</li>
                  <li>• Keep a running total in your head</li>
                  <li>• Practice with single player first</li>
                  <li>• Speed and accuracy both matter</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

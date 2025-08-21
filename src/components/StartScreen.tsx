"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { HelpButton } from "./HelpButton";

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
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative flex flex-col">
      {/* Leaderboard button in top-right corner */}
      <button
        onClick={handleLeaderboard}
        className="absolute top-4 right-4 h-12 w-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl z-10 flex items-center justify-center border-2 border-white/20"
        aria-label="Leaderboard"
      >
        {/* Trophy/Podium Icon */}
        <svg 
          className="h-6 w-6" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
        </svg>
      </button>

      <div className="flex-1 flex flex-col px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
          {/* Title and description */}
          <div className="text-center mb-8 pt-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Number Sequence Game
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Challenge yourself or compete against other players in real-time!
            </p>
          </div>

          {/* Game mode sections */}
          <div className="flex-1 flex flex-col gap-6 mb-8">
            {/* Singleplayer Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              {/* Placeholder background */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl h-32 mb-4 flex items-center justify-center">
                <div className="text-white text-xl font-bold">
                  Single Player
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-3">
                Practice Mode
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Improve your skills and beat your personal best score
              </p>

              <button
                onClick={handlePlay}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Start Singleplayer
              </button>
            </div>

            {/* Multiplayer Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              {/* Placeholder background */}
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl h-32 mb-4 flex items-center justify-center">
                <div className="text-white text-xl font-bold">Multiplayer</div>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-3">
                Compete Online
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Challenge other players in real-time matches
              </p>

              <button
                onClick={handleMultiplayer}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Find Match
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Help Button */}
      <HelpButton />
    </div>
  );
};

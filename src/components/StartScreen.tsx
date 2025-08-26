"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { HelpButton } from "./HelpButton";
import { AppLayout } from "./AppLayout";

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

  return (
    <AppLayout>
      <div className="min-h-screen w-full relative flex flex-col">
        <div className="flex-1 flex flex-col px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
            {/* Title and description */}
            <div className="text-center mb-8 pt-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Number Sequence Game
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                Challenge yourself or compete against other players in
                real-time!
              </p>
            </div>

            {/* Game mode sections - with bottom padding to avoid floating button overlap */}
            <div className="flex-1 flex flex-col gap-6 mb-24 pb-4">
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
                  <div className="text-white text-xl font-bold">
                    Multiplayer
                  </div>
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
    </AppLayout>
  );
};

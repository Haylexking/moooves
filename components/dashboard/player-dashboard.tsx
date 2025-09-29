
import React from "react";
import { useRouter } from "next/navigation";
import { GameButton } from "../ui/game-button";
import { GlobalSidebar } from "../ui/global-sidebar";

export function PlayerDashboard() {
  const router = useRouter();

  const handleStartGame = () => {
    router.push("/start-game-options");
  };

  const handleGameRules = () => {
    router.push("/help");
  };

  return (
    <div className="flex min-h-screen">
      <GlobalSidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <GameButton onClick={handleStartGame} className="w-full text-lg font-semibold py-6">
            Start Game
          </GameButton>
          <GameButton onClick={handleGameRules} className="w-full text-lg font-semibold py-6">
            Game Rules
          </GameButton>
        </div>
      </main>
    </div>
  );
}


"use client"

import React from "react";
import { useRouter } from "next/navigation";
import { GameButton } from "../ui/game-button";
import { GlobalSidebar } from "../ui/global-sidebar";
import { useGameRules } from "../game/GameRulesProvider";
import { useAuthStore } from "@/lib/stores/auth-store";

export function PlayerDashboard() {
  const router = useRouter();
  const { openRules } = useGameRules();
  const { user } = useAuthStore();

  const handleStartGame = () => {
    router.push("/start-game-options");
  };

  const handleGameRules = () => {
    openRules();
  };

  const handleCreateTournament = () => {
    router.push("/tournaments/create");
  };

  return (
    <div className="flex min-h-screen">
      <GlobalSidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <GameButton onClick={handleStartGame} className="w-full text-lg font-semibold py-6">
            Start Game
          </GameButton>
          {user?.canHost && (
            <GameButton 
              onClick={handleCreateTournament} 
              className="w-full text-lg font-semibold py-6 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Create Tournament
            </GameButton>
          )}
          <GameButton onClick={handleGameRules} className="w-full text-lg font-semibold py-6">
            Game Rules
          </GameButton>
        </div>
      </main>
    </div>
  );
}

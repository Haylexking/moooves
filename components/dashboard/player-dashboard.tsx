
"use client"

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameButton } from "../ui/game-button";
import { GlobalSidebar } from "../ui/global-sidebar";
import { useGameRules } from "../game/GameRulesProvider";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getUserDisplayName } from "@/lib/utils/display-name";
import { useTournamentStore } from "@/lib/stores/tournament-store";

export function PlayerDashboard() {
  const router = useRouter();
  const { openRules } = useGameRules();
  const { user } = useAuthStore();
  const { userTournaments, loadUserTournaments } = useTournamentStore();

  // Load actual tournaments for the logged-in user to show a real count
  useEffect(() => {
    if (user?.id && typeof loadUserTournaments === 'function') {
      loadUserTournaments(user.id).catch(() => void 0)
    }
  }, [user?.id, loadUserTournaments])

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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 pt-24 sm:pt-28">
      <GlobalSidebar showTrigger={false} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8 w-full">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 sm:p-8 space-y-6 w-full">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome Back, {getUserDisplayName(user ?? undefined)}!</h1>
              {user?.gamesPlayed !== undefined && (
                <p className="text-gray-600 mt-2">
                  Games Played: <span className="font-semibold">{user.gamesPlayed}</span>
                </p>
              )}
            </div>

            <div className="space-y-4 w-full">
              <GameButton 
                onClick={handleStartGame} 
                className="w-full text-lg font-semibold py-5 md:py-6 hover:scale-[1.02] transition-transform"
              >
                🎮 Start Game
              </GameButton>
              
              {user?.canHost && (
                <GameButton 
                  onClick={handleCreateTournament} 
                  className="w-full text-lg font-semibold py-5 md:py-6 bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-[1.02] transition-transform"
                >
                  🏆 Create Tournament
                </GameButton>
              )}
              
              <GameButton 
                onClick={handleGameRules} 
                className="w-full text-lg font-semibold py-5 md:py-6 bg-gray-100 hover:bg-gray-200 text-gray-800 hover:scale-[1.02] transition-transform"
              >
                📖 Game Rules
              </GameButton>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-blue-600">Games</p>
                  <p className="text-2xl font-bold text-blue-700">{user?.gamesPlayed ?? 0}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-green-600">Tournaments</p>
                  <p className="text-2xl font-bold text-green-700">{userTournaments?.length ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

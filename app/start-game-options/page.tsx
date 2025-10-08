"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { GameButton } from "../../components/ui/game-button";
import { GlobalSidebar } from "../../components/ui/global-sidebar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTournamentStore } from "@/lib/stores/tournament-store";


export default function StartGameOptions() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { userTournaments } = useTournamentStore();

  // User must be authenticated, have canHost=true, and have participated in at least 3 tournaments
  const participatedTournaments = userTournaments?.filter(
    (t) => t.participants?.some((p) => p.userId === user?.id)
  ) ?? [];
  const canCreateTournament =
    isAuthenticated &&
    user?.canHost === true &&
    participatedTournaments.length >= 3;

  return (
    <div className="flex min-h-screen">
      <GlobalSidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <GameButton onClick={() => router.push("/game")} className="w-full text-lg font-semibold py-6">
            Player vs Player
          </GameButton>
          <GameButton onClick={() => router.push("/game?mode=pc")} className="w-full text-lg font-semibold py-6">
            Player vs Computer
          </GameButton>
          <GameButton onClick={() => router.push("/tournaments")}
            className="w-full text-lg font-semibold py-6"
            disabled={!canCreateTournament}
          >
            Start Tournament
          </GameButton>
          {!canCreateTournament && (
            <div className="text-sm text-red-500 text-center">
              You cannot create a new tournament at this time. You must have participated in at least 3 tournaments and be eligible to host.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

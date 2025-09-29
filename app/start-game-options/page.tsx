import React from "react";
import { useRouter } from "next/navigation";
import { GameButton } from "../../components/ui/game-button";
import { GlobalSidebar } from "../../components/ui/global-sidebar";

export default function StartGameOptions() {
  const router = useRouter();

  // Placeholder: Add logic for checking tournament creation eligibility if needed
  const canCreateTournament = true; // TODO: Replace with real logic

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
              You cannot create a new tournament at this time.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

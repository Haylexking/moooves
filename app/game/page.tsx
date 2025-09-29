"use client"

import { BattleGround } from "@/components/game/battle-ground"
import { useAuthStore } from "@/lib/stores/auth-store"
import { GameResultModal } from "@/components/game/game-result-modal"
import { useGameStore } from "@/lib/stores/game-store"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { GlobalSidebar } from "@/components/ui/global-sidebar"

export default function GamePage() {
  const { gameStatus, initializeGame, scores } = useGameStore();
  const { user } = useAuthStore();

  const handlePlayAgain = () => {
    initializeGame("timed");
  };

  const handleBackToMenu = () => {
    window.location.href = "/dashboard";
  };

  return (
    <ProtectedRoute>
      <GlobalSidebar />
      <BattleGround player1={user?.fullName || "User"} />
      <GameResultModal
        open={gameStatus === "completed"}
        onClose={handleBackToMenu}
        result={scores.X > scores.O ? "win" : scores.X < scores.O ? "lose" : "draw"}
        scoreX={scores.X}
        scoreO={scores.O}
      />
    </ProtectedRoute>
  );
}

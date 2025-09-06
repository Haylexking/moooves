"use client"

import { BattleGround } from "@/components/game/battle-ground"
import { GameResults } from "@/components/game/game-results"
import { useGameStore } from "@/lib/stores/game-store"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function GamePage() {
  const { gameStatus, initializeGame } = useGameStore()

  const handlePlayAgain = () => {
    initializeGame("timed")
  }

  const handleBackToMenu = () => {
    window.location.href = "/dashboard"
  }

  return (
    <ProtectedRoute>
      {gameStatus === "completed" ? (
        <GameResults onPlayAgain={handlePlayAgain} onBackToMenu={handleBackToMenu} />
      ) : (
        <BattleGround />
      )}
    </ProtectedRoute>
  )
}

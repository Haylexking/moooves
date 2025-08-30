"use client"

import { BattleGround } from "@/components/game/battle-ground"
import { GameResults } from "@/components/game/game-results"
import { useGameStore } from "@/lib/stores/game-store"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function GamePage() {
  const { gameStatus } = useGameStore()

  return <ProtectedRoute>{gameStatus === "finished" ? <GameResults /> : <BattleGround />}</ProtectedRoute>
}

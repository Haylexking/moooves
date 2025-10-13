"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BattleGround } from "@/components/game/battle-ground"
import { useAuthStore } from "@/lib/stores/auth-store"
import { GameResultModal } from "@/components/game/game-result-modal"
import { useGameStore } from "@/lib/stores/game-store"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { useRouter } from 'next/navigation'

export default function GamePageClient() {
  const searchParams = useSearchParams()
  const mode = searchParams?.get('mode') || undefined

  let localMode: 'ai' | 'p2p' | 'tournament' | undefined = undefined
  if (mode === 'ai') {
    localMode = 'ai'
  } else if (mode === 'p2p') {
    localMode = 'p2p'
  } else if (mode === 'tournament') {
    localMode = 'tournament'
  }

  const { gameStatus, initializeGame, scores } = useGameStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (localMode === 'ai') {
      useGameStore.setState({ serverAuthoritative: false })
    } else if (localMode === 'p2p') {
      useGameStore.setState({ serverAuthoritative: false })
    } else if (localMode === 'tournament') {
      useGameStore.setState({ serverAuthoritative: true })
    }
  }, [localMode])

  const handlePlayAgain = () => {
    initializeGame("timed");
  };

  const handleBackToMenu = () => {
    window.location.href = "/dashboard";
  };

  return (
    <ProtectedRoute>
      <GlobalSidebar />
      <BattleGround player1={user?.fullName || "User"} localMode={localMode} />
      <GameResultModal
        open={gameStatus === "completed"}
        onClose={handleBackToMenu}
        result={scores.X > scores.O ? "win" : scores.X < scores.O ? "lose" : "draw"}
        scoreX={scores.X}
        scoreO={scores.O}
      />
    </ProtectedRoute>
  )
}

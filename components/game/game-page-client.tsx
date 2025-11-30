"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BattleGround } from "@/components/game/battle-ground"
import { useAuthStore } from "@/lib/stores/auth-store"
import { GameResultModal } from "@/components/game/game-result-modal"
import { useGameStore } from "@/lib/stores/game-store"
import { ProtectedRoute } from "@/components/auth/protected-route"
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
    // Restart a fresh timed game (local). If this page was tournament/server-authoritative, redirect to start menu.
    if (localMode === 'ai' || localMode === 'p2p') {
      initializeGame("timed")
    } else {
      // Redirect to menu to choose mode
      const r = useRouter()
      r.push('/start-game-options')
    }
  };

  const handleBackToMenu = () => {
    window.location.href = "/dashboard"
  };

  // Determine connectionType from query params (used by tests)
  const connectionType = searchParams?.get('connection') || undefined

  return (
    <ProtectedRoute>
      <BattleGround gameMode="player-vs-player" localMode={localMode as any} />
      <GameResultModal
        open={gameStatus === "completed"}
        onClose={handleBackToMenu}
        onPlayAgain={handlePlayAgain}
        result={scores.X > scores.O ? "win" : scores.X < scores.O ? "lose" : "draw"}
        scoreX={scores.X}
        scoreO={scores.O}
      />
    </ProtectedRoute>
  )
}

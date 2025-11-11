"use client"

import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameButton } from "@/components/ui/game-button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useGameRules } from "@/components/game/GameRulesProvider"
import { StartGameModal } from "@/components/ui/start-game-modal"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { rehydrated } = useAuthStore()
  const { userTournaments, loadUserTournaments, isLoading } = useTournamentStore()
  const router = useRouter()
  const [showStartModal, setShowStartModal] = useState(false)
  const [showRules, setShowRules] = useState(false)

  const { openRules } = useGameRules()

  useEffect(() => {
    if (isAuthenticated && user?.role === "host") {
      router.push("/host-dashboard")
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    try {
      const { logDebug } = require("@/lib/hooks/use-debug-logger")
      const { apiClient } = require("@/lib/api/client")
      const token = apiClient?.getToken?.() || null
      logDebug("Dashboard", {
        event: "mount",
        tokenPresent: !!token,
        isAuthenticated,
        rehydrated,
        user: user ? { id: user.id, role: user.role } : null,
      })
    } catch (e) {
      // noop
    }
  }, [isAuthenticated, rehydrated, user])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserTournaments(user.id)
    }
  }, [isAuthenticated, user?.id, loadUserTournaments])

  if (!rehydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">Loading session...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const canCreateTournament = (userTournaments?.length || 0) >= 3

  const handleStartGame = () => {
    setShowStartModal(true)
  }

  const handleGameRules = () => openRules()

  const handleJoinTournament = () => {
    router.push("/tournaments")
  }

  const handleCreateTournament = () => {
    router.push("/tournaments")
  }

  return (
    <ProtectedRoute>
      <GlobalSidebar />
      <TopNavigation />
      <StartGameModal open={showStartModal} onOpenChange={setShowStartModal} />

      <div className="flex flex-col items-center justify-center min-h-screen pt-24 sm:pt-28">
        <div className="flex flex-col gap-6 mt-24 w-full max-w-md">
          <GameButton onClick={handleStartGame}>Start game</GameButton>
          <GameButton onClick={handleGameRules}>Game rules</GameButton>

          <GameButton onClick={handleJoinTournament}>Join Tournament</GameButton>

          {canCreateTournament && <GameButton onClick={handleCreateTournament}>Create Tournament</GameButton>}

          <div className="text-center mt-4">
            <p className="text-white font-semibold">Tournaments Participated: {userTournaments?.length || 0}</p>
            {!canCreateTournament && (
              <p className="text-yellow-300 text-sm mt-2">
                Participate in {3 - (userTournaments?.length || 0)} more tournaments to unlock tournament creation
              </p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

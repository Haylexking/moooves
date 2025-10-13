"use client"

import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameButton } from "@/components/ui/game-button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useGameRules } from "@/components/game/GameRulesProvider"

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { rehydrated } = useAuthStore()
  const { userTournaments, loadUserTournaments, isLoading } = useTournamentStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user?.role === "host") {
      router.push("/host-dashboard")
    }
  }, [isAuthenticated, user, router])

  // Diagnostic logging for mount and auth state changes
  useEffect(() => {
    try {
      // eslint-disable-next-line global-require
      const { logDebug } = require('@/lib/hooks/use-debug-logger')
      // Attempt to read token if apiClient is available
      // eslint-disable-next-line global-require
      const { apiClient } = require('@/lib/api/client')
      const token = apiClient?.getToken?.() || null
      logDebug('Dashboard', { event: 'mount', tokenPresent: !!token, isAuthenticated, rehydrated, user: user ? { id: user.id, role: user.role } : null })
    } catch (e) {
      // noop
    }
  }, [isAuthenticated, rehydrated, user])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserTournaments(user.id)
    }
  }, [isAuthenticated, user?.id, loadUserTournaments])

  // If the store hasn't rehydrated (persisted state restored), show a loading fallback to avoid blank screen
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
  const [showRules, setShowRules] = useState(false)

  const handleStartGame = () => {
    router.push("/game")
  }

  const { openRules } = useGameRules()
  const handleGameRules = () => openRules()

  const handleJoinTournament = () => {
    router.push("/tournaments")
  }

  const handleCreateTournament = () => {
    router.push("/tournaments")
  }

  return (
    <>
      <GlobalSidebar />
      <TopNavigation />

      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col gap-6 mt-24 w-full max-w-md">
          <GameButton onClick={handleStartGame}>
            Start game
          </GameButton>
          <GameButton onClick={handleGameRules}>
            Game rules
          </GameButton>

          <GameButton onClick={handleJoinTournament}>
            Join Tournament
          </GameButton>

          {canCreateTournament && (
            <GameButton onClick={handleCreateTournament}>
              Create Tournament
            </GameButton>
          )}

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
    </>
  )
}

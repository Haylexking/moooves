"use client"

import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameButton } from "@/components/ui/game-button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { userTournaments, loadUserTournaments, isLoading } = useTournamentStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user?.role === "host") {
      router.push("/host-dashboard")
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserTournaments(user.id)
    }
  }, [isAuthenticated, user?.id, loadUserTournaments])

  if (!isAuthenticated) {
    return null
  }

  const canCreateTournament = (userTournaments?.length || 0) >= 3

  const handleStartGame = () => {
    router.push("/game")
  }

  const handleGameRules = () => {
    router.push("/help")
  }

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

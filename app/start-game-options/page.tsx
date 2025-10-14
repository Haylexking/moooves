"use client"
import { useRouter } from "next/navigation"
import { GameButton } from "../../components/ui/game-button"
import { GlobalSidebar } from "../../components/ui/global-sidebar"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTournamentStore } from "@/lib/stores/tournament-store"

export default function StartGameOptions() {
  const router = useRouter()
  const { user, isAuthenticated, rehydrated } = useAuthStore()
  const { userTournaments } = useTournamentStore()

  // User must be authenticated, have canHost=true, and have participated in at least 3 tournaments
  const participatedTournaments =
    userTournaments?.filter((t) => t.participants?.some((p) => p.userId === user?.id)) ?? []
  const canCreateTournament = isAuthenticated && user?.canHost === true && participatedTournaments.length >= 3

  return !rehydrated ? (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-950">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">Loading session...</p>
      </div>
    </div>
  ) : (
    <div className="flex min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-950">
      <GlobalSidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">Start Game</h1>
            <p className="text-green-100 text-lg">Choose your game mode</p>
          </div>

          <div className="bg-green-800/40 backdrop-blur-sm rounded-2xl border-2 border-green-600/50 p-6 md:p-8 shadow-2xl space-y-4">
            <GameButton
              onClick={() => router.push("/game")}
              className="w-full text-lg md:text-xl font-bold py-6 md:py-7"
            >
              Play 1v1
            </GameButton>
            <GameButton
              onClick={() => router.push("/game?mode=ai")}
              className="w-full text-lg md:text-xl font-bold py-6 md:py-7"
            >
              Player vs Computer
            </GameButton>
            <GameButton
              onClick={() => router.push("/tournaments")}
              className="w-full text-lg md:text-xl font-bold py-6 md:py-7"
              disabled={!canCreateTournament}
            >
              Join Tournament
            </GameButton>
            {!canCreateTournament && (
              <div className="text-sm text-red-300 text-center bg-red-900/30 rounded-lg p-3 border border-red-500/30">
                You must participate in at least 3 tournaments and be eligible to host before creating a new tournament.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

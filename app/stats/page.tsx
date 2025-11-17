"use client"

import { useState, useEffect } from "react"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameButton } from "@/components/ui/game-button"
import { Gamepad2, Trophy, User } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiClient } from "@/lib/api/client"

interface UserStats {
  matchesPlayed: number
  tournamentsPlayed: number
  winPercentage: number
  tournamentsHosted: number
  highestRank: string
  lowestRank: string
  matchEarnings: number
  hostEarnings: number
}

export default function StatsPage() {
  const [userStats, setUserStats] = useState<UserStats>({
    matchesPlayed: 0,
    tournamentsPlayed: 0,
    winPercentage: 0,
    tournamentsHosted: 0,
    highestRank: "N/A",
    lowestRank: "N/A",
    matchEarnings: 0,
    hostEarnings: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setIsLoading(true)
        const res = await apiClient.getUserStats()
        if (res.success && res.data) {
          const stats = res.data as Partial<UserStats>
          setUserStats((prev) => ({
            matchesPlayed: stats.matchesPlayed ?? prev.matchesPlayed,
            tournamentsPlayed: stats.tournamentsPlayed ?? prev.tournamentsPlayed,
            winPercentage: stats.winPercentage ?? prev.winPercentage,
            tournamentsHosted: stats.tournamentsHosted ?? prev.tournamentsHosted,
            highestRank: stats.highestRank ?? prev.highestRank,
            lowestRank: stats.lowestRank ?? prev.lowestRank,
            matchEarnings: stats.matchEarnings ?? prev.matchEarnings,
            hostEarnings: stats.hostEarnings ?? prev.hostEarnings,
          }))
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error)
        // Keep default empty stats on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserStats()
  }, [])

  const handleStartGame = () => {
    window.location.href = "/dashboard"
  }

  return (
    <ProtectedRoute>
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Dashboard Background */}
      <div className="absolute inset-0">
        <img
          src="/images/dashboard-background.png"
          alt="Dashboard Background"
          className="object-cover object-center w-full h-full"
        />
      </div>

      <GlobalSidebar showTrigger={false} />
      <TopNavigation />

      {/* Main Content Area */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4 sm:p-6 pt-24">
        <div className="w-full max-w-2xl">
          {/* Statistics Panel */}
          <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-4 sm:p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-green-800 text-center mb-6">Statistics</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-green-800 font-semibold">Loading statistics...</div>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  {/* Matches played */}
                  <div className="bg-green-200/50 rounded-lg p-4 sm:p-5 flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Matches played</p>
                      <p className="text-green-800 text-2xl font-bold">
                        {userStats.matchesPlayed.toString().padStart(3, "0")}
                      </p>
                    </div>
                  </div>
                  {/* Tournament played */}
                  <div className="bg-green-200/50 rounded-lg p-4 sm:p-5 flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Tournament played</p>
                      <p className="text-green-800 text-2xl font-bold">
                        {userStats.tournamentsPlayed.toString().padStart(3, "0")}
                      </p>
                    </div>
                  </div>
                  {/* Win percentage */}
                  <div className="bg-green-200/50 rounded-lg p-4 sm:p-5 flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Win percentage</p>
                      <p className="text-green-800 text-2xl font-bold">{userStats.winPercentage}%</p>
                    </div>
                  </div>
                  {/* Tournament Hosted */}
                  <div className="bg-green-200/50 rounded-lg p-4 sm:p-5 flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Tournament Hosted</p>
                      <p className="text-green-800 text-2xl font-bold">
                        {userStats.tournamentsHosted.toString().padStart(3, "0")}
                      </p>
                    </div>
                  </div>
                  {/* Highest rank */}
                  <div className="bg-green-200/50 rounded-lg p-4 sm:p-5 flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Highest rank</p>
                      <p className="text-green-800 text-2xl font-bold">{userStats.highestRank}</p>
                    </div>
                  </div>
                  {/* Lowest rank */}
                  <div className="bg-green-200/50 rounded-lg p-4 sm:p-5 flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Lowest rank</p>
                      <p className="text-green-800 text-2xl font-bold">{userStats.lowestRank}</p>
                    </div>
                  </div>
                  {/* Match Earnings */}
                  <div className="bg-green-200/50 rounded-lg p-4 sm:p-5 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">₦</span>
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Match Earnings</p>
                      <p className="text-green-800 text-2xl font-bold">{userStats.matchEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                  {/* Host earnings */}
                  <div className="bg-green-200/50 rounded-lg p-4 sm:p-5 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">₦</span>
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Host earnings</p>
                      <p className="text-green-800 text-2xl font-bold">{userStats.hostEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                {/* Start Game Button */}
                <div className="flex flex-col items-center gap-4">
                  <GameButton onClick={handleStartGame} className="w-full sm:w-40 min-h-12">
                    Start a game
                  </GameButton>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}

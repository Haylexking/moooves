"use client"

import { useState, useEffect } from "react"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameButton } from "@/components/ui/game-button"
import { Gamepad2, Trophy, User } from "lucide-react"

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
        // This would be the actual API call to your backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`, // or however you handle auth
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const stats = await response.json()
          setUserStats(stats)
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
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Dashboard Background */}
      <div className="absolute inset-0">
        <img
          src="/images/dashboard-background.png"
          alt="Dashboard Background"
          className="object-cover object-center w-full h-full"
        />
      </div>

      <GlobalSidebar />
      <TopNavigation />

      {/* Main Content Area */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4 pt-24">
        <div className="w-full max-w-2xl">
          {/* Statistics Panel */}
          <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-green-800 text-center mb-6">Statistics</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-green-800 font-semibold">Loading statistics...</div>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Matches played */}
                  <div className="bg-green-200/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Matches played</p>
                      <p className="text-green-800 text-2xl font-bold">
                        {userStats.matchesPlayed.toString().padStart(3, "0")}
                      </p>
                    </div>
                  </div>
                  {/* Tournament played */}
                  <div className="bg-green-200/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Tournament played</p>
                      <p className="text-green-800 text-2xl font-bold">
                        {userStats.tournamentsPlayed.toString().padStart(3, "0")}
                      </p>
                    </div>
                  </div>
                  {/* Win percentage */}
                  <div className="bg-green-200/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Win percentage</p>
                      <p className="text-green-800 text-2xl font-bold">{userStats.winPercentage}%</p>
                    </div>
                  </div>
                  {/* Tournament Hosted */}
                  <div className="bg-green-200/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Tournament Hosted</p>
                      <p className="text-green-800 text-2xl font-bold">
                        {userStats.tournamentsHosted.toString().padStart(3, "0")}
                      </p>
                    </div>
                  </div>
                  {/* Highest rank */}
                  <div className="bg-green-200/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Highest rank</p>
                      <p className="text-green-800 text-2xl font-bold">{userStats.highestRank}</p>
                    </div>
                  </div>
                  {/* Lowest rank */}
                  <div className="bg-green-200/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Lowest rank</p>
                      <p className="text-green-800 text-2xl font-bold">{userStats.lowestRank}</p>
                    </div>
                  </div>
                  {/* Match Earnings */}
                  <div className="bg-green-200/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">₦</span>
                    </div>
                    <div>
                      <p className="text-green-700 text-sm font-medium">Match Earnings</p>
                      <p className="text-green-800 text-2xl font-bold">{userStats.matchEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                  {/* Host earnings */}
                  <div className="bg-green-200/50 rounded-lg p-4 flex items-center gap-3">
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
                  <GameButton onClick={handleStartGame} className="w-32">
                    Start a game
                  </GameButton>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

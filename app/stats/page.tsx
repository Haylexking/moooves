"use client"

import React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Menu,
  X,
  Plus,
  User,
  Settings,
  Gamepad2,
  Trophy,
  BarChart3,
  Wallet,
  HelpCircle,
  LogOut,
  Bell,
} from "lucide-react"
import { GameButton } from "@/components/ui/game-button"

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

const menuItems = [
  { icon: Gamepad2, label: "Play game", href: "/dashboard" },
  { icon: Trophy, label: "Tournament", href: "/tournaments", active: true },
  { icon: BarChart3, label: "Statistics", href: "/stats" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: HelpCircle, label: "Need help", href: "/help" },
  { icon: LogOut, label: "Exit game", href: "/" },
]

export default function StatsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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
      <Image
        src="/images/dashboard-background.png"
        alt="Dashboard Background"
        fill
        className="object-cover object-center z-0"
        priority
      />

      {/* Side Menu */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-sm z-40 transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-2">
          {/* Collapse Button */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-green-100 hover:text-green-800 transition-colors"
          >
            <X className="w-5 h-5" />
            Collapse
          </button>

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => (window.location.href = item.href)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg font-semibold transition-colors ${
                item.active
                  ? "bg-green-200 text-green-800"
                  : "bg-white/90 text-gray-800 hover:bg-green-100 hover:text-green-800"
              }`}
            >
              {React.createElement(item.icon, { className: "w-5 h-5" })}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setIsMenuOpen(false)} />}

      {/* Top Header */}
      <div className="relative z-20 flex items-center justify-between p-4">
        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-green-100 hover:text-green-800 transition-colors shadow-lg"
        >
          <Menu className="w-5 h-5" />
          Menu
        </button>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          {/* Balance */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-lg">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs">₦</span>
            </div>
            100,000
            <Plus className="w-4 h-4" />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-lg">
            <User className="w-5 h-5" />
            USER 002
          </div>

          {/* Notification Bell */}
          <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/90 text-gray-800 hover:bg-white transition-colors shadow-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
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
                <div className="flex justify-center">
                  <GameButton onClick={handleStartGame} className="w-48">
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

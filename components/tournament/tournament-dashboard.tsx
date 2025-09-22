"use client"

import { useState } from "react"
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
  Check,
  ChevronRight,
} from "lucide-react"
import { GameButton } from "@/components/ui/game-button"

type TabType = "leaderboard" | "matches" | "rules"
type TournamentStage = "knockout" | "quarterfinal" | "semifinal" | "final"
type UserTournamentStatus = "not_registered" | "registered_active" | "eliminated" | "completed"

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  score: number
  medal?: "gold" | "silver" | "bronze"
}

interface Match {
  id: string
  player1: string
  player2: string
  winner?: string
  completed: boolean
  stage: TournamentStage
}

export function TournamentDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("leaderboard")
  const [hasTournament, setHasTournament] = useState(false)
  const [userStatus, setUserStatus] = useState<UserTournamentStatus>("not_registered")
  const currentUserId = "002" // Current user ID

  const menuItems = [
    { icon: Gamepad2, label: "Play game", href: "/dashboard" },
    { icon: Trophy, label: "Tournament", href: "/tournaments", active: true },
    { icon: BarChart3, label: "Statistics", href: "/stats" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: HelpCircle, label: "Need help", href: "/help" },
    { icon: LogOut, label: "Exit game", href: "/" },
  ]

  const tournamentMatches: Match[] = [
    // Quarterfinal stage
    { id: "qf1", player1: "004", player2: "001", winner: "004", completed: true, stage: "quarterfinal" },
    { id: "qf2", player1: "010", player2: "003", winner: "010", completed: true, stage: "quarterfinal" },
    { id: "qf3", player1: "010", player2: "003", winner: "010", completed: true, stage: "quarterfinal" },
    { id: "qf4", player1: "005", player2: "007", completed: false, stage: "quarterfinal" },

    // Knockout stage
    { id: "ko1", player1: "005", player2: "001", winner: "005", completed: true, stage: "knockout" },
    { id: "ko2", player1: "010", player2: "008", winner: "010", completed: true, stage: "knockout" },
    { id: "ko3", player1: "004", player2: "008", winner: "004", completed: true, stage: "knockout" },
    { id: "ko4", player1: "002", player2: "003", winner: "002", completed: true, stage: "knockout" },
    { id: "ko5", player1: "005", player2: "007", completed: false, stage: "knockout" },
    { id: "ko6", player1: "005", player2: "007", winner: "005", completed: true, stage: "knockout" },
  ]

  // Mock leaderboard data
  const leaderboardData: LeaderboardEntry[] = [
    { rank: 1, userId: "004", username: "User 004", score: 100, medal: "gold" },
    { rank: 2, userId: "003", username: "User 003", score: 80, medal: "silver" },
    { rank: 3, userId: "001", username: "User 001", score: 60, medal: "bronze" },
    { rank: 4, userId: "010", username: "User 010", score: 40 },
    { rank: 5, userId: "005", username: "User 005", score: 10 },
    { rank: 6, userId: "006", username: "User 006", score: 10 },
    { rank: 7, userId: "007", username: "User 007", score: 10 },
    { rank: 8, userId: "008", username: "User 008", score: 10 },
  ]

  const handleStartTournament = () => {
    // Navigate back to dashboard to start tournament creation
    window.location.href = "/dashboard"
  }

  const handleEnterTournament = () => {
    setUserStatus("registered_active")
    console.log("Entering tournament...")
  }

  const simulateTournamentState = () => {
    setHasTournament(true)
    // Cycle through different user states for demonstration
    const states: UserTournamentStatus[] = ["not_registered", "registered_active", "eliminated", "completed"]
    const currentIndex = states.indexOf(userStatus)
    const nextIndex = (currentIndex + 1) % states.length
    setUserStatus(states[nextIndex])
  }

  const getMatchesByStage = (stage: TournamentStage) => {
    return tournamentMatches.filter((match) => match.stage === stage)
  }

  const isUserInMatch = (match: Match) => {
    return match.player1 === currentUserId || match.player2 === currentUserId
  }

  const getTournamentButton = () => {
    if (!hasTournament) {
      return { text: "Start a tournament", action: handleStartTournament }
    }

    switch (userStatus) {
      case "not_registered":
        return { text: "Enter tournament", action: handleEnterTournament }
      case "registered_active":
        return { text: "Continue tournament", action: () => console.log("Continue tournament") }
      case "eliminated":
        return { text: "View results", action: () => console.log("View results") }
      case "completed":
        return { text: "Tournament completed", action: () => console.log("Tournament completed") }
      default:
        return { text: "Enter tournament", action: handleEnterTournament }
    }
  }

  const renderMatch = (match: Match) => {
    const isUserMatch = isUserInMatch(match)
    const userIsActive = userStatus === "registered_active"

    return (
      <div
        key={match.id}
        className="flex items-center justify-between p-3 bg-green-100/30 rounded-lg border border-green-300/30 mb-2"
      >
        <div className="flex items-center gap-2">
          {match.completed ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Player 1 */}
          <div
            className={`flex items-center gap-2 ${
              isUserMatch && match.player1 === currentUserId && userIsActive
                ? "text-green-600 font-bold"
                : "text-gray-700"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isUserMatch && match.player1 === currentUserId && userIsActive ? "bg-green-600" : "bg-gray-600"
              }`}
            >
              <User className="w-5 h-5 text-white" />
            </div>
            <span>User {match.player1}</span>
          </div>

          <span className="font-bold text-gray-600">VS</span>

          {/* Player 2 */}
          <div
            className={`flex items-center gap-2 ${
              isUserMatch && match.player2 === currentUserId && userIsActive
                ? "text-green-600 font-bold"
                : "text-gray-700"
            }`}
          >
            <span>User {match.player2}</span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isUserMatch && match.player2 === currentUserId && userIsActive ? "bg-green-600" : "bg-gray-600"
              }`}
            >
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">{match.completed && <Check className="w-5 h-5 text-green-600" />}</div>
      </div>
    )
  }

  const getMedalIcon = (medal?: string) => {
    switch (medal) {
      case "gold":
        return "🥇"
      case "silver":
        return "🥈"
      case "bronze":
        return "🥉"
      default:
        return "🏅"
    }
  }

  const getMedalColor = (medal?: string) => {
    switch (medal) {
      case "gold":
        return "text-yellow-600"
      case "silver":
        return "text-gray-500"
      case "bronze":
        return "text-orange-600"
      default:
        return "text-green-600"
    }
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
              onClick={() => {
                if (item.href) {
                  window.location.href = item.href
                }
                setIsMenuOpen(false)
              }}
              className={`flex items-center gap-3 w-full p-3 rounded-lg font-semibold transition-colors ${
                item.active
                  ? "bg-green-200 text-green-800"
                  : "bg-white/90 text-gray-800 hover:bg-green-100 hover:text-green-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
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
        <div className="w-full max-w-4xl">
          {/* Tournament Panel */}
          <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-6 shadow-2xl">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-6">
              <div className="flex bg-green-200/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    activeTab === "leaderboard"
                      ? "bg-green-600 text-white shadow-md"
                      : "text-green-800 hover:bg-green-300/50"
                  }`}
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab("matches")}
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    activeTab === "matches"
                      ? "bg-green-600 text-white shadow-md"
                      : "text-green-800 hover:bg-green-300/50"
                  }`}
                >
                  Matches
                </button>
                {hasTournament && (
                  <button
                    onClick={() => setActiveTab("rules")}
                    className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                      activeTab === "rules"
                        ? "bg-green-600 text-white shadow-md"
                        : "text-green-800 hover:bg-green-300/50"
                    }`}
                  >
                    Rules
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-green-200/30 rounded-lg p-6 min-h-[400px]">
              {activeTab === "leaderboard" && (
                <div>
                  {!hasTournament ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                      <h3 className="text-2xl font-bold text-green-600/60 mb-8">No Data Available</h3>
                      <GameButton onClick={handleStartTournament} className="w-48">
                        Start a tournament
                      </GameButton>
                      <button
                        onClick={simulateTournamentState}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Simulate Tournament
                      </button>
                    </div>
                  ) : (
                    // Leaderboard with Data
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-green-800">Tournament Leaderboard</h3>
                        <div className="flex gap-2">
                          <GameButton onClick={getTournamentButton().action} className="w-40">
                            {getTournamentButton().text}
                          </GameButton>
                          <button
                            onClick={() => setHasTournament(false)}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={simulateTournamentState}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                          >
                            Next State
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {leaderboardData.map((entry) => (
                          <div
                            key={entry.userId}
                            className="flex items-center justify-between p-3 bg-green-100/50 rounded-lg border border-green-300/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`text-2xl ${getMedalColor(entry.medal)}`}>
                                {getMedalIcon(entry.medal)}
                              </div>
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-semibold text-green-800">{entry.username}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-green-800">
                                {entry.score.toString().padStart(3, "0")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "matches" && (
                <div>
                  {!hasTournament ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                      <h3 className="text-2xl font-bold text-green-600/60 mb-8">No Data Available</h3>
                      <GameButton onClick={handleStartTournament} className="w-48">
                        Start a tournament
                      </GameButton>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Quarterfinal Stage */}
                      {getMatchesByStage("quarterfinal").length > 0 && (
                        <div>
                          <h4 className="text-lg font-bold text-green-800 mb-4 text-center">Quarterfinal stage</h4>
                          <div className="space-y-2">{getMatchesByStage("quarterfinal").map(renderMatch)}</div>
                        </div>
                      )}

                      {/* Knockout Stage */}
                      {getMatchesByStage("knockout").length > 0 && (
                        <div>
                          <h4 className="text-lg font-bold text-green-800 mb-4 text-center">Knockout stage</h4>
                          <div className="space-y-2">{getMatchesByStage("knockout").map(renderMatch)}</div>
                        </div>
                      )}

                      {/* Tournament Action Button */}
                      <div className="flex justify-center mt-6">
                        <GameButton onClick={getTournamentButton().action} className="w-48">
                          {getTournamentButton().text}
                        </GameButton>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "rules" && hasTournament && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-green-800 text-center">Tournament Rules</h3>

                  <div className="space-y-4">
                    <div className="bg-green-100/50 rounded-lg p-4">
                      <h4 className="font-bold text-green-800 mb-2">Entry Requirements</h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• Minimum entry fee: ₦500 per player</li>
                        <li>• Minimum 6 players, maximum 50 players</li>
                        <li>• Minimum cash pool: ₦20,000</li>
                      </ul>
                    </div>

                    <div className="bg-green-100/50 rounded-lg p-4">
                      <h4 className="font-bold text-green-800 mb-2">Game Rules</h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• 30x30 grid playing field</li>
                        <li>• 10 minutes per match</li>
                        <li>• Score points by getting 5 in a row</li>
                        <li>• Player with most points wins</li>
                      </ul>
                    </div>

                    <div className="bg-green-100/50 rounded-lg p-4">
                      <h4 className="font-bold text-green-800 mb-2">Cash Distribution</h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• 1st Place: 20% of cash pool</li>
                        <li>• 2nd Place: 12% of cash pool</li>
                        <li>• 3rd Place: 8% of cash pool</li>
                        <li>• Host: 50% of cash pool</li>
                        <li>• Platform: 10% of cash pool</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu, X, Plus, User, Settings, Gamepad2, Trophy, BarChart3, Wallet, HelpCircle, LogOut } from "lucide-react"
import { GameButton } from "@/components/ui/game-button"

type ModalType = "gameRules" | "playerCount" | null
type GameMode = "1v1" | "tournament"

export function GameDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(null)
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<number | null>(null)

  const menuItems = [
    { icon: Gamepad2, label: "Play game", href: "/game" },
    { icon: Trophy, label: "Tournament", href: "/tournaments" },
    { icon: BarChart3, label: "Statistics", href: "/stats" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: HelpCircle, label: "Need help", href: "/help" },
    { icon: LogOut, label: "Exit game", href: "/logout" },
  ]

  const handleStartGame = () => {
    setSelectedGameMode("1v1")
    console.log("Starting 1v1 game...")
  }

  const handleStartTournament = () => {
    setSelectedGameMode("tournament")
    setActiveModal("playerCount")
  }

  const handleGameRules = () => {
    setActiveModal("gameRules")
  }

  const handlePlayerCountSelect = (count: number) => {
    setSelectedPlayerCount(count)
    setActiveModal(null)
    console.log(`Selected ${count} participants for tournament`)
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedGameMode(null)
    setSelectedPlayerCount(null)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* New Dashboard Background */}
      <Image
        src="/images/dashboard-background.png"
        alt="Dashboard Background"
        fill
        className="object-cover object-center z-0"
        priority
      />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20 z-0" />

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
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
            Collapse
          </button>

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-white transition-colors"
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
          onClick={() => setIsMenuOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-white transition-colors shadow-lg"
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

          {/* Settings */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-white transition-colors shadow-lg">
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content Area - Buttons directly on background */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <div className="flex flex-col items-center gap-4">
          {/* Conditional Button Rendering */}
          {selectedGameMode === "1v1" ? (
            // Show "Start game" and "Game rules" when 1v1 is selected
            <>
              <GameButton onClick={() => console.log("Starting game...")} variant="active" className="w-64">
                Start game
              </GameButton>

              <GameButton onClick={handleGameRules} variant="inactive" className="w-64">
                Game rules
              </GameButton>

              {/* Back button */}
              <button
                onClick={() => setSelectedGameMode(null)}
                className="mt-4 text-white/80 hover:text-white text-sm underline"
              >
                ← Back
              </button>
            </>
          ) : (
            // Show initial "Play 1v1" and "Start tournament" options
            <>
              <GameButton onClick={handleStartGame} variant="inactive" className="w-64">
                Play 1v1
              </GameButton>

              <GameButton onClick={handleStartTournament} variant="inactive" className="w-64">
                Start tournament
              </GameButton>
            </>
          )}
        </div>
      </div>

      {/* Game Rules Modal */}
      {activeModal === "gameRules" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-md border-4 border-green-600 relative">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-green-800 text-center">Tournament rules</h2>

              <div className="bg-green-200/50 rounded-lg p-4 min-h-[200px]">
                <textarea
                  placeholder="Enter tournament rules"
                  className="w-full h-full bg-transparent border-none outline-none resize-none text-green-800 placeholder-green-600"
                  rows={8}
                />
              </div>

              <button
                onClick={closeModal}
                className="w-full bg-gradient-to-b from-green-600 to-green-800 text-white font-bold py-3 px-6 rounded-lg hover:from-green-500 hover:to-green-700 transition-all duration-200"
                style={{
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                I agree, continue!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Count Modal */}
      {activeModal === "playerCount" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-sm border-4 border-green-600 relative">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-green-800 text-center">Number of players</h2>
              <p className="text-green-700 text-center text-sm">Select number of players for the tournament</p>

              <div className="space-y-3">
                {[2, 4, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => handlePlayerCountSelect(count)}
                    className={`w-full text-white font-bold text-lg py-3 px-6 rounded-lg transition-all duration-200 ${
                      selectedPlayerCount === count
                        ? "bg-gradient-to-b from-green-500 to-green-700 shadow-lg"
                        : "bg-gradient-to-b from-gray-500 to-gray-700 hover:from-gray-400 hover:to-gray-600"
                    }`}
                    style={{
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                    }}
                  >
                    {count} Participants
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

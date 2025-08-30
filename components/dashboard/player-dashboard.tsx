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
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { GameButton } from "@/components/ui/game-button"

type ModalType =
  | "gameRules"
  | "tournamentRules"
  | "playerCount"
  | "entryFee"
  | "tournamentCreated"
  | "playerVsPlayerCreated"
  | null
type GameMode = "1v1" | "tournament" | null
type GameType = "player-vs-player" | "player-vs-computer" | null

export function PlayerDashboard() {
  const { user } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(null)
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<number | null>(null)
  const [entryFee, setEntryFee] = useState<number>(1000)
  const [tokenAmount, setTokenAmount] = useState<number>(100)
  const [tournamentLink, setTournamentLink] = useState<string>("Moooves.te001")
  const [linkCopied, setLinkCopied] = useState(false)
  const [selectedGameType, setSelectedGameType] = useState<GameType>(null)

  const menuItems = [
    { icon: Gamepad2, label: "Play game", href: "/dashboard" }, // Changed from "/game"
    { icon: Trophy, label: "Tournament", href: "/tournaments" }, // Updated path
    { icon: BarChart3, label: "Statistics", href: "/stats" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: HelpCircle, label: "Need help", href: "/help" },
    { icon: LogOut, label: "Exit game", href: "/" },
  ]

  const handlePlay1v1 = () => {
    setSelectedGameMode("1v1")
  }

  const handleStartTournament = () => {
    setSelectedGameMode("tournament")
    setActiveModal("tournamentRules")
  }

  const handleStartGame = () => {
    if (selectedGameType === "player-vs-player") {
      setActiveModal("playerVsPlayerCreated")
    } else {
      // Start game directly for player vs computer
      console.log("Starting game against computer...")
      // Navigate to battle ground
      window.location.href = "/battle"
    }
  }

  const handleGameRules = () => {
    setActiveModal("gameRules")
  }

  const handleTournamentRulesAgree = () => {
    setActiveModal("playerCount")
  }

  const handlePlayerCountSelect = (count: number) => {
    setSelectedPlayerCount(count)
    setActiveModal("entryFee")
  }

  const handleSetFee = () => {
    setActiveModal("tournamentCreated")
    // Generate tournament link
    setTournamentLink(
      `Moooves.te${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`,
    )
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tournamentLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join my MOOOVES tournament!",
        text: "Join my tournament and compete for prizes!",
        url: `https://moooves.app/join/${tournamentLink}`,
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopyLink()
    }
  }

  const handleBluetoothConnect = () => {
    console.log("Connecting via Bluetooth...")
    // Implement Bluetooth connection logic
  }

  const closeModal = () => {
    setActiveModal(null)
    if (activeModal !== "tournamentCreated") {
      setSelectedGameMode(null)
      setSelectedPlayerCount(null)
    }
  }

  const resetToMain = () => {
    setSelectedGameMode(null)
    setSelectedPlayerCount(null)
    setSelectedGameType(null)
    setActiveModal(null)
  }

  const handleStartPlayerVsPlayerGame = () => {
    closeModal()
    window.location.href = "/battle"
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
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-green-100 hover:text-green-800 transition-colors"
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
        <div className="flex flex-col items-center gap-4">
          {/* Conditional Button Rendering */}
          {selectedGameMode === "1v1" && !selectedGameType ? (
            // Show "Player vs Player" and "Player vs PC" when 1v1 is selected
            <>
              <GameButton onClick={() => setSelectedGameType("player-vs-player")} className="w-64">
                Player vs Player
              </GameButton>

              <GameButton onClick={() => setSelectedGameType("player-vs-computer")} className="w-64">
                Player vs PC
              </GameButton>

              {/* Back button */}
              <button onClick={resetToMain} className="mt-4 text-white/80 hover:text-white text-sm underline">
                ← Back
              </button>
            </>
          ) : selectedGameMode === "1v1" && selectedGameType ? (
            // Show "Start game" and "Game rules" when game type is selected
            <>
              <GameButton onClick={handleStartGame} className="w-64">
                Start game
              </GameButton>

              <GameButton onClick={handleGameRules} className="w-64">
                Game rules
              </GameButton>

              {/* Back button */}
              <button
                onClick={() => setSelectedGameType(null)}
                className="mt-4 text-white/80 hover:text-white text-sm underline"
              >
                ← Back
              </button>
            </>
          ) : selectedGameMode === "tournament" ? (
            // Show "Play 1v1" and "Start tournament" when tournament is selected
            <>
              <GameButton onClick={handlePlay1v1} className="w-64">
                Play 1v1
              </GameButton>

              <GameButton onClick={handleStartTournament} className="w-64">
                Start tournament
              </GameButton>

              {/* Back button */}
              <button onClick={resetToMain} className="mt-4 text-white/80 hover:text-white text-sm underline">
                ← Back
              </button>
            </>
          ) : (
            // Show initial "Play 1v1" and "Start tournament" options
            <>
              <GameButton onClick={handlePlay1v1} className="w-64">
                Play 1v1
              </GameButton>

              <GameButton onClick={() => setSelectedGameMode("tournament")} className="w-64">
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
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-green-800 text-center">Game rules</h2>

              <div className="bg-green-200/50 rounded-lg p-4 min-h-[200px]">
                <div className="text-green-800 text-sm space-y-2">
                  <p>
                    <strong>Objective:</strong> Get 5 in a row (horizontal, vertical, or diagonal) to score points.
                  </p>
                  <p>
                    <strong>Grid:</strong> 30x30 playing field
                  </p>
                  <p>
                    <strong>Time:</strong> 10 minutes per game
                  </p>
                  <p>
                    <strong>Scoring:</strong> Each 5-in-a-row sequence = 1 point
                  </p>
                  <p>
                    <strong>Winner:</strong> Player with most points when time runs out
                  </p>
                </div>
              </div>

              <GameButton onClick={closeModal} className="w-full">
                I understand, let's play!
              </GameButton>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Rules Modal */}
      {activeModal === "tournamentRules" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-md border-4 border-green-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-green-800 text-center underline">Tournament rules</h2>

              <div className="bg-green-200/50 rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-green-800 mb-2">Entry Fee</h3>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• The tournament host sets the entry fee.</li>
                    <li>• Minimum entry fee per player: ₦1,000.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-green-800 mb-2">Tournament Size</h3>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Minimum number of players: 6</li>
                    <li>• Maximum number of players: 50</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-green-800 mb-2">Minimum Prize Pool</h3>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Total entry fees must generate a minimum prize pool of ₦100,000.</li>
                    <li>• The system will automatically calculate and distribute prizes.</li>
                  </ul>
                </div>
              </div>

              <GameButton onClick={handleTournamentRulesAgree} className="w-full">
                I agree, continue!
              </GameButton>
            </div>
          </div>
        </div>
      )}

      {/* Player Count Modal */}
      {activeModal === "playerCount" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-sm border-4 border-green-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-green-800 text-center">Number of players</h2>
              <p className="text-green-700 text-center text-sm">Select number of players for the tournament</p>

              <div className="space-y-3">
                {[2, 4, 10].map((count) => (
                  <GameButton key={count} onClick={() => handlePlayerCountSelect(count)} className="w-full">
                    {count} Participants
                  </GameButton>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entry Fee Modal */}
      {activeModal === "entryFee" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-md border-4 border-green-600 relative">
            <button
              onClick={() => setActiveModal("playerCount")}
              className="absolute top-4 left-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-green-800 text-center underline">Set entry fee</h2>
              <p className="text-green-700 text-center text-sm">
                Enter the participation fee each player must pay to join the tournament
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-green-800 font-semibold mb-2">Entry fee (in naira)</label>
                  <input
                    type="number"
                    min="1000"
                    value={entryFee}
                    onChange={(e) => setEntryFee(Number(e.target.value))}
                    placeholder="Minimum ₦1,000"
                    className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-green-800 font-semibold mb-2">Amount in token</label>
                  <input
                    type="number"
                    min="100"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(Number(e.target.value))}
                    placeholder="Minimum 100"
                    className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <GameButton onClick={handleSetFee} className="w-full">
                  Set fee
                </GameButton>
                <GameButton onClick={() => setActiveModal("playerCount")} className="w-full">
                  Cancel
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Created Modal */}
      {activeModal === "tournamentCreated" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-md border-4 border-green-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">Tournament created!</h2>
                <p className="text-green-700 text-sm">
                  Your tournament has been created successfully, share your link with intended participants
                </p>
              </div>

              <div className="flex gap-2">
                {/* Tournament Link Button */}
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors flex-1"
                >
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  {tournamentLink}
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors"
                >
                  Share
                </button>

                {/* Bluetooth Connect Button */}
                <button
                  onClick={handleBluetoothConnect}
                  className="px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors"
                >
                  Bluetooth connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player vs Player Created Modal */}
      {activeModal === "playerVsPlayerCreated" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-md border-4 border-green-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">Player vs Player created!</h2>
                <p className="text-green-700 text-sm">
                  Your match has been created successfully, share your link with intended player
                </p>
              </div>

              <div className="flex gap-2">
                {/* Match Link Button */}
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors flex-1"
                >
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  {tournamentLink}
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors"
                >
                  Share
                </button>

                {/* Bluetooth Connect Button */}
                <button
                  onClick={handleBluetoothConnect}
                  className="px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors"
                >
                  Bluetooth connect
                </button>
              </div>

              <div className="mt-4">
                <GameButton onClick={handleStartPlayerVsPlayerGame} className="w-full">
                  Start Game
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

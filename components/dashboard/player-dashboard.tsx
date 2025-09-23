"use client"

import { useState } from "react"
import {
  Menu,
  X,
  Plus,
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

type ModalType = string | null
type GameMode = "1v1" | "tournament" | null
type GameType = "player-vs-player" | "player-vs-computer" | null

export function PlayerDashboard() {
  const { user } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(null)
  const [entryFee, setEntryFee] = useState<number>(1000)
  const [participantsCount, setParticipantsCount] = useState<number>(6)
  const [tokenAmount, setTokenAmount] = useState<number>(100)
  const [tournamentLink, setTournamentLink] = useState<string>("Moooves.te001")
  const [linkCopied, setLinkCopied] = useState(false)
  const [selectedGameType, setSelectedGameType] = useState<GameType>(null)
  const [joinTournamentCode, setJoinTournamentCode] = useState<string>("")

  const menuItems = [
    { icon: Gamepad2, label: "Play game", href: "/dashboard" },
    { icon: Trophy, label: "Tournament", href: "/tournaments" },
    { icon: BarChart3, label: "Statistics", href: "/stats" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: HelpCircle, label: "Need help", href: "/help" },
    { icon: LogOut, label: "Exit game", href: "/" },
  ]

  const getUserDisplayName = () => {
    if (!user) return "Guest User"

    // Try to get a short display name from fullName
    const fullName = user.fullName?.trim()
    if (fullName) {
      const nameParts = fullName.split(" ")
      if (nameParts.length >= 2) {
        // Return first name + last initial (e.g., "John D.")
        return `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      }
      // If only one name, return it (up to 10 chars)
      return fullName.length > 10 ? `${fullName.substring(0, 10)}...` : fullName
    }

    // Fallback to email prefix
    const emailPrefix = user.email?.split("@")[0]
    return emailPrefix ? (emailPrefix.length > 8 ? `${emailPrefix.substring(0, 8)}...` : emailPrefix) : "User"
  }

  const getUserInitials = () => {
    if (!user) return "GU"

    const fullName = user.fullName?.trim()
    if (fullName) {
      const nameParts = fullName.split(" ")
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      }
      return fullName.substring(0, 2).toUpperCase()
    }

    // Fallback to email initials
    const emailPrefix = user.email?.split("@")[0]
    return emailPrefix ? emailPrefix.substring(0, 2).toUpperCase() : "U"
  }

  const handlePlay1v1 = () => setSelectedGameMode("1v1")
  const handleStartTournament = () => {
    setSelectedGameMode("tournament")
    setActiveModal("tournamentRules")
  }
  const handleStartGame = () => {
    if (selectedGameType === "player-vs-player") setActiveModal("playerVsPlayerCreated")
    else window.location.href = "/battle"
  }
  const handleGameRules = () => setActiveModal("gameRules")
  const handleTournamentRulesAgree = () => setActiveModal("entryFee")
  const handleSetFee = () => {
    setActiveModal("tournamentCreated")
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
        text: "Join my tournament and compete for cashs!",
        url: `https://moooves.app/join/${tournamentLink}`,
      })
    } else {
      handleCopyLink()
    }
  }
  const handleBluetoothConnect = () => {
    console.log("Connecting via Bluetooth...")
  }
  const closeModal = () => setActiveModal(null)

  return (
    <>
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
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-lg">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs">₦</span>
            </div>
            100,000
            <Plus className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-lg">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {getUserInitials()}
            </div>
            {getUserDisplayName()}
          </div>
          <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/90 text-gray-800 hover:bg-white transition-colors shadow-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <div className="flex flex-col items-center gap-4">
          {selectedGameMode === "1v1" && !selectedGameType ? (
            <>
              <GameButton onClick={() => setSelectedGameType("player-vs-player")} className="w-64">
                Player vs Player
              </GameButton>
              <GameButton onClick={() => setSelectedGameType("player-vs-computer")} className="w-64">
                Player vs PC
              </GameButton>
              <button
                onClick={() => setSelectedGameType(null)}
                className="mt-4 text-white/80 hover:text-white text-sm underline"
              >
                ← Back
              </button>
            </>
          ) : selectedGameMode === "1v1" && selectedGameType ? (
            <>
              <GameButton onClick={handleStartGame} className="w-64">
                Start game
              </GameButton>
              <GameButton onClick={handleGameRules} className="w-64">
                Game rules
              </GameButton>
              <button
                onClick={() => setSelectedGameType(null)}
                className="mt-4 text-white/80 hover:text-white text-sm underline"
              >
                ← Back
              </button>
            </>
          ) : selectedGameMode === "tournament" ? (
            <>
              <GameButton onClick={handlePlay1v1} className="w-64">
                Play 1v1
              </GameButton>
              <GameButton onClick={handleStartTournament} className="w-64">
                Start tournament
              </GameButton>
              <GameButton onClick={() => setActiveModal("joinTournament")} className="w-64">
                Join tournament
              </GameButton>
              <button
                onClick={() => setSelectedGameMode(null)}
                className="mt-4 text-white/80 hover:text-white text-sm underline"
              >
                ← Back
              </button>
            </>
          ) : (
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

      {/* Modals rendered at root */}
      {activeModal === "joinTournament" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-md border-4 border-green-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold text-green-800">Input tournament link or code</h2>
              <p className="text-green-700 text-center text-sm mb-4">Input link to tournament you wish to join</p>
              <div className="flex items-center gap-2 bg-green-200/50 border border-green-300 rounded-lg px-4 py-3">
                <Copy className="w-5 h-5 text-green-700" />
                <input
                  type="text"
                  value={joinTournamentCode}
                  onChange={(e) => setJoinTournamentCode(e.target.value)}
                  placeholder="Moooves.te001"
                  className="flex-1 bg-transparent outline-none text-green-800 font-semibold placeholder-green-600"
                />
                <GameButton
                  onClick={() => {
                    const code = joinTournamentCode.trim().toLowerCase()
                    if (!code || code.length < 8) setActiveModal("invalidLink")
                    else if (code === "filled001") setActiveModal("tournamentFilled")
                    else if (code === "lowbal001") setActiveModal("lowBalance")
                    else if (code === "moooves.te001") setActiveModal("tournamentFound")
                    else setActiveModal("invalidLink")
                  }}
                  className="!bg-green-700 hover:!bg-green-800 text-white px-6 py-2 rounded-lg font-bold"
                >
                  Join tournament
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeModal === "tournamentFilled" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-red-100 to-red-50 rounded-2xl p-8 w-full max-w-md border-4 border-red-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-red-800 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <span className="text-5xl">😞</span>
              <h2 className="text-2xl font-bold text-red-800 text-center">Tournament Filled</h2>
              <p className="text-red-700 text-center text-base mb-4">
                Number of required participants has been reached, find another tournament in our channel
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="https://t.me/moooves"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-900 font-bold border border-blue-300 hover:bg-blue-200 transition-colors"
                >
                  Telegram
                </a>
                <a
                  href="https://wa.me/2340000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-900 font-bold border border-green-300 hover:bg-green-200 transition-colors"
                >
                  Whatsapp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeModal === "lowBalance" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-8 w-full max-w-md border-4 border-green-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <Wallet className="w-12 h-12 text-green-700 mb-2" />
              <h2 className="text-2xl font-bold text-green-800 text-center">Account balance LOW!!</h2>
              <p className="text-green-700 text-center text-base mb-4">
                Please fund your account to successfully join the tournament
              </p>
              <GameButton
                onClick={() => {
                  window.location.href = "/wallet"
                }}
                className="w-full !bg-green-700 hover:!bg-green-800 text-white font-bold"
              >
                Go to wallet
              </GameButton>
            </div>
          </div>
        </div>
      )}
      {activeModal === "invalidLink" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-red-100 to-red-50 rounded-2xl p-8 w-full max-w-md border-4 border-red-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-red-800 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <span className="text-5xl">😞</span>
              <h2 className="text-2xl font-bold text-red-800 text-center">Invalid Link</h2>
              <p className="text-red-700 text-center text-base mb-4">
                The tournament link is invalid, find another tournament in our channel
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="https://t.me/moooves"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-900 font-bold border border-blue-300 hover:bg-blue-200 transition-colors"
                >
                  Telegram
                </a>
                <a
                  href="https://wa.me/2340000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-900 font-bold border border-green-300 hover:bg-green-200 transition-colors"
                >
                  Whatsapp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeModal === "tournamentFound" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-8 w-full max-w-md border-4 border-green-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <Check className="w-12 h-12 text-green-700 mb-2" />
              <h2 className="text-2xl font-bold text-green-800 text-center">Tournament found</h2>
              <p className="text-green-700 text-center text-base mb-4">
                To be eligible for this tournament, the sum of <span className="font-bold">10,000</span> will be paid or
                deducted from your account as entry fee
              </p>
              <GameButton
                onClick={() => {
                  closeModal()
                }}
                className="w-full !bg-green-700 hover:!bg-green-800 text-white font-bold"
              >
                I agree, continue!
              </GameButton>
            </div>
          </div>
        </div>
      )}
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
                    <li>• Minimum entry fee per player: ₦500.</li>
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
                  <h3 className="font-bold text-green-800 mb-2">Minimum Cash Pool</h3>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Total entry fees must generate a minimum cash pool of ₦20,000.</li>
                    <li>• The system will automatically calculate and distribute cashs.</li>
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
      {activeModal === "entryFee" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-md border-4 border-green-600 relative">
            <button
              onClick={closeModal}
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
                <GameButton onClick={closeModal} className="w-full">
                  Cancel
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      )}
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
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors flex-1"
                >
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  {tournamentLink}
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors"
                >
                  Share
                </button>
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
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors flex-1"
                >
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  {tournamentLink}
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={handleBluetoothConnect}
                  className="px-4 py-2 bg-green-200/50 border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-200 transition-colors"
                >
                  Bluetooth connect
                </button>
              </div>
              <div className="mt-4"></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

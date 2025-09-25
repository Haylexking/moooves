"use client"

import { useState } from "react"
import {
  Plus,
  Settings,
  Gamepad2,
  Trophy,
  BarChart3,
  Wallet,
  HelpCircle,
  LogOut,
  Bell,
  Copy,
  Check,
  X,
  ArrowLeft,
} from "lucide-react"
import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/lib/stores/auth-store"
import { GameButton } from "@/components/ui/game-button"


type ModalType = string | null
type GameMode = "1v1" | "tournament" | null
type GameType = "player-vs-player" | "player-vs-computer" | null

export function PlayerDashboard() {
  const { user } = useAuthStore()
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
    if (!user) return "User"
    const username = user.fullName?.trim()
    if (username) {
      return username.length > 16 ? `${username.substring(0, 16)}...` : username
    }
    // Fallback to email prefix
    const emailPrefix = user.email?.split("@")[0]
    return emailPrefix ? (emailPrefix.length > 8 ? `${emailPrefix.substring(0, 8)}...` : emailPrefix) : "User"
  }

  // Avatar: first letter of username or 'U'
  const getUserAvatarLetter = () => {
    if (!user) return "U";
    const username = user.fullName?.trim();
    return username && username.length > 0 ? username[0].toUpperCase() : "U";
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
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-4 font-bold text-lg">
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">{getUserAvatarLetter()}</span>
              {getUserDisplayName()}
            </div>
          </SidebarHeader>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuButton key={item.label} asChild>
                <a href={item.href} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-100">
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
              </SidebarMenuButton>
            ))}
          </SidebarMenu>
        </Sidebar>
        <main className="flex-1 p-4">
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
        </main>
      </div>
      {/* Modals rendered at root */}

      {/* All modals moved here for correct scope */}
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
                >
                  Join
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
      {/* Repeat for all other modals: lowBalance, invalidLink, tournamentFound, gameRules, tournamentRules, entryFee, tournamentCreated, playerVsPlayerCreated, etc. */}
    </SidebarProvider>
  );
}

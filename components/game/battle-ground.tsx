"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Menu, Settings, User, Plus, Bell, Maximize2, Minimize2, Trophy } from "lucide-react"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameScore } from "./game-score"
import { GameResultModal } from "./game-result-modal"
import { useGameStore } from "@/lib/stores/game-store"
import type { Player } from "@/lib/types"
import { useGameTimer } from "@/lib/hooks/use-game-timer"
import { mockOpponentMove } from "@/lib/mocks/mock-opponent"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getUserDisplayName } from "@/lib/utils/display-name"

interface BattleGroundProps {
  player1?: string
  player2?: string
  gameMode?: "player-vs-player" | "player-vs-computer"
  onMoveMade?: (row: number, col: number, byPlayer: Player) => void
}

export function BattleGround({
  player1 = "User",
  player2 = "COMPUTER",
  gameMode = "player-vs-computer",
  onMoveMade,
}: BattleGroundProps) {
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [resultType, setResultType] = useState<"win" | "lose" | "draw">("lose")
  const [expanded, setExpanded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const board = useGameStore((state) => state.board)
  const currentPlayer = useGameStore((state) => state.currentPlayer)
  const gameStatus = useGameStore((state) => state.gameStatus)
  const scores = useGameStore((state) => state.scores)
  const makeMove = useGameStore((state) => state.makeMove)
  const initializeGame = useGameStore((state) => state.initializeGame)
  const usedSequences = useGameStore((state) => state.usedSequences)
  const setCurrentPlayer = useGameStore((state) => state.setCurrentPlayer)
  const switchPlayer = useGameStore((state) => state.switchPlayer)
  const { timeLeft, startTimer, stopTimer, resetTimer } = useGameTimer(10 * 60) // 10 minutes
  const { user } = useAuthStore()

  useEffect(() => {
    // Initialize game when component mounts
    initializeGame("timed")
  }, [initializeGame])

  // Show result modal on game end
  useEffect(() => {
    if (gameStatus === "completed") {
      // For player-vs-computer, X is human, O is computer
      if (scores.X > scores.O) {
        setResultType("win")
      } else if (scores.X < scores.O) {
        setResultType("lose")
      } else {
        setResultType("draw")
      }
      setResultModalOpen(true)
    } else {
      setResultModalOpen(false)
    }
  }, [gameStatus, scores])

  useEffect(() => {
    if (gameStatus === "playing") {
      startTimer()
    } else {
      stopTimer()
    }
  }, [gameStatus, startTimer, stopTimer])

  // Auto-end game when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && gameStatus === "playing") {
      useGameStore.getState().endGame()
    }
  }, [timeLeft, gameStatus])

  // Computer opponent logic - NOW PASSES USED SEQUENCES
  useEffect(() => {
    if (gameMode === "player-vs-computer" && currentPlayer === "O" && gameStatus === "playing") {
      const computerMoveTimer = setTimeout(() => {
        // Pass used sequences and current scores to prevent reusing sequences
        const computerMove = mockOpponentMove(board, "O", usedSequences, scores)
        if (computerMove) {
          console.log("🤖 Computer making move:", computerMove, "Used sequences:", usedSequences.length)
          makeMove(computerMove[0], computerMove[1])
        }
      }, 1000) // 1 second delay for better UX

      return () => clearTimeout(computerMoveTimer)
    }
  }, [currentPlayer, gameStatus, gameMode, board, makeMove, usedSequences, scores])

  const handleCellClick = (index: number) => {
    if (gameStatus !== "playing") return

    const row = Math.floor(index / 30)
    const col = index % 30

    if (board[row][col] !== null) return

    // For player vs computer, only allow human player (X) to make moves directly
    if (gameMode === "player-vs-computer" && currentPlayer !== "X") {
      return
    }

    // Capture who is making the move before state switches
    const moveBy: Player = currentPlayer
    makeMove(row, col)
    if (onMoveMade) {
      onMoveMade(row, col, moveBy)
    }
  }

  const handlePlay = () => {
    if (gameStatus === "waiting") {
      useGameStore.getState().startGame("timed")
      // Ensure human player starts first in player vs computer mode
      if (gameMode === "player-vs-computer") {
        setCurrentPlayer("X")
      }
    }
  }

  const getCellContent = (index: number) => {
    const row = Math.floor(index / 30)
    const col = index % 30
    return board[row][col]
  }

  const isCellUsed = (index: number) => {
    const row = Math.floor(index / 30)
    const col = index % 30
    return usedSequences.some((sequence) => sequence.some(([r, c]) => r === row && c === col))
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleGameRules = () => {
    console.log("Show game rules")
  }

  const menuItems = [
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Trophy, label: "Tournament", href: "/tournaments" }, // Added tournament link
    { icon: Settings, label: "Settings", href: "/settings" },
    { label: "Back to Dashboard", href: "/dashboard" },
    { label: "Exit Game", href: "/" },
  ]

  const displayUsername = user ? getUserDisplayName(user) : "Unknown Player"

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <GlobalSidebar />
      <TopNavigation username={displayUsername} balance={0} />
      {/* Match Result Modal */}
  <GameResultModal open={resultModalOpen} onClose={() => setResultModalOpen(false)} result={resultType} scoreX={scores.X} scoreO={scores.O} />
      {/* Dashboard Background */}
      <Image
        src="/images/dashboard-background.png"
        alt="Dashboard Background"
        fill
        className="object-cover object-center z-0"
        priority
      />



      {/* Expand/Collapse Button */}
      <div className="absolute top-20 left-4 z-20">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-green-100 hover:text-green-800 transition-colors shadow-lg"
        >
          {expanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>


      {/* Scoreboard - now above the board and closer, with responsive margin */}
      <div className="w-full flex justify-center mt-2 mb-2 sm:mt-4 sm:mb-4">
  {/* Scoreboard */}
        <GameScore
          player1={player1}
          player2={player2}
          scoreX={scores.X}
          scoreO={scores.O}
          currentPlayer={currentPlayer}
          gameStatus={gameStatus}
          gameMode={gameMode}
        />
      </div>

      {/* Game Board - Fixed 30x30 Grid */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)] p-2 sm:p-4">
        <div className="relative">
          {/* 30x30 Grid Container */}
          <div
            className={`bg-green-200/80 border-4 border-green-800 rounded-lg overflow-auto ${expanded
                ? "w-[90vw] h-[90vw] max-w-[800px] max-h-[800px]"
                : "w-[95vw] h-[60vw] max-w-[600px] max-h-[600px] sm:w-[70vw] sm:h-[70vw]"
              }`}
          >
            {/* Actual 30x30 Grid */}
            <div
              className="grid gap-0 p-1 min-w-full min-h-full"
              style={{
                gridTemplateColumns: "repeat(30, minmax(0, 1fr))",
                gridTemplateRows: "repeat(30, minmax(0, 1fr))",
              }}
            >
              {Array.from({ length: 900 }, (_, index) => {
                const cellContent = getCellContent(index)
                const isUsed = isCellUsed(index)

                return (
                  <div
                    key={index}
                    className={`
                      border border-green-700/30 bg-green-100/50 hover:bg-green-200/70 
                      cursor-pointer transition-colors flex items-center justify-center 
                      text-xs font-bold aspect-square min-h-0 min-w-0
                      ${isUsed ? "bg-green-300/70" : ""}
                      ${gameMode === "player-vs-computer" && currentPlayer === "O" ? "cursor-not-allowed opacity-50" : ""}
                    `}
                    onClick={() => handleCellClick(index)}
                    style={{
                      fontSize: expanded ? "10px" : "8px",
                    }}
                  >
                    {cellContent && (
                      <span
                        className={`${cellContent === "X" ? "text-blue-600" : "text-red-600"
                          } ${isUsed ? "line-through" : ""}`}
                      >
                        {cellContent}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel - Responsive: column on mobile, row on desktop */}
      <div className="w-full flex justify-center mt-4">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-white font-bold w-full max-w-[95vw] sm:max-w-fit">
          {/* Scoreboard (Player vs Player/Computer Display) */}
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <span className="text-blue-400">{displayUsername} (X)</span>
            <span>VS</span>
            <span className="text-red-400">{player2} (O)</span>
          </div>

          {/* Buttons and Timer - stack on mobile */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Game Rules Button */}
            <button
              onClick={handleGameRules}
              className="px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors w-full sm:w-auto"
            >
              GAME RULES
            </button>

            {/* Play Button */}
            <button
              onClick={handlePlay}
              disabled={gameStatus === "playing"}
              className={`px-6 py-2 font-bold rounded-lg transition-colors w-full sm:w-auto ${gameStatus === "playing"
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
                }`}
            >
              {gameStatus === "playing" ? "PLAYING" : "PLAY"}
            </button>

            {/* Timer */}
            <div
              className={`px-4 py-2 font-bold rounded-lg w-full sm:w-auto text-center ${timeLeft < 60 ? "bg-red-500 text-white" : "bg-gray-600 text-white"
                }`}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

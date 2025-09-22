"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Menu, Settings, User, Plus, Bell, Maximize2, Minimize2, Trophy } from "lucide-react"
import { GameScore } from "./game-score"
import { MatchResultModal } from "./match-result-modal"
import { useGameStore } from "@/lib/stores/game-store"
import type { Player } from "@/lib/types"
import { useGameTimer } from "@/lib/hooks/use-game-timer"
import { mockOpponentMove } from "@/lib/mocks/mock-opponent"

interface BattleGroundProps {
  player1?: string
  player2?: string
  gameMode?: "player-vs-player" | "player-vs-computer"
  onMoveMade?: (row: number, col: number, byPlayer: Player) => void
}
export function BattleGround({
  player1 = "USER 002",
  player2 = "COMPUTER",
  gameMode = "player-vs-computer",
  onMoveMade,
}: BattleGroundProps) {
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [resultType, setResultType] = useState<"win" | "lose">("lose")
  const [expanded, setExpanded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const {
    board,
    currentPlayer,
    gameStatus,
    scores,
    makeMove,
    initializeGame,
    usedSequences,
    setCurrentPlayer,
    switchPlayer,
  } = useGameStore()
  const { timeLeft, startTimer, stopTimer, resetTimer } = useGameTimer(10 * 60) // 10 minutes

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
      } else {
        setResultType("lose")
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Match Result Modal */}
      <MatchResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={resultType}
      />
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
        className={`fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-sm z-40 transform transition-transform duration-300 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-4 space-y-2">
          {/* Collapse Button */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-green-100 hover:text-green-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
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
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-green-100 hover:text-green-800 transition-colors"
            >
              {item.icon && <item.icon className="w-5 h-5" />}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setIsMenuOpen(false)} />}

      {/* Top Header */}
      <div className="relative z-20 flex items-center justify-between p-4">
        {/* Menu Button - NOW FUNCTIONAL */}
        <button
          onClick={() => setIsMenuOpen(true)}
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
          <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/90 text-gray-800 hover:bg-green-100 hover:text-green-800 transition-colors shadow-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

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

      {/* Game Board - Fixed 30x30 Grid */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="relative">
          {/* 30x30 Grid Container */}
          <div
            className={`bg-green-200/80 border-4 border-green-800 rounded-lg overflow-auto ${expanded
              ? "w-[90vw] h-[90vw] max-w-[800px] max-h-[800px]"
              : "w-[70vw] h-[70vw] max-w-[600px] max-h-[600px]"
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

      {/* Score Panel - now above the board */}
      <div className="w-full flex justify-center mt-4">
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

  {/* Control Buttons - below the board */}
      <div className="w-full flex justify-center gap-4 mt-4">
        <button
          onClick={handleGameRules}
          className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors"
        >
          GAME RULES
        </button>
        <button
          onClick={handlePlay}
          disabled={gameStatus === "playing"}
          className={`px-8 py-2 font-bold rounded-lg transition-colors ${gameStatus === "playing"
            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
            }`}
        >
          {gameStatus === "playing" ? "PLAYING" : "PLAY"}
        </button>
        <div
          className={`px-6 py-2 font-bold rounded-lg ${timeLeft < 60 ? "bg-red-500 text-white" : "bg-gray-600 text-white"
            }`}
        >
          {formatTime(timeLeft)}
        </div>
      </div>
    </div>
  )
}

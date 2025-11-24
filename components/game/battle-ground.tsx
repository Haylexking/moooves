"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Menu, User, Plus, Bell, Maximize2, Minimize2, Trophy } from "lucide-react"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { useGameRules } from './GameRulesProvider'
import { TopNavigation } from "@/components/ui/top-navigation"
import { GameScore } from "./game-score"
import StartGameModal from "@/components/ui/start-game-modal"
import { GameResultModal } from "./game-result-modal"
import { useGameStore } from "@/lib/stores/game-store"
import { Cell } from "./cell"
import type { Player } from "@/lib/types"
import { useGameTimer } from "@/lib/hooks/use-game-timer"
import { GameStartAlert } from "@/components/game/game-start-alert"
import { mockOpponentMove } from "@/lib/mocks/mock-opponent"
import { logDebug } from '@/lib/hooks/use-debug-logger'
import { logDebug as log } from '@/lib/logger'
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from 'next/navigation'
import { getUserDisplayName } from "@/lib/utils/display-name"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import { toast } from "@/hooks/use-toast"

interface BattleGroundProps {
  player1?: string
  player2?: string
  gameMode?: "player-vs-player" | "player-vs-computer"
  /** localMode: 'ai' = vs computer, 'p2p' = nearby multiplayer, 'tournament' = online tournament */
  localMode?: 'ai' | 'p2p' | 'tournament'
  onMoveMade?: (row: number, col: number, byPlayer: Player) => void
  connectionType?: string | undefined
  matchId?: string
}

export function BattleGround({
  player1 = "User",
  player2 = "COMPUTER",
  gameMode = "player-vs-computer",
  localMode,
  onMoveMade,
  matchId,
}: BattleGroundProps) {
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [resultType, setResultType] = useState<"win" | "lose" | "draw">("lose")
  const [expanded, setExpanded] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)
  const { openRules } = useGameRules()
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
  const matchRoom = useMatchRoom()
  const serverAuthoritative = useGameStore((s) => s.serverAuthoritative)
  const [pendingMove, setPendingMove] = useState(false)
  const [showGameStartAlert, setShowGameStartAlert] = useState(true)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [waitingTimer, setWaitingTimer] = useState(15 * 60) // 15 minutes in seconds
  const [winByDefault, setWinByDefault] = useState(false)

  // Retry sync handler: fetch authoritative match state and apply to store
  const handleRetrySync = async () => {
    try {
      if (!matchRoom.roomId) {
        toast({ title: "Sync failed", description: "No active room to sync.", variant: "destructive" })
        return
      }
      const data = await matchRoom.getRoomDetails(matchRoom.roomId)
      if (data) {
        const gs = useGameStore.getState?.()
        if (gs && gs.applyServerMatchState) {
          gs.applyServerMatchState(data)
        }
        toast({ title: "Synced", description: "Match state updated.", variant: "default" })
      }
    } catch (err) {
      toast({ title: "Sync failed", description: String(err), variant: "destructive" })
    }
  }

  useEffect(() => {
    // Initialize game when component mounts
    if (matchId) {
      // If matchId is provided, we might need to join the room or fetch state
      // For now, we'll just initialize the game locally
      initializeGame("timed")

      // Check for opponent presence
      if (localMode === 'tournament') {
        setWaitingForOpponent(true)
        // Poll for room details to check participants
        const interval = setInterval(async () => {
          if (matchRoom.roomId) {
            const details = await matchRoom.getRoomDetails(matchRoom.roomId)
            if (details && details.participants && details.participants.length >= 2) {
              setWaitingForOpponent(false)
              clearInterval(interval)
            }
          }
        }, 5000)
        return () => clearInterval(interval)
      }
    } else {
      initializeGame("timed")
    }
  }, [initializeGame, matchId, localMode, matchRoom.roomId])

  // Waiting timer logic
  useEffect(() => {
    if (waitingForOpponent && waitingTimer > 0) {
      const timer = setInterval(() => {
        setWaitingTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (waitingForOpponent && waitingTimer === 0) {
      // Timer expired, user wins by default
      setWinByDefault(true)
      setWaitingForOpponent(false)
      // In a real app, we would call an API to claim the win here
      toast({ title: "Opponent timed out", description: "You win by default!", variant: "default" })
    }
  }, [waitingForOpponent, waitingTimer])

  // Manage focus when overlay appears/disappears
  useEffect(() => {
    if (pendingMove && serverAuthoritative) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null
      // focus the overlay panel
      const panel = overlayRef.current?.querySelector('[tabindex="-1"]') as HTMLElement | null
      if (panel) panel.focus()
    } else {
      // restore previous focus
      previousActiveElementRef.current?.focus()
      previousActiveElementRef.current = null
    }
  }, [pendingMove, serverAuthoritative])

  // Show result modal on game end and submit result if tournament match
  useEffect(() => {
    if (gameStatus === "completed") {
      // For player-vs-computer, X is human, O is computer
      let result: "win" | "lose" | "draw" = "draw"
      if (scores.X > scores.O) {
        result = "win"
      } else if (scores.X < scores.O) {
        result = "lose"
      }

      setResultType(result)
      setResultModalOpen(true)

      // Submit result if this is a tournament match
      if (matchId && user) {
        const winnerId = result === "win" ? user.id : (result === "lose" ? "opponent" : "draw")
        // In a real implementation, we'd have the opponent's ID
        // For now, we'll just log it or call the API if we had the opponent ID

        // apiClient.submitMatchResult(matchId, winnerId)
        console.log("Submitting match result:", { matchId, winnerId })
      }
    } else {
      setResultModalOpen(false)
    }
  }, [gameStatus, scores, matchId, user])

  useEffect(() => {
    if (gameStatus === "playing") {
      startTimer()
    } else {
      stopTimer()
    }
  }, [gameStatus, startTimer, stopTimer])

  // Map localMode to internal behavior: ai => player-vs-computer, p2p => player-vs-player (local non-authoritative)
  useEffect(() => {
    if (localMode === 'ai') {
      // ensure AI mode
      setCurrentPlayer('X')
      useGameStore.setState({ serverAuthoritative: false })
    } else if (localMode === 'p2p') {
      useGameStore.setState({ serverAuthoritative: false })
      // ensure player-vs-player
      // no-op: consuming code can pass gameMode prop if needed
    } else if (localMode === 'tournament') {
      // tournament uses server-authoritative when available
      useGameStore.setState({ serverAuthoritative: true })
    }
  }, [localMode, setCurrentPlayer])

  // Auto-end game when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && gameStatus === "playing") {
      useGameStore.getState().endGame()
    }
  }, [timeLeft, gameStatus])
  useEffect(() => {
    if (gameMode === "player-vs-computer" && currentPlayer === "O" && gameStatus === "playing") {
      const timer = setTimeout(() => {
        const runComputation = () => {
          const computerMove = mockOpponentMove(board, "O", usedSequences, scores)
          if (computerMove) {
            makeMove(computerMove[0], computerMove[1])
          }
        }

        if (typeof window !== "undefined" && (window as any).requestIdleCallback) {
          (window as any).requestIdleCallback(runComputation, { timeout: 300 })
        } else {
          requestAnimationFrame(runComputation)
        }
      }, 600) // ~0.6s delay feels responsive but natural

      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameStatus, gameMode, board, makeMove, usedSequences, scores])

  const handleCellClick = async (index: number) => {
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
    if (serverAuthoritative) {
      // Prevent duplicate submissions while waiting for server
      if (pendingMove) return
      setPendingMove(true)
      try {
        const move = {
          player: currentPlayer,
          position: [row, col] as [number, number],
          row,
          col,
          timestamp: Date.now(),
          sequencesScored: 0,
        }
        await matchRoom.makeMove(move)
        // Server will send authoritative match state which gets applied in useMatchRoom
      } catch (err) {
        log('BattleGround', { event: 'server-move-failed', error: String(err) })
        // Show toast to user with error reason if available
        const message = err && typeof err === "object" && "message" in err ? (err as any).message : String(err)
        toast({
          title: "Move failed",
          description: message || "Server rejected the move. Please try again.",
          variant: "destructive",
          action: (
            <button
              onClick={() => handleRetrySync()}
              className="ml-2 inline-flex items-center rounded-md bg-white/5 px-3 py-1 text-sm font-semibold text-white"
            >
              Retry
            </button>
          ),
        })
      } finally {
        setPendingMove(false)
      }
    } else {
      makeMove(row, col)
      if (onMoveMade) {
        onMoveMade(row, col, moveBy)
      }
    }
  }

  const handlePlay = () => {
    if (gameStatus === "waiting") {
      // Open modal rather than auto-starting in some flows
      if (gameMode === "player-vs-computer") {
        useGameStore.getState().startGame("timed")
        // Ensure human player starts first in player vs computer mode
        setCurrentPlayer("X")
      } else {
        // For other modes, show modal to let user pick online/offline
        setShowStartModal(true)
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
    openRules()
  }

  const displayUsername = user ? getUserDisplayName(user) : "Unknown Player"

  return (
    <div className="relative min-h-screen w-full overflow-hidden pt-20 sm:pt-24">
      {/* Heads-up alert about known scoring bug fix in progress */}
      <GameStartAlert open={showGameStartAlert} onContinue={() => setShowGameStartAlert(false)} />
      {localMode && localMode !== 'ai' && (
        <StartGameModal open={showStartModal} onOpenChange={(v) => setShowStartModal(v)} />
      )}
      {/* Waiting for Opponent Overlay */}
      {waitingForOpponent && !winByDefault && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-green-500 rounded-2xl p-8 text-center max-w-md mx-4 shadow-2xl shadow-green-500/20">
            <div className="animate-pulse mb-6">
              <User className="w-16 h-16 text-gray-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Waiting for Opponent</h2>
            <p className="text-gray-400 mb-6">Your opponent has 15 minutes to join the match.</p>

            <div className="bg-black/40 rounded-lg p-4 border border-gray-800 mb-6">
              <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Time Remaining</div>
              <div className={`text-3xl font-mono font-bold ${waitingTimer < 60 ? "text-red-500" : "text-green-400"}`}>
                {Math.floor(waitingTimer / 60)}:{(waitingTimer % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <p className="text-xs text-gray-500">
              If they don't show up, you will win by default.
            </p>
          </div>
        </div>
      )}

      {/* Win By Default Overlay */}
      {winByDefault && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-green-500 rounded-2xl p-8 text-center max-w-md mx-4 shadow-2xl shadow-green-500/20">
            <div className="mb-6">
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">You Win!</h2>
            <p className="text-green-400 text-lg mb-6">Opponent failed to show up.</p>

            <button
              onClick={() => {
                // Navigate back to tournament dashboard
                const router = useRouter() // This hook needs to be available or passed down
                // For now, we'll assume the parent handles navigation or we reload
                window.location.href = `/tournaments/${matchId?.split('_')[0] || ''}` // simplistic fallback
              }}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Pending move overlay */}
      {pendingMove && serverAuthoritative && (
        <div
          ref={overlayRef}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40"
          role="status"
          aria-live="assertive"
        >
          <div
            className="p-4 rounded-lg bg-white/90 shadow-lg"
            tabIndex={-1}
            ref={(el) => {
              if (el) el.focus()
            }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-800" />
            <div className="text-center text-sm mt-2">Waiting for server...</div>
          </div>
        </div>
      )}
      <GlobalSidebar showTrigger={false} />
      <TopNavigation username={displayUsername} />
      {/* Match Result Modal */}
      <GameResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        onPlayAgain={() => {
          // Restart the timed game
          useGameStore.getState().startGame("timed")
          setResultModalOpen(false)
        }}
        onBackToMenu={() => {
          // Close modal and navigate back to dashboard using Next router
          setResultModalOpen(false)
          const router = useRouter()
          router.push('/dashboard')
        }}
        result={resultType}
        scoreX={scores.X}
        scoreO={scores.O}
      />
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
            className={`bg-white border-4 border-green-800 rounded-lg overflow-auto ${expanded
              ? "w-[95vw] h-[95vw] max-w-[800px] max-h-[800px]"
              : "w-[95vw] h-[95vw] max-w-[600px] max-h-[600px] sm:w-[70vw] sm:h-[70vw]"
              } ${serverAuthoritative && pendingMove ? "pointer-events-none opacity-60" : ""} ${showGameStartAlert ? "pointer-events-none opacity-60" : ""}`}
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
                const row = Math.floor(index / 30)
                const col = index % 30

                return (
                  <div key={index} style={{ fontSize: expanded ? "10px" : "8px" }}>
                    <Cell
                      value={cellContent}
                      onClick={() => {
                        if (serverAuthoritative && pendingMove) return
                        handleCellClick(index)
                      }}
                      disabled={gameMode === "player-vs-computer" && currentPlayer === "O"}
                      row={row}
                      col={col}
                      isHighlighted={false}
                      isUsed={isUsed}
                    />
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
          <div className="flex items-center gap-4 mb-2 sm:mb-0 text-white font-bold">
            <div className="flex items-center gap-2">
              <span className="text-blue-300 truncate max-w-[100px] sm:max-w-[150px]">{displayUsername}</span>
              <span className="text-xs text-blue-200">(X)</span>
              <span className="ml-2 text-2xl">{scores.X}</span>
            </div>

            <div className="text-2xl">:</div>

            <div className="flex items-center gap-2">
              <span className="text-2xl">{scores.O}</span>
              <span className="text-xs text-red-200">(O)</span>
              <span className="text-red-300 ml-2">{player2}</span>
            </div>
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

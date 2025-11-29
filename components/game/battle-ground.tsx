"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { User, Trophy, Info, RefreshCw } from "lucide-react"
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
import { MobileControls } from "@/components/game/mobile-controls"
import { mockOpponentMove } from "@/lib/mocks/mock-opponent"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from 'next/navigation'
import { getUserDisplayName } from "@/lib/utils/display-name"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api/client"

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
  const [showStartModal, setShowStartModal] = useState(false)
  const { openRules } = useGameRules()
  const board = useGameStore((state) => state.board)
  const currentPlayer = useGameStore((state) => state.currentPlayer)
  const gameStatus = useGameStore((state) => state.gameStatus)
  const scores = useGameStore((state) => state.scores)
  const makeMove = useGameStore((state) => state.makeMove)
  const initializeGame = useGameStore((state) => state.initializeGame)
  const usedSequences = useGameStore((state) => state.usedSequences)
  const setCurrentPlayer = useGameStore((state) => state.setCurrentPlayer)
  const cursorPosition = useGameStore((state) => state.cursorPosition)
  const setCursorPosition = useGameStore((state) => state.setCursorPosition)
  const { timeLeft, startTimer, stopTimer } = useGameTimer(10 * 60) // 10 minutes
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
  const router = useRouter()

  useEffect(() => {
    // Initialize game when component mounts
    if (matchId) {
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
      setWinByDefault(true)
      setWaitingForOpponent(false)
      toast({ title: "Opponent timed out", description: "You win by default!", variant: "default" })
    }
  }, [waitingForOpponent, waitingTimer])

  // Manage focus when overlay appears/disappears
  useEffect(() => {
    if (pendingMove && serverAuthoritative) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null
      const panel = overlayRef.current?.querySelector('[tabindex="-1"]') as HTMLElement | null
      if (panel) panel.focus()
    } else {
      previousActiveElementRef.current?.focus()
      previousActiveElementRef.current = null
    }
  }, [pendingMove, serverAuthoritative])

  // Show result modal on game end and submit result if tournament match
  useEffect(() => {
    if (gameStatus === "completed") {
      let result: "win" | "lose" | "draw" = "draw"
      if (scores.X > scores.O) {
        result = "win"
      } else if (scores.X < scores.O) {
        result = "lose"
      }

      setResultType(result)
      setResultModalOpen(true)

      if (matchId && user) {
        const winnerId = result === "win" ? user.id : (result === "lose" ? "opponent" : "draw")
        apiClient.submitMatchResult(matchId, winnerId)
          .then(res => {
            if (!res.success) {
              toast({ title: "Error", description: "Failed to submit match result", variant: "destructive" })
            }
          })
          .catch(err => {
            console.error("Error submitting result:", err)
          })
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

  // Map localMode to internal behavior
  useEffect(() => {
    if (localMode === 'ai') {
      setCurrentPlayer('X')
      useGameStore.setState({ serverAuthoritative: false })
    } else if (localMode === 'p2p') {
      useGameStore.setState({ serverAuthoritative: false })
    } else if (localMode === 'tournament') {
      useGameStore.setState({ serverAuthoritative: true })
    }
  }, [localMode, setCurrentPlayer])

  // Auto-end game when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && gameStatus === "playing") {
      useGameStore.getState().endGame()
    }
  }, [timeLeft, gameStatus])

  // AI Logic
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
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [gameMode, currentPlayer, gameStatus, board, usedSequences, scores, makeMove])

  const executeMove = async (row: number, col: number) => {
    if (board[row][col] !== null) return
    if (gameMode === "player-vs-computer" && currentPlayer !== "X") return
    if (serverAuthoritative && pendingMove) return

    // Optimistic update: Apply move locally immediately
    makeMove(row, col)
    onMoveMade?.(row, col, currentPlayer)

    if (serverAuthoritative && matchId) {
      // Don't set pendingMove to true to avoid blocking UI (spinner)
      // setPendingMove(true) 

      try {
        const res = await apiClient.makeMove(matchId, { row, col, player: currentPlayer })
        if (!res.success) {
          // Revert move on failure (simple reload or undo logic could be added here)
          // For now, we just show error and maybe force a re-sync if possible
          toast({ title: "Move failed", description: res.error, variant: "destructive" })

          // Force re-fetch of room details to sync state
          const idToFetch = matchRoom.roomId || matchId
          if (idToFetch) {
            try {
              const details = await matchRoom.getRoomDetails(idToFetch)
              if (details) {
                useGameStore.getState().applyServerMatchState?.(details.match || details)
              }
            } catch (e) {
              console.error("Failed to sync state after error", e)
            }
          }
        }
      } catch (err) {
        toast({ title: "Connection Error", description: "Failed to send move to server.", variant: "destructive" })
        // Force re-fetch
        const idToFetch = matchRoom.roomId || matchId
        if (idToFetch) {
          try {
            const details = await matchRoom.getRoomDetails(idToFetch)
            if (details) {
              useGameStore.getState().applyServerMatchState?.(details.match || details)
            }
          } catch (e) {
            console.error("Failed to sync state after error", e)
          }
        }
      }
    }
  }

  const handleCellClick = (index: number) => {
    const row = Math.floor(index / 30)
    const col = index % 30

    // Direct placement for mouse interaction
    executeMove(row, col)
    setCursorPosition([row, col])
  }

  const handlePlay = () => {
    if (gameMode === "player-vs-computer") {
      initializeGame("ai")
      setCurrentPlayer("X")
    } else {
      setShowStartModal(true)
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

  const displayUsername = user ? getUserDisplayName(user) : "Unknown Player"

  return (
    <div className="relative min-h-screen w-full overflow-hidden pt-20 sm:pt-24 bg-gray-50">
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
                if (matchId) {
                  const tournamentId = matchId.split('_')[0]
                  window.location.href = `/tournaments/${tournamentId}`
                } else {
                  window.location.href = '/dashboard'
                }
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
          <div className="p-4 rounded-lg bg-white/90 shadow-lg" tabIndex={-1}>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-800" />
            <div className="text-center text-sm mt-2">Waiting for server...</div>
          </div>
        </div>
      )}

      <GlobalSidebar showTrigger={false} />
      <TopNavigation username={displayUsername} />

      <GameResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        onPlayAgain={() => {
          useGameStore.getState().initializeGame("timed")
          setResultModalOpen(false)
        }}
        onBackToMenu={() => {
          setResultModalOpen(false)
          router.push('/dashboard')
        }}
        result={resultType}
        scoreX={scores.X}
        scoreO={scores.O}
      />

      <Image
        src="/images/dashboard-background.png"
        alt="Dashboard Background"
        fill
        className="object-cover object-center z-0 opacity-50"
        priority
      />

      {/* Floating Controls (Right Side) */}
      <div className="fixed right-4 top-48 sm:top-24 z-30 flex flex-col gap-3 items-end">
        {/* Rules Button */}
        <button
          onClick={openRules}
          className="h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 px-3 sm:px-4 transition-all hover:scale-105 active:scale-95"
          title="Game Rules"
        >
          <Info className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-bold text-sm sm:text-base">Rules</span>
        </button>

        {/* Timer */}
        <div className="bg-gray-900/90 backdrop-blur text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg border border-white/10 font-mono text-lg sm:text-xl font-bold min-w-[90px] sm:min-w-[100px] text-center">
          {formatTime(timeLeft)}
        </div>

        {/* Restart / Play Button */}
        <button
          onClick={handlePlay}
          disabled={gameStatus === "playing"}
          className={`h-10 sm:h-12 rounded-xl shadow-lg flex items-center justify-center gap-2 px-3 sm:px-4 transition-all hover:scale-105 active:scale-95 ${gameStatus === "playing"
            ? "bg-gray-400 cursor-not-allowed text-gray-200"
            : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          title={gameStatus === "playing" ? "Game in Progress" : "Start New Game"}
        >
          <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 ${gameStatus === "playing" ? "" : ""}`} />
          <span className="font-bold text-sm sm:text-base">Restart</span>
        </button>
      </div>

      <div className="w-full flex justify-center mt-2 mb-2 sm:mt-4 sm:mb-4 relative z-10 px-4">
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

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)] p-2 sm:p-4">
        <div className="relative">
          <div
            className={`bg-white border-4 border-green-800 rounded-lg overflow-auto w-[95vw] h-[95vw] max-w-[600px] max-h-[600px] sm:w-[70vw] sm:h-[70vw] ${serverAuthoritative && pendingMove ? "pointer-events-none opacity-60" : ""
              } ${showGameStartAlert ? "pointer-events-none opacity-60" : ""}`}
          >
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
                  <div key={index} style={{ fontSize: "8px" }}>
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
                      isCursor={cursorPosition?.[0] === row && cursorPosition?.[1] === col}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden relative z-10">
        <MobileControls
          onPlace={() => {
            if (cursorPosition) {
              executeMove(cursorPosition[0], cursorPosition[1])
            }
          }}
          disabled={
            !cursorPosition ||
            board[cursorPosition[0]][cursorPosition[1]] !== null ||
            (gameMode === "player-vs-computer" && currentPlayer !== "X") ||
            (serverAuthoritative && pendingMove)
          }
          playerSymbol={currentPlayer}
        />
      </div>
    </div>
  )
}

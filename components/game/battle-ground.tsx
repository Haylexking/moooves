"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { useGameStore } from "@/lib/stores/game-store"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import { apiClient } from "@/lib/api/client"
import { Cell } from "./cell"
import { GameScore } from "./game-score"
import { MobileControls } from "./mobile-controls"
import { GameStartAlert } from "./game-start-alert"
import { StartGameModal } from "../ui/start-game-modal"
import { GameResultModal } from "./game-result-modal"
import { useGameRules } from "./GameRulesProvider"
import { cn } from "@/lib/utils"
import { Clock, RotateCcw, BookOpen, User, Trophy } from "lucide-react"
import { useGameTimer } from "@/lib/hooks/use-game-timer"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getUserDisplayName } from "@/lib/utils/display-name"
import { mockOpponentMove } from "@/lib/mocks/mock-opponent"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"

interface BattleGroundProps {
  gameMode: "player-vs-player" | "player-vs-computer"
  localMode?: "offline" | "tournament" | "ai" | "p2p"
  matchId?: string
  initialBoard?: (string | null)[][]
  initialCurrentPlayer?: "X" | "O"
  onMoveMade?: (row: number, col: number, player: "X" | "O") => void
}

export function BattleGround({
  gameMode: initialGameMode,
  localMode,
  matchId,
  initialBoard,
  initialCurrentPlayer,
  onMoveMade,
}: BattleGroundProps) {
  const {
    board,
    currentPlayer,
    gameStatus,
    winner,
    scores,
    initializeGame,
    makeMove,
    resetGame: resetGameState,
    setCurrentPlayer,
    cursorPosition,
    setCursorPosition,
    gameMode,
    moveHistory,
    usedSequences,
    serverAuthoritative,
    setServerAuthoritative,
  } = useGameStore()

  const { user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  const { openRules } = useGameRules()

  const [showStartModal, setShowStartModal] = useState(localMode !== "ai" && localMode !== "tournament")
  const [showGameStartAlert, setShowGameStartAlert] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [resultType, setResultType] = useState<"win" | "lose" | "draw">("draw")
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [waitingTimer, setWaitingTimer] = useState(900) // 15 minutes
  const [winByDefault, setWinByDefault] = useState(false)
  const [pendingMove, setPendingMove] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Timer logic
  const { timeLeft, startTimer, stopTimer, resetTimer } = useGameTimer(300)

  // Handle Timer Expiry
  useEffect(() => {
    if (timeLeft === 0) {
      useGameStore.getState().endGame()
    }
  }, [timeLeft])

  // Match Room Hook (for tournament/online play)
  const matchRoom = useMatchRoom(matchId)

  // Initialize Game
  useEffect(() => {
    if (localMode === "tournament" && matchId) {
      setServerAuthoritative(true)
      // Initial fetch is handled by useMatchRoom
    } else {
      setServerAuthoritative(false)
      initializeGame(localMode === "ai" ? "ai" : "p2p")
    }
    return () => {
      setServerAuthoritative(false)
    }
  }, [localMode, matchId, initializeGame, setServerAuthoritative])

  // Sync with Server State (Tournament Mode)
  useEffect(() => {
    if (localMode === "tournament" && matchRoom.matchState) {
      useGameStore.getState().applyServerMatchState?.(matchRoom.matchState)

      // Update local UI state based on server match state
      if (matchRoom.matchState.status === 'completed') {
        const isWinner = matchRoom.matchState.winner === user?.id
        setResultType(isWinner ? 'win' : 'lose')
        setResultModalOpen(true)
      }
    }
  }, [localMode, matchRoom.matchState, user?.id])

  // Polling for opponent moves in tournament mode
  useEffect(() => {
    if (localMode === "tournament" && matchId && gameStatus === "playing") {
      const interval = setInterval(async () => {
        // Only poll if it's NOT our turn, or if we are waiting for a state update
        if (currentPlayer !== 'X' || pendingMove) {
          try {
            const details = await matchRoom.getRoomDetails(matchId)
            if (details && details.match) {
              useGameStore.getState().applyServerMatchState?.(details.match)
            }
          } catch (e) {
            console.error("Polling error:", e)
          }
        }
      }, 2000) // Poll every 2 seconds
      return () => clearInterval(interval)
    }
  }, [localMode, matchId, gameStatus, currentPlayer, pendingMove, matchRoom])


  // Timer Management
  useEffect(() => {
    if (gameStatus === "playing") {
      startTimer()
    } else {
      stopTimer()
    }
  }, [gameStatus, startTimer, stopTimer])

  // Game Over Handling
  useEffect(() => {
    if (gameStatus === "completed") {
      setResultType(winner === "X" ? "win" : winner === "O" ? "lose" : "draw")
      setResultModalOpen(true)
      stopTimer()
    }
  }, [gameStatus, winner, stopTimer])

  // Reset Game
  const resetGame = () => {
    resetGameState()
    resetTimer()
    setResultModalOpen(false)
    if (localMode === "ai") {
      initializeGame("ai")
    } else if (localMode === "tournament") {
      // Tournament reset logic (likely just re-fetch)
      matchRoom.getRoomDetails(matchId!)
    } else {
      initializeGame("p2p")
    }
  }

  // Player Names
  const player1 = user ? getUserDisplayName(user) : "Player 1"
  const player2 = (gameMode as string) === "player-vs-computer" ? "AI Opponent" : "Player 2"

  // Opponent Waiting Logic (Tournament)
  useEffect(() => {
    if (localMode === "tournament" && (!matchRoom.participants || matchRoom.participants.length < 2)) {
      setWaitingForOpponent(true)
      const timer = setInterval(() => {
        setWaitingTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setWinByDefault(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    } else {
      setWaitingForOpponent(false)
    }
  }, [localMode, matchRoom.participants])

  // Handle Win By Default
  useEffect(() => {
    if (winByDefault && matchId) {
      // Auto-submit win
      apiClient.submitMatchResult(matchId, user?.id || "unknown").then(() => {
        useGameStore.getState().endGame()
      })
    }
  }, [winByDefault, matchId, user?.id])

  // AI Logic - Instant response
  useEffect(() => {
    if ((gameMode as string) === "player-vs-computer" && currentPlayer === "O" && gameStatus === "playing") {
      // Execute immediately without artificial delay
      const runComputation = () => {
        const computerMove = mockOpponentMove(board, "O", usedSequences, scores)
        if (computerMove) {
          makeMove(computerMove[0], computerMove[1])
        }
      }
      // Use setTimeout(..., 0) to allow React state to settle but run ASAP
      setTimeout(runComputation, 0)
    }
  }, [gameMode, currentPlayer, gameStatus, board, usedSequences, scores, makeMove])

  const executeMove = async (row: number, col: number) => {
    if (board[row][col] !== null) return
    if ((gameMode as string) === "player-vs-computer" && currentPlayer !== "X") return
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

  const handleCellClick = useCallback((row: number, col: number) => {
    // Mobile Double-Click Logic
    if (isMobile) {
      if (cursorPosition && cursorPosition[0] === row && cursorPosition[1] === col) {
        // Second click on same cell -> Place
        executeMove(row, col)
      } else {
        // First click -> Select/Move Cursor
        setCursorPosition([row, col])
      }
    } else {
      // Desktop Single-Click Logic
      executeMove(row, col)
    }
  }, [isMobile, cursorPosition, executeMove, setCursorPosition])

  const displayUsername = user ? getUserDisplayName(user) : "Unknown Player"
  const usedPositions = new Set(usedSequences.flat().map(([r, c]) => `${r},${c}`))

  return (
    <div className="relative min-h-screen w-full pb-32">
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

      {/* Floating Controls (Timer, Rules, Restart) - Visible on all screens */}
      <div className="fixed left-4 lg:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
        <div className="bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-3 shadow-xl">
          {/* Timer */}
          <div className={cn(
            "flex flex-col items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-white/10 border border-white/20 transition-colors duration-300",
            timeLeft < 60 && "bg-red-500/20 border-red-500/50 animate-pulse"
          )}>
            <Clock className={cn("w-4 h-4 lg:w-6 lg:h-6 mb-0.5 text-white/80", timeLeft < 60 && "text-red-400")} />
            <span className={cn("text-[10px] lg:text-xs font-bold font-mono text-white", timeLeft < 60 && "text-red-400")}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>

          {/* Rules Button */}
          <button
            onClick={openRules}
            className="flex flex-col items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
          >
            <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 mb-0.5" />
            <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider">Rules</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={resetGame}
            className="flex flex-col items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="w-5 h-5 lg:w-6 lg:h-6 mb-0.5" />
            <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider">Restart</span>
          </button>
        </div>
      </div>

      <div className="pt-20 sm:pt-24 px-4 max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Top Score Bar */}
        <div className="w-full">
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

        {/* Game Board Area */}
        <div className="flex items-center justify-center w-full px-2">
          <div className="relative bg-white rounded-xl shadow-2xl border-[8px] sm:border-[16px] border-green-800 select-none w-full max-w-[95vw] aspect-square">
            <div
              className="grid gap-[1px] bg-gray-200 w-full h-full"
              style={{
                gridTemplateColumns: `repeat(30, minmax(0, 1fr))`,
              }}
            >
              {board.map((row, rIndex) =>
                row.map((cell, cIndex) => {
                  const isCursor = cursorPosition ? cursorPosition[0] === rIndex && cursorPosition[1] === cIndex : false
                  const isUsed = usedPositions.has(`${rIndex},${cIndex}`)
                  return (
                    <Cell
                      key={`${rIndex}-${cIndex}`}
                      value={cell}
                      onClick={() => handleCellClick(rIndex, cIndex)}
                      disabled={
                        ((gameMode as string) === "player-vs-computer" && currentPlayer !== "X") ||
                        gameStatus !== "playing" ||
                        (serverAuthoritative && pendingMove)
                      }
                      isHighlighted={false}
                      isUsed={isUsed}
                      isMobile={isMobile}
                      isCursor={isCursor}
                      row={rIndex}
                      col={cIndex}
                    />
                  )
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Controls - Fixed Bottom */}
      <div className="lg:hidden flex-none z-50 pb-safe fixed bottom-0 left-0 right-0">
        <MobileControls
          onPlace={() => {
            if (cursorPosition) {
              executeMove(cursorPosition[0], cursorPosition[1]);
            }
          }}
          disabled={
            !cursorPosition ||
            board[cursorPosition[0]][cursorPosition[1]] !== null ||
            ((gameMode as string) === "player-vs-computer" && currentPlayer !== "X") ||
            (serverAuthoritative && pendingMove)
          }
          playerSymbol={currentPlayer}
        />
      </div>

      {/* Modals */}
      <GameResultModal
        open={resultModalOpen}
        result={resultType}
        onPlayAgain={resetGame}
        onBackToMenu={() => router.push("/dashboard")}
        onClose={() => setResultModalOpen(false)}
        scoreX={scores.X}
        scoreO={scores.O}
      />

      {/* Loading Overlay */}
      {pendingMove && serverAuthoritative && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
          {/* Invisible blocker, spinner removed for optimistic feel */}
        </div>
      )}
    </div>
  )
}

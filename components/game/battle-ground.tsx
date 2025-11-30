"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { User, Trophy, Info, RefreshCw, Clock, BookOpen, RotateCcw } from "lucide-react"
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
import { cn } from "@/lib/utils"

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
  const moveHistory = useGameStore((state) => state.moveHistory)

  const resetGame = () => {
    initializeGame(gameMode === 'player-vs-computer' ? 'ai' : 'p2p')
    setResultModalOpen(false)
  }

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

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Poll for game state updates in tournament mode (Server Authoritative)
  useEffect(() => {
    if (serverAuthoritative && gameStatus === "playing" && matchId && !waitingForOpponent) {
      const interval = setInterval(async () => {
        try {
          const idToFetch = matchRoom.roomId || matchId
          if (!idToFetch) return

          const details = await matchRoom.getRoomDetails(idToFetch)
          const serverMatch = details.match || details

          if (serverMatch) {
            const currentHistory = useGameStore.getState().moveHistory
            const serverHistory = serverMatch.moveHistory || []

            // Only apply server state if it has more moves (opponent moved) 
            // or if we are significantly behind/out of sync.
            // We avoid overwriting if we are "ahead" (optimistic update) to prevent flickering.
            if (serverHistory.length > currentHistory.length) {
              useGameStore.getState().applyServerMatchState?.(serverMatch)
            }
          }
        } catch (e) {
          console.error("Polling error", e)
        }
      }, 2000) // Poll every 2 seconds
      return () => clearInterval(interval)
    }
  }, [serverAuthoritative, gameStatus, matchId, matchRoom, waitingForOpponent])

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
    if (gameMode === 'player-vs-computer') {
      useGameStore.setState({ serverAuthoritative: false })
    }

    if (localMode === 'ai') {
      setCurrentPlayer('X')
      useGameStore.setState({ serverAuthoritative: false })
    } else if (localMode === 'p2p') {
      useGameStore.setState({ serverAuthoritative: false })
    } else if (localMode === 'tournament') {
      useGameStore.setState({ serverAuthoritative: true })
    }
  }, [localMode, gameMode, setCurrentPlayer])

  // Auto-end game when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && gameStatus === "playing") {
      useGameStore.getState().endGame()
    }
  }, [timeLeft, gameStatus])

  // AI Logic - Instant response
  useEffect(() => {
    if (gameMode === "player-vs-computer" && currentPlayer === "O" && gameStatus === "playing") {
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
  const usedPositions = new Set(usedSequences.flat().map(([r, c]) => `${r},${c}`))

  const handleSubmitResult = async () => {
    if (matchId && user) {
      const winnerId = resultType === "win" ? user.id : (resultType === "lose" ? "opponent" : "draw")
      try {
        const res = await apiClient.submitMatchResult(matchId, winnerId)
        if (!res.success) {
          toast({ title: "Error", description: "Failed to submit match result", variant: "destructive" })
        } else {
          toast({ title: "Success", description: "Match result submitted", variant: "default" })
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("Error submitting result:", err)
      }
    }
  }

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

      {/* Floating Controls (Desktop/Tablet) */}
      <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-50">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 flex flex-col gap-4">
          {/* Timer */}
          <div className={cn(
            "flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-gray-100 border-2 border-gray-200 transition-colors duration-300",
            timeLeft < 60 && "bg-red-50 border-red-200 animate-pulse"
          )}>
            <Clock className={cn("w-6 h-6 mb-1 text-gray-400", timeLeft < 60 && "text-red-500")} />
            <span className={cn("text-xl font-bold font-mono text-gray-600", timeLeft < 60 && "text-red-600")}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>

          {/* Rules Button */}
          <button
            onClick={openRules}
            className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] transition-colors shadow-lg"
          >
            <BookOpen className="w-8 h-8 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Rules</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={resetGame}
            className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <RotateCcw className="w-8 h-8 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Restart</span>
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

        {/* Mobile Horizontal Controls (Timer, Rules, Restart) */}
        <div className="lg:hidden flex items-center justify-center gap-3 w-full">
          {/* Timer */}
          <div className={cn(
            "flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-white border-2 border-gray-200 transition-colors duration-300 shadow-sm",
            timeLeft < 60 && "bg-red-50 border-red-200 animate-pulse"
          )}>
            <Clock className={cn("w-5 h-5 mb-0.5 text-gray-400", timeLeft < 60 && "text-red-500")} />
            <span className={cn("text-sm font-bold font-mono text-gray-600", timeLeft < 60 && "text-red-600")}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>

          {/* Rules Button */}
          <button
            onClick={openRules}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] transition-colors shadow-lg"
          >
            <BookOpen className="w-6 h-6 mb-0.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Rules</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={resetGame}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <RotateCcw className="w-6 h-6 mb-0.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Restart</span>
          </button>
        </div>

        {/* Game Board Area */}
        <div className="flex items-center justify-center">
          <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden border-[16px] border-green-800 select-none">
            <div
              className="grid gap-[1px] bg-gray-200"
              style={{
                gridTemplateColumns: `repeat(30, minmax(0, 1fr))`,
                width: "fit-content",
              }}
            >
              {board.map((row, rIndex) =>
                row.map((cell, cIndex) => {
                  const isCursor = cursorPosition ? cursorPosition[0] === rIndex && cursorPosition[1] === cIndex : false
                  const isUsed = usedPositions.has(`${rIndex},${cIndex}`)
                  const isLastMove = moveHistory.length > 0 &&
                    moveHistory[moveHistory.length - 1].position[0] === rIndex &&
                    moveHistory[moveHistory.length - 1].position[1] === cIndex

                  return (
                    <Cell
                      key={`${rIndex}-${cIndex}`}
                      value={cell}
                      onClick={() => handleCellClick(rIndex, cIndex)}
                      disabled={
                        (gameMode === "player-vs-computer" && currentPlayer !== "X") ||
                        gameStatus !== "playing" ||
                        (serverAuthoritative && pendingMove)
                      }
                      isHighlighted={isLastMove}
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
            (gameMode === "player-vs-computer" && currentPlayer !== "X") ||
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

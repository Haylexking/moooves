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
import { Clock, RotateCcw, BookOpen, User, Trophy, Copy } from "lucide-react"
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

  // Rematch State
  const [rematchLoading, setRematchLoading] = useState(false)
  const [isRematchRedirecting, setIsRematchRedirecting] = useState(false)
  const [rematchInviteId, setRematchInviteId] = useState<string | null>(null)

  const handleAcceptRematch = () => {
    if (rematchInviteId) {
      router.push(`/game?live=true&id=${rematchInviteId}`)
    }
  }

  const handleDeclineRematch = async () => {
    if (rematchInviteId && user?.id) {
      await apiClient.declineRematch(rematchInviteId, user.id)
      setRematchInviteId(null)
      toast({ title: "Declined", description: "You declined the rematch." })
    }
  }

  const handleRematch = async () => {
    if (!matchId || !user?.id) return
    setRematchLoading(true)
    try {
      const res = await apiClient.requestRematch(matchId, user.id)
      if (res.success && res.data) {
        toast({ title: "Rematch Requested", description: "Waiting for opponent..." })
        // If the backend returns the new match ID immediately (e.g. created), 
        // we might wait for the opponent to join or just redirect.
        // Assuming standard flow: The SERVER links them. We wait for poll to redirect us.
        // OR: If specific newMatchId returned:
        if (res.data.newMatchId) {
          router.push(`/game?live=true&id=${res.data.newMatchId}`)
        }
      } else {
        toast({ title: "Failed", description: res.error || "Could not request rematch", variant: "destructive" })
        setRematchLoading(false)
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
      setRematchLoading(false)
    }
  }

  // Poll for Rematch ID when game is over
  useEffect(() => {
    if (localMode === "p2p" && matchId && gameStatus === "completed" && !isRematchRedirecting) {
      const interval = setInterval(async () => {
        try {
          const res = await apiClient.getMatchRoom(matchId)
          if (res.success && res.data && res.data.match) {
            // Check if rematchId exists in payload (assuming backend adds it)
            const nextMatchId = res.data.match.rematchId
            if (nextMatchId) {
              setIsRematchRedirecting(true)
              toast({ title: "Rematch Found!", description: "Redirecting to new game..." })
              window.location.href = `/game?live=true&id=${nextMatchId}`
            }
          }
        } catch { }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [localMode, matchId, gameStatus, isRematchRedirecting])

  const [showStartModal, setShowStartModal] = useState(localMode !== "ai" && localMode !== "tournament")
  const [showGameStartAlert, setShowGameStartAlert] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [resultType, setResultType] = useState<"win" | "lose" | "draw">("draw")
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [waitingTimer, setWaitingTimer] = useState(900) // 15 minutes
  const [winByDefault, setWinByDefault] = useState(false)
  const [pendingMove, setPendingMove] = useState(false)
  const [opponentName, setOpponentName] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false) // Control Pre-Match Overlay
  const overlayRef = useRef<HTMLDivElement>(null)

  // Draggable Controls State
  const controlsRef = useRef<HTMLDivElement>(null)
  const [controlsPos, setControlsPos] = useState({ x: 16, y: 300 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  const handleDragStart = (e: React.PointerEvent) => {
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - controlsPos.x,
      y: e.clientY - controlsPos.y
    }
    // Optional: capture pointer for smoother drag outside element
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId) } catch { }
  }

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    e.preventDefault() // Prevent scrolling on touch
    setControlsPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    })
  }

  const handleDragEnd = (e: React.PointerEvent) => {
    isDragging.current = false
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch { }
  }

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Timer logic
  const { timeLeft, startTimer, stopTimer, resetTimer } = useGameTimer(600)

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
      // Initial fetch
      matchRoom.getRoomDetails(matchId)
    } else {
      setServerAuthoritative(false)
      // If initialGameMode is "player-vs-computer", we must initialize as "ai"
      // Otherwise, default to "p2p" unless localMode says otherwise
      const modeToInit = (localMode === "ai" || initialGameMode === "player-vs-computer") ? "ai" : "p2p"
      initializeGame(modeToInit)
    }
    return () => {
      setServerAuthoritative(false)
    }
  }, [localMode, matchId, initializeGame, setServerAuthoritative, initialGameMode])

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
        // Only poll if it's NOT our turn AND we are not currently sending a move
        // This prevents the "glitch" where we overwrite our own optimistic move with old server state
        if (currentPlayer !== 'X' && !pendingMove) {
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
    if (localMode === "ai" || initialGameMode === "player-vs-computer") {
      initializeGame("ai")
    } else if (localMode === "tournament") {
      // Tournament reset logic (likely just re-fetch)
      matchRoom.getRoomDetails(matchId!)
    } else {
      initializeGame("p2p")
    }
  }

  // Player Names
  // If we are in "live" 1-on-1 or tournament, we want to show real names.
  const isOnlineMode = localMode === "tournament" || localMode === "p2p" // p2p used for live 1-on-1

  useEffect(() => {
    // Fetch opponent name for both Tournament and Live 1-on-1 modes
    if (isOnlineMode && matchRoom.participants && matchRoom.participants.length > 1 && user?.id) {
      const opponentId = matchRoom.participants.find((p: string) => p !== user.id)
      if (opponentId) {
        apiClient.getUserById(opponentId).then((res) => {
          if (res.success && res.data) {
            setOpponentName(res.data.fullName || res.data.name || res.data.email || "Opponent")
          }
        })
      }
    }
  }, [isOnlineMode, matchRoom.participants, user?.id])

  const player1 = user ? getUserDisplayName(user) : "Player 1"
  const player2 = (gameMode === "ai" || (gameMode as string) === "player-vs-computer")
    ? "Computer"
    : isOnlineMode
      ? opponentName || "Opponent"
      : "Player 2"

  // Livestream Prompt - Moved to Pre-Match Overlay
  // useEffect(() => {
  //   if (isOnlineMode && matchId && gameStatus === 'playing') {
  //     const hasShown = sessionStorage.getItem(`shown-prompt-${matchId}`)
  //     if (!hasShown) {
  //       toast({
  //         title: "Livestream your match!",
  //         description: "Tag @makingmoooves on Instagram to share your moment!",
  //         duration: 8000,
  //       })
  //       sessionStorage.setItem(`shown-prompt-${matchId}`, 'true')
  //     }
  //   }
  // }, [isOnlineMode, matchId, gameStatus, toast])

  // Opponent Waiting Logic (Tournament)
  useEffect(() => {
    if (localMode === "tournament" && matchId && (!matchRoom.participants || matchRoom.participants.length < 2)) {
      setWaitingForOpponent(true)

      // Poll for opponent join
      const pollTimer = setInterval(() => {
        matchRoom.getRoomDetails(matchId).catch(() => { })
      }, 2000)

      // Countdown timer for auto-win
      const timer = setInterval(() => {
        setWaitingTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            clearInterval(pollTimer)
            setWinByDefault(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        clearInterval(timer)
        clearInterval(pollTimer)
      }
    } else {
      setWaitingForOpponent(false)
    }
  }, [localMode, matchRoom.participants, matchId])

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
    if ((gameMode === "ai" || (gameMode as string) === "player-vs-computer") && currentPlayer === "O" && gameStatus === "playing") {
      // Execute immediately without artificial delay
      const runComputation = () => {
        const computerMove = mockOpponentMove(board, "O", usedSequences, scores)
        if (computerMove) {
          makeMove(computerMove[0], computerMove[1])
        }
      }
      // Use random timeout between 80ms and 200ms for natural feel
      const delay = Math.floor(Math.random() * 120) + 80
      setTimeout(runComputation, delay)
    }
  }, [gameMode, currentPlayer, gameStatus, board, usedSequences, scores, makeMove])

  const executeMove = async (row: number, col: number) => {
    if (board[row][col] !== null) return
    if ((gameMode === "ai" || (gameMode as string) === "player-vs-computer") && currentPlayer !== "X") return
    if (serverAuthoritative && pendingMove) return

    // Optimistic update: Apply move locally immediately
    // BUT only if it is my turn (in online modes)
    if (serverAuthoritative && matchRoom.participants && user?.id) {
      const myIndex = matchRoom.participants.indexOf(user.id)
      const myRole = myIndex === 0 ? 'X' : myIndex === 1 ? 'O' : null
      if (myRole && currentPlayer !== myRole) return
    }

    makeMove(row, col)
    onMoveMade?.(row, col, currentPlayer)

    if (serverAuthoritative && matchId) {
      // Set pending move to true to PAUSE POLLING and prevent state overwrite lag
      setPendingMove(true)

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
      } finally {
        // Resume polling
        setPendingMove(false)

        // Immediately fetch the latest state (in case opponent played instantly)
        // This answers the user's concern about "when will it resume"
        /*
        // Immediate fetch caused "stale state" overwrite (flicker/delay)
        // We trust our optimistic update. The next poll (2s) will Re-confirm.
        if (matchId) {
          matchRoom.getRoomDetails(matchId).then((details) => {
            if (details && details.match) {
              useGameStore.getState().applyServerMatchState?.(details.match)
            }
          }).catch(() => { })
        }
        */
      }
    }
  }

  const handleCellClick = useCallback((row: number, col: number) => {
    // Mobile Double-Click Logic (Requested by User)
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

            {matchRoom.roomCode && (
              <div className="bg-green-900/40 border border-green-500/50 rounded-lg p-3 my-4 flex items-center justify-between gap-3 group cursor-pointer hover:bg-green-900/60 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(matchRoom.roomCode!)
                  toast({ description: "Code copied!" })
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs text-green-400 uppercase tracking-widest font-bold">Match Code</span>
                  <span className="text-2xl font-mono mobile-font-fix text-white tracking-widest">{matchRoom.roomCode}</span>
                </div>
                <Copy className="w-5 h-5 text-green-400 opacity-70 group-hover:opacity-100" />
              </div>
            )}

            <p className="text-gray-400 mb-6">Your opponent has until the timer runs out to join.</p>
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

      <GlobalSidebar showTrigger={false} />
      <TopNavigation username={displayUsername} />

      {/* Floating Controls (Timer, Rules, Restart) - Draggable */}
      <div
        ref={controlsRef}
        className="fixed flex flex-col gap-3 z-40 touch-none cursor-move active:scale-95 transition-transform"
        style={{
          left: controlsPos.x,
          top: controlsPos.y
        }}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        onPointerLeave={handleDragEnd}
      >
        <div className="bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-3 shadow-xl select-none">
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
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
            onClick={openRules}
            className="flex flex-col items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
          >
            <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 mb-0.5" />
            <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider">Rules</span>
          </button>

          {/* Restart Button */}
          <button
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
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
          <div className="relative bg-white rounded-xl shadow-2xl border-[1.5px] border-green-800 select-none w-full max-w-fit aspect-square">
            <div
              className="grid gap-[1px] bg-gray-200"
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
                        ((gameMode === "ai" || (gameMode as string) === "player-vs-computer") && currentPlayer !== "X") ||
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
        isOnlineMode={localMode === "tournament" || localMode === "p2p"}
        onRematch={handleRematch}
        rematchLoading={rematchLoading}
        rematchInviteId={rematchInviteId}
        onAcceptRematch={handleAcceptRematch}
        onDeclineRematch={handleDeclineRematch}
      />

      {/* Loading Overlay - Hidden to be optimistic/instant */}
      {/* {pendingMove && serverAuthoritative && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
        </div>
      )} */}
    </div>
  )
}

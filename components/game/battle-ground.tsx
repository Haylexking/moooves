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
import { QuitConfirmationModal } from "./quit-confirmation-modal"
import { useGameRules } from "./GameRulesProvider"
import { cn } from "@/lib/utils"
import { Clock, RotateCcw, BookOpen, User, Trophy, Copy, LogOut } from "lucide-react"
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
  initialRoomCode?: string
}

export function BattleGround({
  gameMode: initialGameMode,
  localMode,
  matchId,
  initialBoard,
  initialCurrentPlayer,
  onMoveMade,
  initialRoomCode,
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

  const isOnlineMode = localMode === "tournament" || localMode === "p2p" // p2p used for live 1-on-1

  const [rematchLoading, setRematchLoading] = useState(false)
  const [rematchInviteId, setRematchInviteId] = useState<string | null>(null)

  // Hoisted state to prevent ReferenceError in polling useEffect
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [resultType, setResultType] = useState<"win" | "lose" | "draw">("draw")
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [waitingTimer, setWaitingTimer] = useState(900) // 15 minutes
  const [winByDefault, setWinByDefault] = useState(false)
  const [pendingMove, setPendingMove] = useState(false)
  const [opponentName, setOpponentName] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [showStartModal, setShowStartModal] = useState(localMode !== "ai" && localMode !== "tournament")
  const [showGameStartAlert, setShowGameStartAlert] = useState(false)





  // Poll for Rematch ID when game is over
  // Poll for Rematch ID when game is over
  useEffect(() => {
    if (localMode === "p2p" && matchId && gameStatus === "completed") {
      const interval = setInterval(async () => {
        try {
          const res = await apiClient.getMatchRoom(matchId)
          if (res.success && res.data) {
            const matchData = res.data.match || res.data
            // Check if rematchId exists in payload (assuming backend adds it)
            const nextMatchId = matchData.rematchId
            if (nextMatchId && nextMatchId !== matchId) { // Ensure it's not the same ID
              // Found a rematch!
              // Don't auto redirect. Set invite ID so modal shows "Accept"
              if (!rematchInviteId) {
                setRematchInviteId(nextMatchId)
                if (!resultModalOpen) setResultModalOpen(true) // Re-open modal if it was closed
                toast({ title: "Rematch Requested!", description: "Opponent wants to play again." })
              }
            }
          }
        } catch { }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [localMode, matchId, gameStatus, rematchInviteId, resultModalOpen])



  const handleRematch = async () => {
    if (!matchId || !user?.id) return

    setRematchLoading(true)
    try {
      const res = await apiClient.requestRematch(matchId, user.id)
      console.log("[BattleGround] Rematch requested:", res)

      if (res.success) {
        toast({ title: "Rematch Requested", description: "Waiting for opponent..." })
        // Check if a new match was immediately created (e.g. opponent already requested)
        if (res.data?.newMatchId) {
          toast({ title: "Rematch Accepted!", description: "Starting new game..." })
          window.location.href = `/game/${res.data.newMatchId}` // Force reload to new room
        }
      }
    } catch (error) {
      console.error("[BattleGround] Rematch error:", error)
      toast({ title: "Failed to request rematch", description: String(error), variant: "destructive" })
    } finally {
      setRematchLoading(false)
    }
  }

  const handleDeclineRematch = async () => {
    if (!matchId || !user?.id) return
    try {
      await apiClient.declineRematch(matchId, user.id)
      setRematchInviteId(null)
      toast({ title: "Rematch Declined" })
    } catch (e) { console.error(e) }
  }

  const handleAcceptRematch = async () => {
    // Logic for accepting is technically just "Requesting" it back
    // If the other person already requested, my request creates the match.
    await handleRematch()
  }



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
  const { timeLeft, startTimer, stopTimer, resetTimer, setTime } = useGameTimer(600)

  // Handle Timer Expiry
  useEffect(() => {
    if (timeLeft === 0) {
      useGameStore.getState().endGame()
    }
  }, [timeLeft])

  // Match Room Hook (for tournament/online play)
  const matchRoom = useMatchRoom(matchId, initialRoomCode)

  // Determine User Role (X or O)
  const userRole = React.useMemo(() => {
    if (!isOnlineMode) return null
    if (!matchRoom.participants || !user?.id) return null
    const index = matchRoom.participants.indexOf(user.id)
    return index === 0 ? "X" : index === 1 ? "O" : null
  }, [isOnlineMode, matchRoom.participants, user?.id])

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
    if (isOnlineMode && matchRoom.matchState) {
      const serverMatch = matchRoom.matchState

      // Update local UI state based on server match state
      if (serverMatch.status === 'completed') {

        // Ensure Game Store is synced to completed state
        const currentStatus = useGameStore.getState().gameStatus
        if (currentStatus !== 'completed') {
          useGameStore.setState({ gameStatus: 'completed' })
          stopTimer()
        }
        const winnerVal = serverMatch.winner
        // Handle if winner is populated object or ID string
        const winnerId = winnerVal && typeof winnerVal === 'object' ? (winnerVal._id || winnerVal.id) : winnerVal

        // Robust draw check
        const isDraw = winnerId === 'draw' || serverMatch.isDraw || serverMatch.result === 'draw'

        if (isDraw) {
          setResultType('draw')
        } else {
          // CRITICAL FIX: Robust String Comparison & Logging
          const wId = String(winnerId || "")
          const uId = String(user?.id || "")
          console.log(`[Result Check Sync] Winner=${wId}, Me=${uId}`)

          if (!uId) {
            console.warn("[Result Check] User ID missing, skipping result set")
            // Don't open modal if we don't know who we are yet
            return
          } else {
            const isWinner = wId === uId
            setResultType(isWinner ? 'win' : 'lose')
            setResultModalOpen(true)
          }
        }
      }
    }
  }, [isOnlineMode, matchRoom.matchState, user?.id, stopTimer])

  // Polling for opponent moves in tournament AND p2p mode
  useEffect(() => {
    // We want to poll in "tournament" OR "p2p" (live match) modes
    const shouldPoll = isOnlineMode && !!matchId

    if (shouldPoll) {
      const interval = setInterval(async () => {
        // Poll regularly to keep state in sync, but skip if we are actively sending a move
        if (!pendingMove) {
          try {
            const details = await matchRoom.getRoomDetails(matchId!)
            // Fix: API returns match object directly in 'details' sometimes
            const serverMatch = (details && details.match) ? details.match : details

            if (serverMatch) {


              // Sync Timer if possible
              if (serverMatch.createdAt && gameStatus === 'playing') {
                const elapsed = Math.floor((Date.now() - new Date(serverMatch.createdAt).getTime()) / 1000)
                const totalTime = 600
                const remaining = Math.max(0, totalTime - elapsed)
                if (Math.abs(timeLeft - remaining) > 3) {
                  setTime(remaining)
                }
              }

              // Apply Match State
              const store = useGameStore.getState()
              if (store.applyServerMatchState) {
                store.applyServerMatchState(serverMatch)
              }
            }
          } catch (e) {
            console.error("Polling error:", e)
            const errStr = String(e).toLowerCase()
            if (errStr.includes("not found") || errStr.includes("404")) {
              console.warn("Match appears deleted, treating as opponent forfeit")
              setWinByDefault(true)
            }
          }
        }
      }, 500) // Poll every 500ms for near-real-time feel
      return () => clearInterval(interval)
    }
  }, [localMode, matchId, currentPlayer, pendingMove, matchRoom, isOnlineMode])


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
    // CRITICAL FIX: For Online Mode, we strictly rely on the Server Sync effect (lines ~250) to determine the result.
    // relying on local 'winner' state here causes race conditions because 'userRole' might be null or desynced.
    if (gameStatus === "completed" && !isOnlineMode) {
      let result: "win" | "lose" | "draw" = "draw"
      if (winner === "draw") {
        result = "draw"
      } else {
        // Offline/AI: "X" is always the local player
        result = winner === "X" ? "win" : "lose"
      }

      setResultType(result)
      setResultModalOpen(true)
      stopTimer()
    }
  }, [gameStatus, winner, stopTimer, isOnlineMode])

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

  const [showQuitModal, setShowQuitModal] = useState(false)

  // Trigger Modal
  const handleQuitRequest = () => {
    if (gameStatus === 'playing') {
      setShowQuitModal(true)
    } else {
      router.push("/dashboard")
    }
  }

  // Actual Action
  const handleConfirmQuit = async () => {
    setShowQuitModal(false)

    if (isOnlineMode && matchId && user?.id) {
      toast({ title: "Resigning...", description: "Submitting result." })
      // Try to find opponent ID to declare them winner
      const opponentId = matchRoom.participants.find(p => p !== user.id)
      if (opponentId) {
        await apiClient.submitMatchResult(matchId, opponentId)
      } else {
        // Fallback
        await apiClient.deleteMatchRoom(matchId)
      }
    }
    router.push("/dashboard")
  }


  // Protect against accidental navigation/refresh - GLOBALLY & Auto-Forfeit on Unmount
  useEffect(() => {
    // 1. Browser Native Protection (Refresh/Tab Close)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameStatus === 'playing') {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 2. Component Unmount / Navigation Protection
    // 2. Component Unmount / Navigation Protection
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)

      // REMOVED: Auto-forfeit on unmount caused immediate match deletion during React Strict Mode / Re-renders.
      // We rely on the Quit button for clean exits.
    }
  }, [gameStatus, isOnlineMode, matchId, user?.id])

  // State to hold fetched names

  // State to hold fetched names
  const [p1Name, setP1Name] = useState("Player 1")
  const [p2Name, setP2Name] = useState("Player 2")

  useEffect(() => {
    const resolveNames = async () => {
      if (!isOnlineMode) return;

      console.log("[BattleGround] Resolving names...", { matchState: matchRoom.matchState, participants: matchRoom.participants })

      let p1Display = "Player 1"
      let p2Display = "Player 2"

      // 1. Try to get from Match Object (if populated)
      // Note: matchState might have partial data
      if (matchRoom.matchState) {
        const m = matchRoom.matchState
        // Player 1
        if (m.player1 && typeof m.player1 === 'object') {
          p1Display = m.player1.fullName || m.player1.name || m.player1.username || m.player1.email || "Player 1"
        } else if (m.player1Heading) {
          p1Display = m.player1Heading
        }

        // Player 2
        if (m.player2 && typeof m.player2 === 'object') {
          p2Display = m.player2.fullName || m.player2.name || m.player2.username || m.player2.email || "Player 2"
        } else if (m.player2Heading) {
          p2Display = m.player2Heading
        }
      }

      // 2. If we still have defaults and have participants list (IDs), fetch them
      // Host (p1) is always participants[0], Joiner (p2) is participants[1]
      // This relies on the useMatchRoom order fix: [P1, P2]
      if (matchRoom.participants && matchRoom.participants.length > 0) {
        // Only fetch if we still have default names or need to confirm
        if (p1Display === "Player 1" && matchRoom.participants[0]) {
          try {
            // Avoid re-fetching if it's me
            if (user?.id === matchRoom.participants[0]) {
              p1Display = getUserDisplayName(user)
            } else {
              const u = await apiClient.getUserById(matchRoom.participants[0])
              if (u.success && u.data) p1Display = u.data.fullName || u.data.name || "Player 1"
            }
          } catch { }
        }
        if (p2Display === "Player 2" && matchRoom.participants[1]) {
          try {
            if (user?.id === matchRoom.participants[1]) {
              p2Display = getUserDisplayName(user)
            } else {
              const u = await apiClient.getUserById(matchRoom.participants[1])
              if (u.success && u.data) p2Display = u.data.fullName || u.data.name || "Player 2"
            }
          } catch { }
        }
      }

      setP1Name(p1Display)
      setP2Name(p2Display)
    }

    resolveNames()
  }, [isOnlineMode, matchRoom.matchState, matchRoom.participants, user])

  // Logic to display correct names based on ROLE (X vs O) not just "Me vs Them"
  // Player 1 is ALWAYS X. Player 2 is ALWAYS O.
  const player1 = (gameMode === "ai" || (gameMode as string) === "player-vs-computer")
    ? (user ? getUserDisplayName(user) : "You")
    : isOnlineMode ? p1Name : (user ? getUserDisplayName(user) : "Player 1")

  const player2 = (gameMode === "ai" || (gameMode as string) === "player-vs-computer")
    ? "Computer"
    : isOnlineMode
      ? p2Name
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
    // Debug entry
    console.log("[BattleGround] executeMove called:", { row, col, currentPlayer, gameMode, serverAuthoritative, pendingMove })

    if (board[row][col] !== null) {
      console.log("[BattleGround] Move rejected: Cell occupied")
      return
    }
    if ((gameMode === "ai" || (gameMode as string) === "player-vs-computer") && currentPlayer !== "X") {
      console.log("[BattleGround] Move rejected: Not X turn in AI mode")
      return
    }
    if (serverAuthoritative && pendingMove) {
      console.log("[BattleGround] Move rejected: Move pending")
      return
    }

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
      setPendingMove(true)

      console.log("[BattleGround] Sending move:", {
        matchId,
        userId: user?.id,
        row,
        col,
        symbol: currentPlayer,
        participants: matchRoom.participants
      })

      // Safety to clear pendingMove if stuck
      const safetyTimeout = setTimeout(() => {
        if (useGameStore.getState().serverAuthoritative) { // Check current state to be safe
          console.warn("[BattleGround] Pending move timeout - unlocking UI")
          setPendingMove(false)
        }
      }, 5000)

      try {
        // Updated to match backend spec: pass symbol as 5th argument
        const res = await apiClient.makeGameMove(user?.id || "", row, col, matchId, currentPlayer)
        clearTimeout(safetyTimeout)

        console.log("[BattleGround] Move response:", res)
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

      <GlobalSidebar showTrigger={false} />
      <TopNavigation username={displayUsername} />

      {/* Floating Controls (Timer, Rules, Restart, Quit) - Draggable */}
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

          {/* Quit Button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleQuitRequest}
            className="flex flex-col items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-5 h-5 lg:w-6 lg:h-6 mb-0.5" />
            <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider">Quit</span>
          </button>
        </div>
      </div>

      <QuitConfirmationModal
        open={showQuitModal}
        onOpenChange={setShowQuitModal}
        onConfirm={handleConfirmQuit}
      />

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
            userRole={userRole}
          />
        </div>

        {/* Game Board Area */}
        <div className="flex flex-col items-center justify-center w-full px-2 gap-4">

          {/* Debug / Fail-safe Force Start removed as per user request */}

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
                        (() => {
                          const isDisabled = ((gameMode === "ai" || (gameMode as string) === "player-vs-computer") && currentPlayer !== "X") ||
                            gameStatus !== "playing" ||
                            (serverAuthoritative && pendingMove)

                          return isDisabled
                        })()
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
          playerSymbol={
            // Determine MY symbol.
            // If offline/AI: use currentPlayer (shared device or me vs pc)
            // If online:
            isOnlineMode && user?.id && matchRoom.participants.includes(user.id)
              ? (matchRoom.participants.indexOf(user.id) === 0 ? 'X' : 'O')
              : currentPlayer // Fallback
          }
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

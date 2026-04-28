"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { useGameStore } from "@/lib/stores/game-store"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import { apiClient } from "@/lib/api/client"
import { API_CONFIG } from "@/lib/config/api-config"
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
import { getUserDisplayName } from "@/lib/utils/display-name"
import { useToast } from "@/hooks/use-toast"
import { mockOpponentMove } from "@/lib/mocks/mock-opponent"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"

// Helper function to fetch actual username/fullname from backend
const fetchUserDisplayName = async (userObjOrId: any): Promise<string> => {
  try {
    if (typeof userObjOrId === 'object' && userObjOrId !== null) {
      if (userObjOrId.fullName || userObjOrId.username) {
        return userObjOrId.fullName || userObjOrId.username || getUserDisplayName(userObjOrId);
      }
    }
    const userId = typeof userObjOrId === 'string' ? userObjOrId : (userObjOrId?._id || userObjOrId?.id);
    if (!userId) return "Unknown Player";
    
    const userResponse = await apiClient.getUserById(userId)
    if (userResponse.success && userResponse.data) {
      const userData = userResponse.data
      return userData.fullName || userData.username || getUserDisplayName(userData) || "Unknown Player"
    }
  } catch (error) {
    console.error("[BattleGround] Failed to fetch user data:", error)
  }
  return "Unknown Player"
}

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
  const [fallbackPolling, setFallbackPolling] = useState(false)
  const [fallbackInterval, setFallbackInterval] = useState<NodeJS.Timeout | null>(null)
  const [isWsConnected, setIsWsConnected] = useState(false)
  const isPollingRef = useRef(false)
  
  // Only show the Start modal if we don't have a specific backend match ID
  // "tictactoe" is just a generic namespace, not a real match ID
  const isDedicatedMatch = !!matchId && matchId !== "tictactoe"
  const [showStartModal, setShowStartModal] = useState(!isDedicatedMatch && localMode !== "ai" && localMode !== "tournament")
  const [showGameStartAlert, setShowGameStartAlert] = useState(false)
  
  // WebSocket Reference
  const socketRef = useRef<WebSocket | null>(null)

  // Match Room Hook (for tournament/online play) - MOVED UP to fix dependency issues
  const matchRoom = useMatchRoom(matchId, initialRoomCode)

  // Fallback polling for when WebSocket fails
  const startFallbackPolling = useCallback(() => {
    if (!matchId || isPollingRef.current) return

    isPollingRef.current = true
    setFallbackPolling(true)

    // Clear any existing interval
    if (fallbackInterval) {
      clearInterval(fallbackInterval)
      setFallbackInterval(null)
    }

    // Start polling every 2 seconds
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.getMatch(matchId)
        if (res.success && res.data) {
          // Update match state with polling data using game store
          const gameStore = useGameStore.getState()
          if (gameStore.applyServerMatchState) {
            gameStore.applyServerMatchState(res.data)
          }
        }
      } catch (err) {
        console.error("[BattleGround] Fallback polling error:", err)
      }
    }, 2000)

    setFallbackInterval(interval)
  }, [matchId, fallbackInterval])

  // Stop fallback polling
  const stopFallbackPolling = useCallback(() => {
    isPollingRef.current = false
    setFallbackPolling(false)

    if (fallbackInterval) {
      clearInterval(fallbackInterval)
      setFallbackInterval(null)
    }
  }, [fallbackInterval])

  // Get lastServerMatchState from store for role assignment
  const lastServerMatchState = useGameStore(state => state.lastServerMatchState)

  // Determine User Role (X or O) - FIXED for 1v1
  const userRole = React.useMemo(() => {
    if (!isOnlineMode) return null
    if (!user?.id) return null
    
    // For online 1v1, use match data directly from game store
    const matchData = lastServerMatchState || matchRoom.matchState
    
    if (!matchData) {
      console.log("[BattleGround] User Role: No match data available", { lastServerMatchState, matchRoom })
      return null
    }
    
    // Extract player IDs from match data
    const player1Id = typeof matchData.player1 === 'string' ? matchData.player1 : matchData.player1?._id
    const player2Id = typeof matchData.player2 === 'string' ? matchData.player2 : matchData.player2?._id
    
    // RULE: Room creator is always X, joiner is always O
    if (user.id === player1Id) {
      return "X"
    } else if (user.id === player2Id) {
      return "O"
    }
    return null
  }, [isOnlineMode, user?.id, matchRoom.matchState, lastServerMatchState])

  // Poll for Rematch ID when game is over
  useEffect(() => {
    if (localMode === "p2p" && matchId && gameStatus === "completed") {
      const interval = setInterval(async () => {
        try {
          const res = await apiClient.getMatch(matchId)
          if (res.success && res.data) {
            const matchData = res.data.match || res.data
            // Check if rematchId exists in payload (assuming backend adds it)
            const nextMatchId = matchData.rematchId
            if (nextMatchId && nextMatchId !== matchId) { // Ensure it's not the same ID
              // Found a rematch!
              // Don't auto redirect. Set invite ID so modal shows "Accept"
              if (!rematchInviteId) {
                setRematchInviteId(nextMatchId)
                if (!resultModalOpen) {
                                    setResultModalOpen(true) // Re-open modal if it was closed
                }
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

  // Handle Match Timer Expiry
  useEffect(() => {
    if (timeLeft === 0 && gameStatus === "playing") {
      console.log("[BattleGround] Match Timer Expired.")
      if (isOnlineMode && matchId) {
        // Online: Submit result based on current scores
        const scoreX = scores["X"] || 0
        const scoreO = scores["O"] || 0
        let winnerId = "draw"

        if (scoreX > scoreO) {
          // Find player 1 ID
          winnerId = typeof matchRoom.participants[0] === 'string'
            ? matchRoom.participants[0]
            : (matchRoom.participants[0] as any)?._id || "draw"
        } else if (scoreO > scoreX) {
          // Find player 2 ID
          winnerId = typeof matchRoom.participants[1] === 'string'
            ? matchRoom.participants[1]
            : (matchRoom.participants[1] as any)?._id || "draw"
        }

                apiClient.submitMatchResult(matchId, winnerId).catch(err => {
          console.error("[BattleGround] Failed to submit timeout result:", err)
        })
      }
      useGameStore.getState().endGame()
    }
  }, [timeLeft, isOnlineMode, matchId, scores, matchRoom.participants, gameStatus])

  // 8-Second Turn Timer State
  const [turnTimeLeft, setTurnTimeLeft] = useState(8)

  useEffect(() => {
    if (gameStatus !== "playing") return

    // Reset turn timer to 8s whenever the current player changes, or a move is made
    setTurnTimeLeft(8)

    const interval = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired!
          if (!serverAuthoritative) {
            // Offline/Local: Forfeit turn.
            useGameStore.getState().switchPlayer()
            // Toast only if it was user's turn (X) against AI, or local PVP
            if (userRole === currentPlayer || localMode !== "p2p") {
              toast({ title: "Turn Forfeited", description: "Time ran out!", variant: "destructive" })
            }
          } else {
            // Online: Let backend handle turn expiration naturally
            // console.log("[BattleGround] Turn timer expired - waiting for backend state update") // Removed per instruction
          }
          return 0 // Stay at 0 until reset by dependency change
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentPlayer, gameStatus, serverAuthoritative, userRole, localMode, moveHistory.length])

  // WebSocket Connection & Listener
  useEffect(() => {
    if (!isOnlineMode || !matchId) return
    // Updated WebSocket URL structure for Render environment
    const baseUrl = API_CONFIG.BASE_URL.replace(/^https?/, 'wss')
    const wsUrl = `${baseUrl}/ws/matches/${matchId}`
    

    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    socket.onopen = () => {
      setIsWsConnected(true)
      // Stop fallback polling when WebSocket connects
      stopFallbackPolling()
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        const gameStore = useGameStore.getState()
        if (gameStore.applyServerMatchState) {
          if (data.type === 'MATCH_STATE' && data.payload) {
            gameStore.applyServerMatchState(data.payload)
          } else if (data.board || data.boardState || data.gameState || data.match || data.status) {
            // Unwrapped match payload fallback
            gameStore.applyServerMatchState(data)
          }
        }
      } catch (e) {
      }
    }

    socket.onerror = (error) => {
      setIsWsConnected(false)
      // Start fallback polling if WebSocket fails
      startFallbackPolling()
    }

    socket.onclose = (event) => {
      socketRef.current = null
      setIsWsConnected(false)
      // Start fallback polling if WebSocket closes
      startFallbackPolling()
    }

    return () => {
      // Always attempt to close the socket if it exists and isn't already closed
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close()
      }
    }
  }, [isOnlineMode, matchId])

  // Cleanup fallback polling on unmount
  useEffect(() => {
    return () => {
      stopFallbackPolling()
    }
  }, [stopFallbackPolling])

  // Initialize Game
  useEffect(() => {
    console.log("[BattleGround] Initialize Game - localMode:", localMode, "matchId:", matchId)
    
    if ((localMode === "tournament" || localMode === "p2p") && matchId) {
      setServerAuthoritative(true)
      console.log("[BattleGround] Setting server authoritative, fetching match details")
      // Initial fetch - use getMatch for match details, not getRoomDetails
      const fetchMatchDetails = async () => {
      if (isOnlineMode && matchId) {
        try {
          // Try fetching both Room and Match details to ensure robust role detection
          const [roomRes, matchRes] = await Promise.allSettled([
            apiClient.getMatchRoom(matchId),
            apiClient.getMatch(matchId)
          ])

          let participants: any[] = []
          let serverMatchData: any = null

          if (matchRes.status === 'fulfilled' && matchRes.value.success) {
            serverMatchData = matchRes.value.data
            // If match data exists, player1 and player2 are the source of truth for roles
            if (serverMatchData?.player1 && serverMatchData?.player2) {
              participants = [serverMatchData.player1, serverMatchData.player2]
            }
          }

          if (roomRes.status === 'fulfilled' && roomRes.value.success) {
            const roomData = roomRes.value.data
            if (!participants.length && roomData?.participants) {
              participants = roomData.participants
            }
            setMatchRoom({
              id: roomData?._id || matchId,
              participants: participants,
              status: roomData?.status || 'ongoing',
              matchId: matchId
            })
          } else if (serverMatchData) {
            // Fallback to match data if room call fails
            setMatchRoom({
              id: matchId,
              participants: participants,
              status: serverMatchData.status || 'ongoing',
              matchId: matchId
            })
          }

          if (serverMatchData) {
            useGameStore.getState().applyServerMatchState(serverMatchData)
          }
        } catch (error) {
          console.error("[BattleGround] Error loading initial match data:", error)
        }
      }
    }
    fetchMatchDetails()
    } else {
      setServerAuthoritative(false)
      console.log("[BattleGround] Setting local mode, initializing game")
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
    if (isOnlineMode && matchRoom.matchState && !resultModalOpen) {
      const serverMatch = matchRoom.matchState

      // Update local UI state based on server match state
      if (serverMatch.status === 'completed' || serverMatch.status === 'forfeited' || serverMatch.status === 'abandoned' || serverMatch.status === 'ended') {
        const winnerVal = serverMatch.winner

        // Robust draw check: Only if explicit "draw" is returned.
        const isExplicitDraw = winnerVal === 'draw' || serverMatch.isDraw || serverMatch.result === 'draw'

        // Handle winner: [] (empty array) from backend — means "no winner yet"
        const winnerIsEmptyArray = Array.isArray(winnerVal) && winnerVal.length === 0
        const explicitWinnerId = (!winnerIsEmptyArray && winnerVal && typeof winnerVal === 'object')
          ? (winnerVal._id || winnerVal.id)
          : winnerIsEmptyArray ? "" : String(winnerVal || "")
        const hasExplicitWinner = !!explicitWinnerId && explicitWinnerId !== "draw" && explicitWinnerId !== "null" && explicitWinnerId !== "undefined"

        // BUG FIX: Ignore erroneous "completed" status from mismatched 3x3 backend logic or stale match state.
        // A completion is suspicious if:
        // - There's no explicit winner, AND
        // - Scores are still 0-0, AND
        // - Either no moves have been made yet (0 move history) OR the timer still has plenty of time left
        const localMoves = moveHistory.length
        const isLikelyFalseDraw = !hasExplicitWinner &&
          ((scores["X"] || 0) === 0 && (scores["O"] || 0) === 0) &&
          (localMoves === 0 || timeLeft > 5);

        // The backend might just send status: 'completed' without winner: 'draw' when out of bounds.
        if (isLikelyFalseDraw) {
          // console.log("[BattleGround] Ignoring suspicious backend premature Game Over. Moves so far:", localMoves); // Removed per instruction
          return;
        }

        // Ensure Game Store is synced to completed state
        const currentStatus = useGameStore.getState().gameStatus
        if (currentStatus !== 'completed') {
          useGameStore.setState({ gameStatus: 'completed' })
          stopTimer()
        }
        // console.log("[BattleGround] Completed Match Object:", JSON.stringify(serverMatch, null, 2)) // Removed per instruction


        const uId = String(user?.id || "")

        if (!uId) {
          console.warn("[Result Check] User ID missing, skipping result set")
          return
        }

        // Determine my role based on participants array (Host = X, Joiner = O)
        let myRole = null
        if (matchRoom.participants && matchRoom.participants.length >= 2) {
          const p1 = typeof matchRoom.participants[0] === 'string' ? matchRoom.participants[0] : (matchRoom.participants[0] as any)._id
          const p2 = typeof matchRoom.participants[1] === 'string' ? matchRoom.participants[1] : (matchRoom.participants[1] as any)._id
          if (uId === p1) myRole = "X"
          else if (uId === p2) myRole = "O"
        }

        // console.log(`[Result Check] Me=${uId}, Role=${myRole}, Scores: X=${scores["X"]}, O=${scores["O"]}`) // Removed per instruction

        const scoreX = scores["X"] || 0
        const scoreO = scores["O"] || 0

        // New Logic: Local Scores are the absolute source of truth.
        // Server explicit winner is ONLY used as a tie-breaker for forfeits (where score is equal, e.g. 0-0, but someone abandoned).

        let isWinner = false
        let resultType: "win" | "lose" | "draw" = "draw"

        if (scoreX > scoreO) {
          isWinner = myRole === "X"
          resultType = isWinner ? 'win' : 'lose'
          // console.log(`[Result Check] Score Difference: X won. Me=${myRole} -> ${isWinner ? 'win' : 'lose'}`) // Removed per instruction
        } else if (scoreO > scoreX) {
          isWinner = myRole === "O"
          resultType = isWinner ? 'win' : 'lose'
          // console.log(`[Result Check] Score Difference: O won. Me=${myRole} -> ${isWinner ? 'win' : 'lose'}`) // Removed per instruction
        } else {
          // Scores are exactly equal (e.g. 0-0, 5-5)
          if (isExplicitDraw) {
            resultType = 'draw'
            // console.log("[Result Check] Explicit Server Draw.") // Removed per instruction
          } else if (hasExplicitWinner) {
            // Scores are equal, but the server explicitly declared a winner. 
            // This happens when a player leaves/forfeits an active game.
            isWinner = explicitWinnerId === uId
            resultType = isWinner ? 'win' : 'lose'
            // console.log(`[Result Check] Tie Score FORFEIT: Explicit Winner ${explicitWinnerId} === ${uId} -> ${isWinner}`) // Removed per instruction
          } else {
            // Scores are equal, no explicit winner provided. Natural tie.
            resultType = 'draw'
            // console.log("[Result Check] Natural Score Tie (Draw).") // Removed per instruction
          }
        }
        // console.log(`[Result Check] Final determined result: ${resultType}`); // Removed per instruction
        // console.log("[BattleGround] Opening Result Modal - Server Sync Completed") // Removed per instruction
        // Determine result type based on scores and winnerId
        setResultType(resultType)
        setResultModalOpen(true)
      }
    }
  }, [isOnlineMode, matchRoom.matchState, user?.id, resultModalOpen, scores, stopTimer])

  // Poll for match state updates
  useEffect(() => {
    const shouldPoll = isOnlineMode && !!matchId && !isWsConnected

    if (shouldPoll) {
      const interval = setInterval(async () => {
        // Poll regularly to keep state in sync, but skip if we are actively sending a move
        if (!pendingMove) {
          try {
            // Use getMatch for match details, not getRoomDetails
            const response = await apiClient.getMatch(matchId!)
            const serverMatch = response.data
            
            if (serverMatch) {
              console.log("[BattleGround] Polled server state:", serverMatch)
            }

            if (response.success && serverMatch) {
              const serverState = {
                moves: Array.isArray(serverMatch.moves) 
                  ? serverMatch.moves.length 
                  : (typeof serverMatch.moves === 'number' ? serverMatch.moves : 0),
                board: serverMatch.board || serverMatch.boardState,
                currentPlayer: serverMatch.currentTurn || serverMatch.currentPlayer,
                status: serverMatch.status 
              }
              console.log("[BattleGround] Polling received server state:", serverState)

              const store = useGameStore.getState()
              if (store.applyServerMatchState) {
                store.applyServerMatchState(serverMatch)
              }

              // Check if game ended on server
              if (serverState.status === 'completed' || serverState.status === 'finished') {
                const winnerId = serverMatch.winner
                if (winnerId) {
                  const result = winnerId === user?.id ? 'win' : 'lose'
                  setGameResult(result)
                  setShowResultModal(true)
                }
              }
            }
          } catch (e) {
            const errStr = String(e).toLowerCase()
            // Only log errors that aren't 404s (match might not exist yet)
            if (!errStr.includes('404') && !errStr.includes('not found')) {
              console.error("[BattleGround] Polling error:", e)
            }
          }
        }
      }, 2000)

      return () => {
        console.log("[BattleGround] Clearing polling interval")
        clearInterval(interval)
      }
    }
  }, [localMode, matchId, isOnlineMode, pendingMove, isWsConnected])

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
      const scoreX = scores["X"] || 0;
      const scoreO = scores["O"] || 0;

      let result: "win" | "lose" | "draw" = "draw"
      if (winner === "draw" || scoreX === scoreO) {
        result = "draw"
      } else {
        // Offline/AI: "X" is always the local player
        result = scoreX > scoreO ? "win" : "lose"
      }

      setResultType(result)

      // Determine scores based on role for offline/local
      // Offline: X is usually 'Me' (Human), O is Computer/Opponent
      const myScore = scores["X"] || 0
      const opScore = scores["O"] || 0

      // For GameResultModal: scoreX={myScore} scoreO={opScore} 
      // We will treat scoreX prop as "My Score" and scoreO as "Opponent Score" effectively by genericizing the modal later
      // Or just pass them as is, and let Modal handle 'X' vs 'O'. 
      // User requested "If I win 2:0, I should see 2:0". 
      // In offline (User=X), My=X. 
      // If I am O (unlikely in offline default), we'd swap.
      // Let's assume User is X for offline.

      console.log(`[Offline Result Check] Result: \${result}. Scores X:\${scoreX} O:\${scoreO}`);
      console.log("[BattleGround] Opening Result Modal - Local gameStatus completed")
      setResultModalOpen(true)
      stopTimer()
    }
  }, [gameStatus, winner, stopTimer, isOnlineMode, scores])

  // Reset Game
  const resetGame = () => {
    resetGameState()
    resetTimer()
    setResultModalOpen(false)
    if (localMode === "ai" || initialGameMode === "player-vs-computer") {
      initializeGame("ai")
    } else if (localMode === "tournament") {
      // Tournament reset logic - re-fetch match details
      const fetchMatchDetails = async () => {
        try {
          const response = await apiClient.getMatch(matchId!)
          if (response.success && response.data) {
            const gameStore = useGameStore.getState()
            if (gameStore.applyServerMatchState) {
              gameStore.applyServerMatchState(response.data)
            }
          }
        } catch (err) {
          console.error("[BattleGround] Failed to fetch match details for reset:", err)
        }
      }
      fetchMatchDetails()
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
      const opponent = matchRoom.participants.find((p: any) => {
        const id = typeof p === 'string' ? p : (p._id || p.id)
        return id !== user.id
      })
      const opponentId = typeof opponent === 'string' ? opponent : ((opponent as any)?._id || (opponent as any)?.id)
      
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
  const [p1Name, setP1Name] = useState("Player 1")
  const [p2Name, setP2Name] = useState("Player 2")

  useEffect(() => {
    const resolveNames = async () => {
      if (!isOnlineMode) return;

      let p1Display = "Player 1"
      let p2Display = "Player 2"
      const currentUser = useAuthStore.getState().user
      
      // Get match data from either matchRoom or lastServerMatchState
      const matchData = matchRoom.matchState || lastServerMatchState
      const m = matchData || {}

      // Resolve P1 (Always X)
      if (m.player1 && typeof m.player1 === 'object') {
        p1Display = m.player1.fullName || m.player1.username || getUserDisplayName(m.player1) || "Player 1"
      } else if (m.player1Heading) {
        p1Display = m.player1Heading
      } else if (m.player1 && typeof m.player1 === 'string') {
        // If player1 is just an ID string, we need to fetch user data
        if (currentUser?.id === m.player1) {
          p1Display = currentUser?.fullName || (currentUser ? getUserDisplayName(currentUser) : "You") || "You"
        } else {
          p1Display = "Player 1" // Will be updated when user data is fetched
        }
      }

      // Player 2 Slot
      if (m.player2 && typeof m.player2 === 'object') {
        p2Display = m.player2.fullName || m.player2.username || getUserDisplayName(m.player2) || "Player 2"
      } else if (m.player2Heading) {
        p2Display = m.player2Heading
      } else if (m.player2 && typeof m.player2 === 'string') {
        if (currentUser?.id === m.player2) {
          p2Display = currentUser?.fullName || (currentUser ? getUserDisplayName(currentUser) : "You") || "You"
        } else {
          p2Display = "Player 2"
        }
      }

      // 2. Fetch via IDs if names are still generic or IDs are present
      const p1Id = (matchRoom.participants && matchRoom.participants[0]) || (typeof m.player1 === 'string' ? m.player1 : m.player1?._id || m.player1?.id)
      const p2Id = (matchRoom.participants && matchRoom.participants[1]) || (typeof m.player2 === 'string' ? m.player2 : m.player2?._id || m.player2?.id)

      // Resolve P1
      if (p1Display === "Player 1" && p1Id) {
         p1Display = await fetchUserDisplayName(p1Id)
      }

      // Resolve P2
      if (p2Display === "Player 2" && p2Id && gameMode !== "ai") {
         p2Display = await fetchUserDisplayName(p2Id)
      }

      setP1Name(p1Display)
      setP2Name(p2Display)
    }

    resolveNames()
  }, [isOnlineMode, matchRoom.matchState, matchRoom.participants, gameMode, lastServerMatchState])

  // Logic to display correct names based on ROLE (X vs O) not just "Me vs Them"
  // Player 1 is ALWAYS X. Player 2 is ALWAYS O.
  const player1 = (gameMode === "ai" || (gameMode as string) === "player-vs-computer")
    ? (user ? user.fullName || getUserDisplayName(user) : "You")
    : isOnlineMode ? p1Name : (user ? user.fullName || getUserDisplayName(user) : "Player 1")

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
      const pollTimer = setInterval(async () => {
        try {
          // Use getMatch for match details, not getRoomDetails
          const response = await apiClient.getMatch(matchId!)
          if (response.success && response.data) {
            const gameStore = useGameStore.getState()
            if (gameStore.applyServerMatchState) {
              gameStore.applyServerMatchState(response.data)
            }
          }
        } catch (err) {
          // Silently ignore polling errors
        }
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
    if (board[row][col] !== null) {
      return
    }
    if ((gameMode === "ai" || (gameMode as string) === "player-vs-computer") && currentPlayer !== "X") {
      return
    }
    if (serverAuthoritative && pendingMove) {
      return
    }

    // CRITICAL: Strict turn validation for online modes
    if (serverAuthoritative) {
      if (!userRole) {
        return
      }
      if (currentPlayer !== userRole) {
        return
      }
    }

    makeMove(row, col)
    onMoveMade?.(row, col, currentPlayer)

    if (serverAuthoritative && matchId) {
      setPendingMove(true)

      // Try WebSocket first for "simple websocket" low-lag submission
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify({ 
            playerId: user?.id, 
            row, 
            col, 
            symbol: currentPlayer 
          }))
        } catch (wsErr) {
          console.error("[BattleGround] WS Send failed, falling back to HTTP", wsErr)
        }
      }

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
      
        if (!res.success) {
          setPendingMove(false)
          
          // CRITICAL: Explicit Rollback
          // Re-apply the last known good server state to remove the optimistic move
          const store = useGameStore.getState()
          if (store.lastServerMatchState) {
            console.log("[BattleGround] Rolling back move due to server rejection")
            store.applyServerMatchState(store.lastServerMatchState)
          }

          toast({
            title: "Move Rejected",
            description: res.message || "The server rejected your move.",
            variant: "destructive",
          })
          return
        }

        clearTimeout(safetyTimeout)
        
        // Instant UI Feedback: Clear pending move on success to unlock board
        if (res.success) {
          setPendingMove(false)
          
          // The API returns board directly in response, not nested in match/gameState
          const serverMatch = res.data // res.data contains the board and game info directly
          if (serverMatch) {
            useGameStore.getState().applyServerMatchState?.(serverMatch)
          } else {
                      }
          // Let backend handle synchronization naturally through regular polling
        } else {
          // Move failed - unlock UI and show error
          setPendingMove(false)
          console.error("[BattleGround] Move submission failed:", res.error)
          
          // Enhanced error handling for different error types
          let errorMessage = res.error || "Failed to submit move"
          if (res.status === 500) {
            errorMessage = "Server error occurred. Please try again."
          } else if (res.status === 400) {
            errorMessage = "Invalid move. Please check your turn."
          } else if (res.status === 401 || res.status === 403) {
            errorMessage = "Authentication error. Please refresh."
          }
          
          toast({ title: "Move Failed", description: errorMessage, variant: "destructive" })
          
          // For 500 errors, trigger a match state refresh to resync
          if (res.status === 500 && matchId) {
            console.log("[BattleGround] Triggering match state refresh after 500 error")
            setTimeout(async () => {
              try {
                const refreshRes = await apiClient.getMatch(matchId)
                if (refreshRes.success && refreshRes.data) {
                  const gameStore = useGameStore.getState()
                  if (gameStore.applyServerMatchState) {
                    gameStore.applyServerMatchState(refreshRes.data)
                  }
                }
              } catch (refreshErr) {
                console.error("[BattleGround] Failed to refresh match state:", refreshErr)
              }
            }, 2000) // Wait 2 seconds before refreshing
          }
        }  // Rely on regular polling to sync state
      } catch (err) {
        setPendingMove(false)
        console.error("[BattleGround] Move submission error:", err)
        toast({ title: "Connection Error", description: "Failed to send move to server.", variant: "destructive" })
        // Rely on regular polling to sync state
      } finally {
        // Resume polling
        setPendingMove(false)

        // Immediately fetch the latest state (in case opponent played instantly)
        // This answers the user's concern about "when will it resume"
        if (matchId) {
          apiClient.getMatch(matchId).then((response) => {
            if (response.success && response.data) {
              useGameStore.getState().applyServerMatchState?.(response.data)
            }
          }).catch(() => {
            // Silently ignore fetch errors
          })
        }
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
      {/* Background Image */}
      {/* <div className="absolute inset-0 z-0">
        <img
          src="/images/dashboard-background.png"
          alt="Background"
          className="w-full h-full object-cover object-center opacity-90"
        />
      </div> */}
      <div className="relative z-10">
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
            <p className="text-green-400 text-lg mb-6">Opponent hasn&apos;t shown up — you win by default</p>
            <button
              onClick={() => {
                if (matchId && localMode === 'tournament') {
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
            turnTimeLeft={turnTimeLeft}
          />
        </div>

        {/* Game Board Area */}
        <div className="flex flex-col items-center justify-center w-full px-2 gap-4">

          {/* Debug / Fail-safe Force Start removed as per user request */}

          <div className="relative bg-white rounded-xl shadow-2xl border-[1.5px] border-green-800 select-none w-full max-w-fit aspect-square">
            <div
              className="grid gap-[1px] bg-gray-200"
              style={{
                gridTemplateColumns: `repeat(${board[0]?.length || 30}, minmax(0, 1fr))`,
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
                            (serverAuthoritative && pendingMove) ||
                            // CRITICAL: Strict turn validation for online modes
                            (serverAuthoritative && (!userRole || currentPlayer !== userRole))

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
        onClose={() => setResultModalOpen(false)}
        result={resultType}
        // User wants "My Score : Opponent Score".
        // We determine My Role.
        scoreX={userRole === 'O' ? (scores['O'] || 0) : (scores['X'] || 0)}
        scoreO={userRole === 'O' ? (scores['X'] || 0) : (scores['O'] || 0)}
        myName={userRole === 'O' ? player2 : player1}
        opponentName={userRole === 'O' ? player1 : player2}
        isOnlineMode={isOnlineMode}
        onPlayAgain={resetGame}
        onBackToMenu={() => router.push("/dashboard")}
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
    </div>
  )
}

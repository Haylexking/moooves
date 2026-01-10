"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { GameBoardSlice } from "./slices/game-board-slice"
import type { GameStateSlice } from "./slices/game-state-slice"
import type { ScoreSlice } from "./slices/score-slice"
import { createGameBoardSlice } from "./slices/game-board-slice"
import { createGameStateSlice } from "./slices/game-state-slice"
import { createScoreSlice } from "./slices/score-slice"
import { checkWinConditions, calculateGameStateFromBoard } from "@/lib/utils/game-logic"
import { mockOpponentMove } from "@/lib/mocks/mock-opponent"
import { serializeUsedPositions, serializeUsedSequences } from "@/lib/utils/game-serialize"
import type { GameMode, GameResult, Move } from "@/lib/types"

type GameStore = GameBoardSlice &
  GameStateSlice &
  ScoreSlice & {
    // Combined actions
    aiAutoEnabled: boolean
    cursorPosition: [number, number] | null
    setCursorPosition: (pos: [number, number] | null) => void
    moveCursor: (dr: number, dc: number) => void
    winner: "X" | "O" | "draw" | null
    serverAuthoritative?: boolean
    setServerAuthoritative: (enabled: boolean) => void
    applyServerMatchState?: (match: any) => void
    initializeGame: (mode?: GameMode) => void
    resetGame: () => void
    makeMove: (row: number, col: number) => void
    endGame: () => void
    pauseGame: () => void
    resumeGame: () => void
    getGameResult: () => GameResult
    getSerializedUsedPositions: () => string[]
    getSerializedUsedSequences: () => string[][]
  }

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get, api) => ({
      // Combine all slices
      ...createGameBoardSlice(set, get, api),
      ...createGameStateSlice(set, get, api),
      ...createScoreSlice(set, get, api),

      aiAutoEnabled: false,
      cursorPosition: null,
      serverAuthoritative: false,

      setServerAuthoritative: (enabled) => set({ serverAuthoritative: enabled }),
      resetGame: () => {
        get().initializeBoard()
        get().resetGameState()
        get().resetScores()
      },

      setCursorPosition: (pos) => set({ cursorPosition: pos }),

      moveCursor: (dr, dc) => {
        const { cursorPosition } = get()
        if (!cursorPosition) {
          set({ cursorPosition: [15, 15] })
          return
        }
        const [r, c] = cursorPosition
        const newR = Math.max(0, Math.min(29, r + dr))
        const newC = Math.max(0, Math.min(29, c + dc))
        set({ cursorPosition: [newR, newC] })
      },

      initializeGame: (mode: GameMode = "p2p") => {
        get().initializeBoard()
        get().resetGameState()
        get().resetScores()
        set({
          gameMode: mode,
          aiAutoEnabled: mode === "ai",
          cursorPosition: null,
          gameStatus: "playing", // Start playing immediately
        })
      },

      makeMove: (row: number, col: number) => {
        const state = get()

        // Validation
        if (state.gameStatus !== "playing") return
        if (state.board[row][col] !== null) return

        // Update the board
        state.updateCell(row, col, state.currentPlayer)

        const { newSequences, updatedScores, newUsedPositions } = checkWinConditions(
          state.board,
          state.currentPlayer,
          row,
          col,
          state.usedSequences,
          state.scores,
          state.usedPositions,
        )

        // Always update scores with the latest from checkWinConditions
        set({ scores: updatedScores })
        if (newSequences.length > 0) {
          state.addUsedSequences(newSequences)
          state.addUsedPositions(newUsedPositions)
        }

        // Add move to history
        const move: Move = {
          player: state.currentPlayer,
          position: [row, col],
          timestamp: Date.now(),
          sequencesScored: newSequences.length,
        }
        state.addMove(move)

        // Check if game should end
        const isFull = state.isBoardFull()
        if (isFull) {
          state.setGameStatus("completed")
          return
        }

        // Switch players
        state.switchPlayer()

        // Mock opponent move (optional internal auto-controller; disabled by default)
        if (get().aiAutoEnabled && state.currentPlayer === "O") {
          setTimeout(() => {
            const currentState = get()
            if (currentState.gameStatus === "playing" && currentState.currentPlayer === "O") {
              const opponentMove = mockOpponentMove(currentState.board)
              if (opponentMove) {
                currentState.makeMove(opponentMove[0], opponentMove[1])
              }
            }
          }, 1000)
        }
      },

      // Apply a server-provided match state to local store (used in serverAuthoritative mode)
      applyServerMatchState: (match: any) => {
        try {
          if (!match) return

          // The API might return a top-level match object with nested 'gameState'
          // OR a flat object depending on the endpoint. We prioritize nested 'gameState'.
          const data = match.gameState || match

          // Prevent overwriting local optimistic updates with stale server data
          // ONLY if we are strictly playing and NOT resyncing from an error
          const currentMoves = get().moveHistory.length
          const serverMoves = data.movesMade

          // If server is behind local, ignore (stale poll)
          if (typeof serverMoves === 'number' && typeof currentMoves === 'number') {
            if (serverMoves < currentMoves) {
              return
            }
          }

          // Proceed to apply state...
          console.log("[GameStore] Syncing State. Moves:", serverMoves)
          console.log("[GameStore] Server Scores:", data.scores)


          // Board
          if (data.board) {
            // Count symbols for debug
            let xCount = 0, oCount = 0
            data.board.forEach((row: any[]) => row.forEach((c: any) => {
              if (c === 'X') xCount++
              if (c === 'O') oCount++
            }))
            console.log(`[GameStore] Board Update: X=${xCount}, O=${oCount}`)

            // Normalize board: ensure empty strings are null
            const normalizedBoard = data.board.map((row: any[]) =>
              row.map((cell: any) => (cell === "" ? null : cell))
            )
            set({ board: normalizedBoard })

            // The server does not track scores! We must calculate them locally from the board.
            const calculated = calculateGameStateFromBoard(normalizedBoard)
            console.log("[GameStore] Calculated State:", calculated)
            set({
              scores: calculated.scores,
              usedSequences: calculated.usedSequences,
              usedPositions: calculated.usedPositions
            })
          }

          /* 
             Legacy Score/Used logic removed because server data is incomplete.
             We strictly trust calculateGameStateFromBoard(normalizedBoard).
          */


          // Move history (Map 'moves' from server to 'moveHistory')
          if (data.moveHistory) {
            set({ moveHistory: data.moveHistory })
          } else if (data.moves) {
            set({ moveHistory: data.moves })
          }

          // Current player (Map UserID to X/O)
          const turnId = data.currentTurn || match.currentTurn
          if (turnId) {
            if (turnId === match.player1) {
              set({ currentPlayer: "X" })
            } else if (turnId === match.player2) {
              set({ currentPlayer: "O" })
            } else if (turnId === "X" || turnId === "O") {
              // Fallback if API actually sends "X"/"O"
              set({ currentPlayer: turnId })
            }
          } else if (data.currentPlayer) {
            // Fallback for older API format
            set({ currentPlayer: data.currentPlayer })
          }

          // Winner Sync
          if (match.winner === 'draw' || data.winner === 'draw') {
            set({ winner: 'draw' })
          } else if (match.winner) {
            if (match.winner === match.player1) set({ winner: 'X' })
            else if (match.winner === match.player2) set({ winner: 'O' })
          }

          // Game status (usually top-level)
          if (match.status) {
            let status = match.status
            if (status === 'ongoing') status = 'playing'
            set({ gameStatus: status })
          }
        } catch (error) {
          // Use structured debug logger
          // eslint-disable-next-line global-require
          const { logDebug } = require('@/lib/logger')
          logDebug('GameStore', { event: 'applyServerStateFailed', error: String(error) })
        }
      },

      endGame: () => {
        get().setGameStatus("completed")
      },

      pauseGame: () => {
        get().setGameStatus("paused")
      },

      resumeGame: () => {
        get().setGameStatus("playing")
      },

      getGameResult: (): GameResult => {
        const state = get();
        const winner = state.winner; // Now can be "draw"
        const isDraw = winner === "draw" || state.isDraw();
        const gameDuration = state.gameStartTime ? Date.now() - state.gameStartTime : 0;

        return {
          winnerId: (winner === "X" || winner === "O") ? winner : undefined,
          player1Score: state.scores.X,
          player2Score: state.scores.O,
          isDraw,
          totalMoves: state.moveHistory.length,
          gameDuration,
          completedAt: Date.now(),
        };
      },

      // Serialization helpers for API compatibility
      getSerializedUsedPositions: () => {
        const state = get()
        return serializeUsedPositions(state.usedPositions)
      },

      getSerializedUsedSequences: () => {
        const state = get()
        return serializeUsedSequences(state.usedSequences)
      },
    }),
    {
      name: "moooves-game-store",
    },
  ),
)

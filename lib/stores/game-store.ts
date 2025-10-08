"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { GameBoardSlice } from "./slices/game-board-slice"
import type { GameStateSlice } from "./slices/game-state-slice"
import type { ScoreSlice } from "./slices/score-slice"
import { createGameBoardSlice } from "./slices/game-board-slice"
import { createGameStateSlice } from "./slices/game-state-slice"
import { createScoreSlice } from "./slices/score-slice"
import { checkWinConditions } from "@/lib/utils/game-logic"
import { mockOpponentMove } from "@/lib/mocks/mock-opponent"
import { serializeUsedPositions, serializeUsedSequences } from "@/lib/utils/game-serialize"
import type { GameMode, GameResult, Move } from "@/lib/types"

type GameStore = GameBoardSlice &
  GameStateSlice &
  ScoreSlice & {
    // Combined actions
    aiAutoEnabled: boolean
    serverAuthoritative?: boolean
    applyServerMatchState?: (match: any) => void
    initializeGame: (mode?: GameMode) => void
    makeMove: (row: number, col: number) => void
    endGame: () => void
    pauseGame: () => void
    resumeGame: () => void
    getGameResult: () => GameResult
  }

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get, api) => ({
      // Combine all slices
      ...createGameBoardSlice(set, get, api),
      ...createGameStateSlice(set, get, api),
      ...createScoreSlice(set, get, api),

      // AI auto-move toggle (disabled to avoid double-trigger with BattleGround controller)
      aiAutoEnabled: false,

      // Combined actions
  serverAuthoritative: false,
      initializeGame: (mode: GameMode = "timed") => {
        get().initializeBoard()
        get().resetScores()
        get().resetGameState()
        get().startGame(mode)
      },

      makeMove: (row: number, col: number) => {
        const state = get()
        if (state.gameStatus !== "playing" || state.getCellValue(row, col) !== null) {
          return
        }

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

          // Board
          if (match.board) {
            // Assume server sends a 2D array board of 'X' | 'O' | null
            set({ board: match.board })
          }

          // Scores
          if (match.scores) {
            set({ scores: match.scores })
          }

          // usedPositions (array of "r,c")
          if (match.usedPositions) {
            const newUsed = new Set<string>(match.usedPositions)
            set({ usedPositions: newUsed })
          }

          // usedSequences (array of arrays of "r,c") -> convert to Position arrays
          if (match.usedSequences) {
            const parsed: Array<Array<[number, number]>> = match.usedSequences.map((seq: string[]) =>
              seq.map((s: string) => {
                const [r, c] = s.split(",")
                return [Number(r), Number(c)] as [number, number]
              }),
            )
            set({ usedSequences: parsed })
          }

          // Move history
          if (match.moveHistory) {
            set({ moveHistory: match.moveHistory })
          }

          // Current player
          if (match.currentPlayer) {
            set({ currentPlayer: match.currentPlayer })
          }

          // Game status
          if (match.status) {
            set({ gameStatus: match.status })
          }
        } catch (error) {
          console.error("Failed to apply server match state:", error)
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
        const winner = state.getWinner();
        const isDraw = state.isDraw();
        const gameDuration = state.gameStartTime ? Date.now() - state.gameStartTime : 0;

        return {
          winnerId: winner === null ? undefined : winner,
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

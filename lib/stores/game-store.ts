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
import type { GameMode, GameResult, Move } from "@/lib/types"

type GameStore = GameBoardSlice &
  GameStateSlice &
  ScoreSlice & {
    // Combined actions
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

      // Combined actions
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

        // Update scores if there are new sequences
        if (newSequences.length > 0) {
          state.updateScore(state.currentPlayer, newSequences.length)
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
          state.setGameStatus("finished")
          return
        }

        // Switch players
        state.switchPlayer()

        // Mock opponent move (for testing)
        if (state.currentPlayer === "O") {
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

      endGame: () => {
        get().setGameStatus("finished")
      },

      pauseGame: () => {
        get().setGameStatus("paused")
      },

      resumeGame: () => {
        get().setGameStatus("playing")
      },

      getGameResult: (): GameResult => {
        const state = get()
        const winner = state.getWinner()
        const isDraw = state.isDraw()
        const gameDuration = state.gameStartTime ? Date.now() - state.gameStartTime : 0

        return {
          winner,
          isDraw,
          finalScores: { ...state.scores },
          totalMoves: state.moveHistory.length,
          gameDuration,
          usedSequences: [...state.usedSequences],
        }
      },
    }),
    {
      name: "moooves-game-store",
    },
  ),
)

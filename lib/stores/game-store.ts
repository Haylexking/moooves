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

        console.log("🎯 MOVE EXECUTION START", {
          position: [row, col],
          player: state.currentPlayer,
          gameStatus: state.gameStatus,
          cellValue: state.getCellValue(row, col),
          currentScores: state.scores,
          usedSequences: state.usedSequences.map(seq => ({ sequence: seq, key: `${seq[0][0]},${seq[0][1]}-${seq[1][0]},${seq[1][1]}-${seq[2][0]},${seq[2][1]}` })),
          usedPositions: Array.from(state.usedPositions),
          timestamp: new Date().toISOString()
        })

        if (state.gameStatus !== "playing" || state.getCellValue(row, col) !== null) {
          console.log("❌ MOVE REJECTED", {
            reason: state.gameStatus !== "playing" ? "Game not playing" : "Cell occupied",
            gameStatus: state.gameStatus,
            cellValue: state.getCellValue(row, col),
            timestamp: new Date().toISOString()
          })
          return
        }

        // Update the board
        state.updateCell(row, col, state.currentPlayer)
        console.log("✅ BOARD UPDATED", {
          position: [row, col],
          newValue: state.currentPlayer,
          timestamp: new Date().toISOString()
        })

        console.log("🔍 CHECKING WIN CONDITIONS", {
          position: [row, col],
          player: state.currentPlayer,
          boardState: state.board.map((row, i) => row.map((cell, j) => ({ pos: [i, j], value: cell }))).flat().filter(cell => cell.value !== null),
          timestamp: new Date().toISOString()
        })

        const { newSequences, updatedScores, newUsedPositions } = checkWinConditions(
          state.board,
          state.currentPlayer,
          row,
          col,
          state.usedSequences,
          state.scores,
          state.usedPositions,
        )

        console.log("📊 SCORING RESULTS", {
          newSequences: newSequences.map(seq => ({
            sequence: seq,
            key: `${seq[0][0]},${seq[0][1]}-${seq[1][0]},${seq[1][1]}-${seq[2][0]},${seq[2][1]}`,
            positions: seq.map(pos => `[${pos[0]},${pos[1]}]`)
          })),
          scoreChange: {
            X: updatedScores.X - state.scores.X,
            O: updatedScores.O - state.scores.O
          },
          oldScores: state.scores,
          newScores: updatedScores,
          newUsedPositions: Array.from(newUsedPositions),
          timestamp: new Date().toISOString()
        })

        // Always update scores with the latest from checkWinConditions
        set({ scores: updatedScores })
        if (newSequences.length > 0) {
          console.log("✅ ADDING NEW SEQUENCES", {
            count: newSequences.length,
            sequences: newSequences.map(seq => ({
              sequence: seq,
              key: `${seq[0][0]},${seq[0][1]}-${seq[1][0]},${seq[1][1]}-${seq[2][0]},${seq[2][1]}`,
              positions: seq.map(pos => `[${pos[0]},${pos[1]}]`)
            })),
            timestamp: new Date().toISOString()
          })
          state.addUsedSequences(newSequences)
          state.addUsedPositions(newUsedPositions)
        } else {
          console.log("ℹ️ NO NEW SEQUENCES FOUND", {
            position: [row, col],
            player: state.currentPlayer,
            timestamp: new Date().toISOString()
          })
        }

        // Add move to history
        const move: Move = {
          player: state.currentPlayer,
          position: [row, col],
          timestamp: Date.now(),
          sequencesScored: newSequences.length,
        }
        state.addMove(move)

        console.log("📝 MOVE ADDED TO HISTORY", {
          move,
          totalMoves: state.moveHistory.length,
          timestamp: new Date().toISOString()
        })

        // Check if game should end
        const isFull = state.isBoardFull()
        if (isFull) {
          console.log("🏁 GAME ENDED - BOARD FULL", {
            totalMoves: state.moveHistory.length,
            finalScores: updatedScores,
            timestamp: new Date().toISOString()
          })
          state.setGameStatus("completed")
          return
        }

        // Switch players
        const previousPlayer = state.currentPlayer
        state.switchPlayer()
        console.log("🔄 PLAYER SWITCHED", {
          from: previousPlayer,
          to: state.currentPlayer,
          timestamp: new Date().toISOString()
        })

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

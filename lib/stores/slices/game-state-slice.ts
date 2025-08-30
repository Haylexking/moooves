import type { StateCreator } from "zustand"
import type { Player, GameStatus, GameMode, Move, Sequence, Position } from "@/lib/types"

export interface GameStateSlice {
  currentPlayer: Player
  gameStatus: GameStatus
  gameMode: GameMode
  gameStartTime: number | null
  moveHistory: Move[]
  usedSequences: Sequence[]
  usedPositions: Set<string>

  setCurrentPlayer: (player: Player) => void
  setGameStatus: (status: GameStatus) => void
  setGameMode: (mode: GameMode) => void
  addMove: (move: Move) => void
  addUsedSequences: (sequences: Sequence[]) => void
  addUsedPositions: (positions: Position[]) => void
  switchPlayer: () => void
  startGame: (mode?: GameMode) => void
  resetGameState: () => void
}

export const createGameStateSlice: StateCreator<GameStateSlice> = (set, get) => ({
  currentPlayer: "X",
  gameStatus: "waiting",
  gameMode: "timed",
  gameStartTime: null,
  moveHistory: [],
  usedSequences: [],
  usedPositions: new Set<string>(),

  setCurrentPlayer: (player: Player) => {
    set({ currentPlayer: player })
  },

  setGameStatus: (status: GameStatus) => {
    set({ gameStatus: status })
  },

  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode })
  },

  addMove: (move: Move) => {
    const { moveHistory } = get()
    set({ moveHistory: [...moveHistory, move] })
  },

  addUsedSequences: (sequences: Sequence[]) => {
    const { usedSequences } = get()
    set({ usedSequences: [...usedSequences, ...sequences] })
  },

  addUsedPositions: (positions: Position[]) => {
    const { usedPositions } = get()
    const newUsedPositions = new Set(usedPositions)
    positions.forEach(([row, col]) => {
      newUsedPositions.add(`${row},${col}`)
    })
    set({ usedPositions: newUsedPositions })
  },

  switchPlayer: () => {
    const { currentPlayer } = get()
    set({ currentPlayer: currentPlayer === "X" ? "O" : "X" })
  },

  startGame: (mode: GameMode = "timed") => {
    set({
      gameStatus: "playing",
      gameMode: mode,
      gameStartTime: Date.now(),
      currentPlayer: "X",
    })
  },

  resetGameState: () => {
    set({
      currentPlayer: "X",
      gameStatus: "waiting",
      gameMode: "timed",
      gameStartTime: null,
      moveHistory: [],
      usedSequences: [],
      usedPositions: new Set<string>(),
    })
  },
})

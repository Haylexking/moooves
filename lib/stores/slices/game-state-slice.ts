import type { StateCreator } from "zustand";
import type { Player, GameMode, Move, Sequence, Position } from "@/lib/types";
// Use canonicalization helpers from game logic so stored sequences match keys
import { canonicalSeqKey, canonicalSeqFromKey } from '@/lib/utils/game-logic'

export interface GameStateSlice {
  currentPlayer: Player;
  gameStatus: "waiting" | "playing" | "paused" | "completed";
  gameMode: GameMode;
  gameStartTime: number | null;
  moveHistory: Move[];
  usedSequences: Sequence[];
  usedPositions: Set<string>;
  showStartAlert: boolean;

  setCurrentPlayer: (player: Player) => void;
  setGameStatus: (status: "waiting" | "playing" | "paused" | "completed") => void;
  setGameMode: (mode: GameMode) => void;
  addMove: (move: Move) => void;
  addUsedSequences: (sequences: Sequence[]) => void;
  addUsedPositions: (positions: Position[]) => void;
  switchPlayer: () => void;
  startGame: (mode?: GameMode) => void;
  resetGameState: () => void;
  setShowStartAlert: (show: boolean) => void;
  confirmGameStart: () => void;
}


export const createGameStateSlice: StateCreator<GameStateSlice> = (set, get) => ({
  currentPlayer: "X",
  gameStatus: "waiting",
  gameMode: "timed",
  gameStartTime: null,
  moveHistory: [],
  usedSequences: [],
  usedPositions: new Set<string>(),
  showStartAlert: false,

  setCurrentPlayer: (player: Player) => {
    set({ currentPlayer: player })
  },

  setGameStatus: (status: "waiting" | "playing" | "paused" | "completed") => {
    set({ gameStatus: status });
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
    // Canonicalize incoming sequences using the same canonical key used by game-logic
    // so that sequence keys match and we avoid double-counting or omissions.
    const canonicalized = sequences.map((seq) => canonicalSeqFromKey(canonicalSeqKey(seq)))

    set({ usedSequences: [...usedSequences, ...canonicalized] })
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
    // Show the alert first instead of starting immediately
    set({ showStartAlert: true, gameMode: mode })
  },

  setShowStartAlert: (show: boolean) => {
    set({ showStartAlert: show })
  },

  confirmGameStart: () => {
    set({
      gameStatus: "playing",
      gameStartTime: Date.now(),
      currentPlayer: "X",
      showStartAlert: false,
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
      showStartAlert: false,
    })
  },
})

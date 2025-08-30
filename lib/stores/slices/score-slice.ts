import type { StateCreator } from "zustand"
import type { Player } from "@/lib/types"

export interface ScoreSlice {
  scores: Record<Player, number>

  updateScore: (player: Player, points: number) => void
  resetScores: () => void
  getWinner: () => Player | null
  isDraw: () => boolean
  getTotalScore: () => number
}

export const createScoreSlice: StateCreator<ScoreSlice> = (set, get) => ({
  scores: { X: 0, O: 0 },

  updateScore: (player: Player, points: number) => {
    const { scores } = get()
    set({
      scores: {
        ...scores,
        [player]: scores[player] + points,
      },
    })
  },

  resetScores: () => {
    set({ scores: { X: 0, O: 0 } })
  },

  getWinner: () => {
    const { scores } = get()
    if (scores.X > scores.O) return "X"
    if (scores.O > scores.X) return "O"
    return null
  },

  isDraw: () => {
    const { scores } = get()
    return scores.X === scores.O
  },

  getTotalScore: () => {
    const { scores } = get()
    return scores.X + scores.O
  },
})

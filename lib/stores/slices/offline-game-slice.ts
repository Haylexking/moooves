import type { StateCreator } from "zustand"
import type { GameState, Move, CasualGame } from "@/lib/types"

export interface OfflineGameSlice {
  currentOfflineGame: CasualGame | null
  isOfflineMode: boolean
  connectionType: "bluetooth" | "wifi" | null

  // Actions
  startOfflineGame: (connectionType: "bluetooth" | "wifi", opponentId: string) => void
  endOfflineGame: () => void
  handleOfflineMove: (move: Move) => void
  syncGameState: (gameState: GameState) => void
}

export const createOfflineGameSlice: StateCreator<OfflineGameSlice> = (set, get) => ({
  currentOfflineGame: null,
  isOfflineMode: false,
  connectionType: null,

  startOfflineGame: (connectionType: "bluetooth" | "wifi", opponentId: string) => {
    const offlineGame: CasualGame = {
      id: `offline-${Date.now()}`,
      player1Id: "local-player", // Current user
      player2Id: opponentId,
      connectionType,
      gameMode: "timed", // Default to timed for offline
      gameState: {
        board: Array(30)
          .fill(null)
          .map(() => Array(30).fill(null)),
        currentPlayer: "X",
        scores: { X: 0, O: 0 },
        gameStatus: "playing",
        usedSequences: [],
        moveHistory: [],
        gameStartTime: Date.now(),
        timeLeft: 10 * 60, // 10 minutes
      },
      createdAt: Date.now(),
    }

    set({
      currentOfflineGame: offlineGame,
      isOfflineMode: true,
      connectionType,
    })
  },

  endOfflineGame: () => {
    set({
      currentOfflineGame: null,
      isOfflineMode: false,
      connectionType: null,
    })
  },

  handleOfflineMove: (move: Move) => {
    const { currentOfflineGame } = get()
    if (!currentOfflineGame) return

    // Update the offline game state with the move
    const updatedGameState = {
      ...currentOfflineGame.gameState,
      moveHistory: [...currentOfflineGame.gameState.moveHistory, move],
      currentPlayer: currentOfflineGame.gameState.currentPlayer === "X" ? ("O" as const) : ("X" as const),
    }

    set({
      currentOfflineGame: {
        ...currentOfflineGame,
        gameState: updatedGameState,
      },
    })
  },

  syncGameState: (gameState: GameState) => {
    const { currentOfflineGame } = get()
    if (!currentOfflineGame) return

    set({
      currentOfflineGame: {
        ...currentOfflineGame,
        gameState,
      },
    })
  },
})

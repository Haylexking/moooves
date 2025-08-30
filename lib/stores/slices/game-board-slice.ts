import type { StateCreator } from "zustand"
import type { GameBoard, CellValue, Position } from "@/lib/types"

export interface GameBoardSlice {
  board: GameBoard
  initializeBoard: () => void
  updateCell: (row: number, col: number, value: CellValue) => void
  isBoardFull: () => boolean
  getAvailablePositions: () => Position[]
  getCellValue: (row: number, col: number) => CellValue
}

const createEmptyBoard = (): GameBoard => {
  return Array(30)
    .fill(null)
    .map(() => Array(30).fill(null))
}

export const createGameBoardSlice: StateCreator<GameBoardSlice> = (set, get) => ({
  board: createEmptyBoard(),

  initializeBoard: () => {
    set({ board: createEmptyBoard() })
  },

  updateCell: (row: number, col: number, value: CellValue) => {
    const { board } = get()
    if (board[row][col] !== null) return

    const newBoard = board.map((boardRow, r) => boardRow.map((cell, c) => (r === row && c === col ? value : cell)))

    set({ board: newBoard })
  },

  isBoardFull: () => {
    const { board } = get()
    return board.every((row) => row.every((cell) => cell !== null))
  },

  getAvailablePositions: () => {
    const { board } = get()
    const positions: Position[] = []

    for (let row = 0; row < 30; row++) {
      for (let col = 0; col < 30; col++) {
        if (board[row][col] === null) {
          positions.push([row, col])
        }
      }
    }

    return positions
  },

  getCellValue: (row: number, col: number) => {
    const { board } = get()
    return board[row][col]
  },
})

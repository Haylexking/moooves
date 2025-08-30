import { checkWinConditions, isValidPosition, getAvailableMoves } from "../game-logic"
import type { GameBoard } from "@/lib/types"

// Helper function to create a test board
function createTestBoard(): GameBoard {
  return Array(30)
    .fill(null)
    .map(() => Array(30).fill(null))
}

describe("Game Logic", () => {
  describe("checkWinConditions", () => {
    it("should detect horizontal 5-in-a-row on the 5th move", () => {
      const board = createTestBoard()

      // Place 5 X's horizontally
      for (let i = 0; i < 4; i++) {
        board[10][10 + i] = "X"
      }
      // Place the 5th X
      board[10][14] = "X"

      const result = checkWinConditions(board, "X", 10, 14, [], { X: 0, O: 0 })

      expect(result.newSequences).toHaveLength(1)
      expect(result.updatedScores.X).toBe(1)
      expect(result.newSequences[0]).toEqual([
        [10, 10],
        [10, 11],
        [10, 12],
        [10, 13],
        [10, 14],
      ])
    })

    it("should detect vertical 5-in-a-row on the 5th move", () => {
      const board = createTestBoard()

      // Place 5 O's vertically
      for (let i = 0; i < 4; i++) {
        board[5 + i][15] = "O"
      }
      // Place the 5th O
      board[9][15] = "O"

      const result = checkWinConditions(board, "O", 9, 15, [], { X: 0, O: 0 })

      expect(result.newSequences).toHaveLength(1)
      expect(result.updatedScores.O).toBe(1)
      expect(result.newSequences[0]).toEqual([
        [5, 15],
        [6, 15],
        [7, 15],
        [8, 15],
        [9, 15],
      ])
    })

    it("should detect diagonal 5-in-a-row (down-right) on the 5th move", () => {
      const board = createTestBoard()

      // Place 5 X's diagonally
      for (let i = 0; i < 4; i++) {
        board[5 + i][5 + i] = "X"
      }
      // Place the 5th X
      board[9][9] = "X"

      const result = checkWinConditions(board, "X", 9, 9, [], { X: 0, O: 0 })

      expect(result.newSequences).toHaveLength(1)
      expect(result.updatedScores.X).toBe(1)
      expect(result.newSequences[0]).toEqual([
        [5, 5],
        [6, 6],
        [7, 7],
        [8, 8],
        [9, 9],
      ])
    })

    it("should detect diagonal 5-in-a-row (down-left) on the 5th move", () => {
      const board = createTestBoard()

      // Place 5 O's diagonally (down-left)
      for (let i = 0; i < 4; i++) {
        board[5 + i][10 - i] = "O"
      }
      // Place the 5th O
      board[9][6] = "O"

      const result = checkWinConditions(board, "O", 9, 6, [], { X: 0, O: 0 })

      expect(result.newSequences).toHaveLength(1)
      expect(result.updatedScores.O).toBe(1)
      expect(result.newSequences[0]).toEqual([
        [5, 10],
        [6, 9],
        [7, 8],
        [8, 7],
        [9, 6],
      ])
    })

    it("should not count already used sequences", () => {
      const board = createTestBoard()

      // Place 5 X's horizontally
      for (let i = 0; i < 5; i++) {
        board[10][10 + i] = "X"
      }

      const usedSequences = [
        [
          [10, 10],
          [10, 11],
          [10, 12],
          [10, 13],
          [10, 14],
        ].sort((a, b) => a[0] - b[0] || a[1] - b[1]), // Ensure used sequence is sorted
      ]

      const result = checkWinConditions(board, "X", 10, 12, usedSequences, { X: 1, O: 0 })

      expect(result.newSequences).toHaveLength(0)
      expect(result.updatedScores.X).toBe(1) // No increase
    })

    it("should handle multiple sequences in one move (cross pattern)", () => {
      const board = createTestBoard()

      // Create a cross pattern with X at center (15,15)
      const centerRow = 15
      const centerCol = 15

      // Horizontal line (5 Xs)
      for (let i = -2; i <= 2; i++) {
        board[centerRow][centerCol + i] = "X"
      }

      // Vertical line (5 Xs)
      for (let i = -2; i <= 2; i++) {
        board[centerRow + i][centerCol] = "X"
      }

      // Place the central X (which completes both lines)
      board[centerRow][centerCol] = "X"

      const result = checkWinConditions(board, "X", centerRow, centerCol, [], { X: 0, O: 0 })

      expect(result.newSequences.length).toBe(2) // Expecting 2 new sequences
      expect(result.updatedScores.X).toBe(2) // Score should increase by 2
    })

    it("should handle sequences longer than 5 and count all 5-length subsequences", () => {
      const board = createTestBoard()

      // Place 6 X's horizontally
      for (let i = 0; i < 6; i++) {
        board[10][10 + i] = "X"
      }

      const result = checkWinConditions(board, "X", 10, 15, [], { X: 0, O: 0 })

      expect(result.newSequences).toHaveLength(2) // Two 5-in-a-row sequences: (10,10)-(10,14) and (10,11)-(10,15)
      expect(result.updatedScores.X).toBe(2)
    })
  })

  describe("isValidPosition", () => {
    it("should return true for valid positions", () => {
      expect(isValidPosition(0, 0)).toBe(true)
      expect(isValidPosition(15, 15)).toBe(true)
      expect(isValidPosition(29, 29)).toBe(true)
    })

    it("should return false for invalid positions", () => {
      expect(isValidPosition(-1, 0)).toBe(false)
      expect(isValidPosition(0, -1)).toBe(false)
      expect(isValidPosition(30, 0)).toBe(false)
      expect(isValidPosition(0, 30)).toBe(false)
    })
  })

  describe("getAvailableMoves", () => {
    it("should return all positions for empty board", () => {
      const board = createTestBoard()
      const moves = getAvailableMoves(board)

      expect(moves).toHaveLength(900) // 30 * 30
    })

    it("should exclude occupied positions", () => {
      const board = createTestBoard()
      board[0][0] = "X"
      board[15][15] = "O"

      const moves = getAvailableMoves(board)

      expect(moves).toHaveLength(898) // 900 - 2
      expect(moves).not.toContainEqual([0, 0])
      expect(moves).not.toContainEqual([15, 15])
    })
  })
})

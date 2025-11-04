import { checkWinConditions } from '@/lib/utils/game-logic'
import { createEmptyBoard, placeStones } from './test-utils'
import type { GameBoard, Position, Player } from '@/lib/types'

describe('Comprehensive Game Scoring Tests', () => {
  let board: GameBoard
  
  beforeEach(() => {
    board = createEmptyBoard()
  })

  describe('Basic Scoring', () => {
    test('scores a simple horizontal 5-in-a-row', () => {
      const testBoard = placeStones(board, [
        [7, 7, 'X'], [7, 8, 'X'], [7, 9, 'X'], [7, 10, 'X'], [7, 11, 'X']
      ])
      const result = checkWinConditions(testBoard, 'X', 7, 11, [], { X: 0, O: 0 }, new Set())
      expect(result.updatedScores.X).toBe(1)
      expect(result.newSequences.length).toBe(1)
    })

    test('scores a vertical 5-in-a-row', () => {
      const testBoard = placeStones(board, [
        [5, 10, 'O'], [6, 10, 'O'], [7, 10, 'O'], [8, 10, 'O'], [9, 10, 'O']
      ])
      const result = checkWinConditions(testBoard, 'O', 9, 10, [], { X: 0, O: 0 }, new Set())
      expect(result.updatedScores.O).toBe(1)
    })

    test('scores a diagonal 5-in-a-row (top-left to bottom-right)', () => {
      const testBoard = placeStones(board, [
        [5, 5, 'X'], [6, 6, 'X'], [7, 7, 'X'], [8, 8, 'X'], [9, 9, 'X']
      ])
      const result = checkWinConditions(testBoard, 'X', 9, 9, [], { X: 0, O: 0 }, new Set())
      expect(result.updatedScores.X).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    test('does not score blocked sequences', () => {
      // Blocked on both ends
      const testBoard = placeStones(board, [
        [5, 5, 'O'], [5, 6, 'X'], [5, 7, 'X'], [5, 8, 'X'], [5, 9, 'X'], [5, 10, 'X'], [5, 11, 'O']
      ])
      const result = checkWinConditions(testBoard, 'X', 5, 10, [], { X: 0, O: 0 }, new Set())
      expect(result.updatedScores.X).toBe(1) // Should still score even if blocked
    })

    test('scores multiple non-overlapping sequences', () => {
      const testBoard = placeStones(board, [
        // First sequence
        [3, 3, 'X'], [3, 4, 'X'], [3, 5, 'X'], [3, 6, 'X'], [3, 7, 'X'],
        // Second sequence (vertical)
        [10, 10, 'X'], [11, 10, 'X'], [12, 10, 'X'], [13, 10, 'X'], [14, 10, 'X']
      ])
      const result1 = checkWinConditions(testBoard, 'X', 3, 7, [], { X: 0, O: 0 }, new Set())
      const result2 = checkWinConditions(testBoard, 'X', 14, 10, result1.newSequences, result1.updatedScores, new Set(result1.newUsedPositions.map(p => `${p[0]},${p[1]}`)))
      expect(result1.updatedScores.X).toBe(1)
      expect(result2.updatedScores.X).toBe(2)
    })
  })

  describe('Sequence Validation', () => {
    test('does not score sequences shorter than 5', () => {
      const testBoard = placeStones(board, [
        [0, 0, 'O'], [0, 1, 'O'], [0, 2, 'O'], [0, 3, 'O']
      ])
      const result = checkWinConditions(testBoard, 'O', 0, 3, [], { X: 0, O: 0 }, new Set())
      expect(result.updatedScores.O).toBe(0)
    })

    test('handles board edges correctly', () => {
      // Sequence starting at the edge
      const testBoard = placeStones(board, [
        [0, 0, 'X'], [0, 1, 'X'], [0, 2, 'X'], [0, 3, 'X'], [0, 4, 'X']
      ])
      const result = checkWinConditions(testBoard, 'X', 0, 4, [], { X: 0, O: 0 }, new Set())
      expect(result.updatedScores.X).toBe(1)
    })
  })
})

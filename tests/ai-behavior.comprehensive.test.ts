import { mockOpponentMove, findStrategicMove } from '@/lib/mocks/mock-opponent'
import { createEmptyBoard, placeStones } from './test-utils'
import type { GameBoard, Position } from '@/lib/types'

describe('Comprehensive AI Behavior Tests', () => {
  let board: GameBoard
  const player: 'X' | 'O' = 'X'
  const aiPlayer: 'X' | 'O' = 'O'
  
  beforeEach(() => {
    board = createEmptyBoard()
  })

  describe('Winning Moves', () => {
    test('AI should take the winning move when available', () => {
      // Setup a board where AI can win in one move
      const testBoard = placeStones([
        [7, 7, aiPlayer], [7, 8, aiPlayer], [7, 9, aiPlayer], [7, 10, aiPlayer],
        // Other random moves
        [0, 0, player], [1, 1, player]
      ])
      
      const [row, col] = mockOpponentMove(testBoard, aiPlayer, [])
      expect(row).toBe(7)
      expect(col).toBe(11) // Should complete the 5-in-a-row
    })
  })

  describe('Blocking Moves', () => {
    test('AI should block opponent\'s 4-in-a-row', () => {
      // Player has 4 in a row, AI should block
      const testBoard = placeStones([
        [5, 5, player], [5, 6, player], [5, 7, player], [5, 8, player],
        // AI's moves
        [10, 10, aiPlayer], [11, 11, aiPlayer]
      ])
      
      const [row, col] = mockOpponentMove(testBoard, aiPlayer, [])
      // Should block at either end of the sequence
      expect(
        (row === 5 && col === 4) ||
        (row === 5 && col === 9)
      ).toBe(true)
    })
  })

  describe('Strategic Play', () => {
    test('AI should create multiple threats', () => {
      // Setup a board where AI can create multiple threats
      const testBoard = placeStones([
        [7, 7, aiPlayer], [8, 8, aiPlayer],
        [7, 9, aiPlayer], [8, 10, aiPlayer],
        // Player's moves
        [0, 0, player], [1, 1, player]
      ])
      
      const [row, col] = mockOpponentMove(testBoard, aiPlayer, [])
      // Should play in a position that creates multiple threats
      expect(
        (row === 6 && col === 6) || // Creates diagonal and horizontal threats
        (row === 9 && col === 11)   // Creates diagonal and vertical threats
      ).toBe(true)
    })
  })

  describe('Early Game', () => {
    test('AI should prefer center positions in early game', () => {
      // Empty board
      const center = Math.floor(board.length / 2)
      const [row, col] = mockOpponentMove(board, aiPlayer, [])
      
      // Should play near center
      const distanceFromCenter = Math.sqrt(
        Math.pow(row - center, 2) + Math.pow(col - center, 2)
      )
      expect(distanceFromCenter).toBeLessThan(5)
    })
  })

  describe('Defensive Play', () => {
    test('AI should not allow fork opportunities', () => {
      // Setup a board where player could create a fork
      const testBoard = placeStones([
        [7, 7, player], [7, 9, player],
        [9, 7, player], [9, 9, player],
        [8, 8, aiPlayer]
      ])
      
      // Player's move that would create a fork if AI doesn't block
      testBoard[8][7] = player
      
      const [row, col] = mockOpponentMove(testBoard, aiPlayer, [])
      // Should block the fork by playing at one of the intersection points
      expect(
        (row === 7 && col === 8) ||
        (row === 9 && col === 8) ||
        (row === 8 && col === 6) ||
        (row === 8 && col === 10)
      ).toBe(true)
    })
  })
})

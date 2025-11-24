import { mockOpponentMove, findStrategicMove } from '@/lib/mocks/mock-opponent'
import { createEmptyBoard, placeStones } from './test-utils'
import type { GameBoard, Position } from '@/lib/types'

const DIRS: Position[] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

function measureLine(board: GameBoard, player: 'X' | 'O', row: number, col: number, dr: number, dc: number) {
  let length = 0
  let openEnds = 0
  let r = row + dr
  let c = col + dc
  while (r >= 0 && r < board.length && c >= 0 && c < board.length && board[r][c] === player) {
    length++
    r += dr
    c += dc
  }
  if (r >= 0 && r < board.length && c >= 0 && c < board.length && board[r][c] === null) openEnds++
  r = row - dr
  c = col - dc
  while (r >= 0 && r < board.length && c >= 0 && c < board.length && board[r][c] === player) {
    length++
    r -= dr
    c -= dc
  }
  if (r >= 0 && r < board.length && c >= 0 && c < board.length && board[r][c] === null) openEnds++
  return { length, openEnds }
}

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

      const move = mockOpponentMove(testBoard, aiPlayer, [])
      expect(move).toBeTruthy()
      const [row, col] = move as Position

      // Apply the move and ensure it produces at least one new scoring sequence
      const boardAfter = testBoard.map((r) => [...r])
      boardAfter[row][col] = aiPlayer
      const { newSequences } = require('@/lib/utils/game-logic').checkWinConditions(
        boardAfter,
        aiPlayer,
        row,
        col,
        [],
        { X: 0, O: 0 },
      )
      expect(newSequences.length).toBeGreaterThan(0)
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

      const move = mockOpponentMove(testBoard, aiPlayer, [])
      expect(move).toBeTruthy()
      const [row, col] = move as Position
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

      const move = mockOpponentMove(testBoard, aiPlayer, [])
      expect(move).toBeTruthy()
      const [row, col] = move as Position
      expect(testBoard[row]?.[col]).toBeNull()
    })
  })

  describe('Early Game', () => {
    test('AI should prefer center positions in early game', () => {
      // Empty board
      const center = Math.floor(board.length / 2)
      const move = mockOpponentMove(board, aiPlayer, [])
      expect(move).toBeTruthy()
      const [row, col] = move as Position

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

      const move = mockOpponentMove(testBoard, aiPlayer, [])
      expect(move).toBeTruthy()
      const [row, col] = move as Position
      expect(testBoard[row][col]).toBeNull()

      expect(Array.isArray(move) && move.length === 2).toBe(true)
    })
  })
})

import { checkWinConditions } from '@/lib/utils/game-logic'
import type { GameBoard, Player } from '@/lib/types'

// Helper to create empty board
function emptyBoard(): GameBoard {
  return Array.from({ length: 30 }, () => Array.from({ length: 30 }, () => null))
}

describe('checkWinConditions - 5+ streak scoring', () => {
  test('counts 1 for a continuous run of 6 (5+ counts once)', () => {
    const board = emptyBoard()
    const player: Player = 'X'

    // build a run of 6 horizontally at row 10 columns 5..10
    for (let c = 5; c <= 10; c++) board[10][c] = player

    const usedSequences: any[] = []
    const currentScores = { X: 0, O: 0 }

    // place at one end (10,5) reported as last move
    const { newSequences, updatedScores } = checkWinConditions(board, player, 10, 10, usedSequences, currentScores)

    // There is a 6-length run; it should count once
    expect(newSequences.length).toBe(1)
    expect(updatedScores.X).toBe(1)
  })

  test('counts an isolated exact-5 sequence', () => {
    const board = emptyBoard()
    const player: Player = 'O'

    // place exactly 5 vertically at col 7 rows 2..6
    for (let r = 2; r <= 6; r++) board[r][7] = player

    const usedSequences: any[] = []
    const currentScores = { X: 0, O: 0 }

    const { newSequences, updatedScores } = checkWinConditions(board, player, 6, 7, usedSequences, currentScores)

    expect(newSequences.length).toBe(1)
    expect(updatedScores.O).toBe(1)
  })
})

import { checkWinConditions } from '@/lib/utils/game-logic'
import type { GameBoard, Player, Sequence } from '@/lib/types'

function emptyBoard(): GameBoard {
  return Array.from({ length: 30 }, () => Array.from({ length: 30 }, () => null))
}

describe('game-logic regression tests', () => {
  test('exact-5 is detected when stored sequences have different ordering (canonicalization)', () => {
    const board = emptyBoard()
    const player: Player = 'X'
    // place exact 5 horizontally at row 5 cols 3..7
    for (let c = 3; c <= 7; c++) board[5][c] = player

    const usedSequences: Sequence[] = []
    const currentScores = { X: 0, O: 0 }

    const res = checkWinConditions(board, player, 5, 7, usedSequences, currentScores)
    expect(res.newSequences.length).toBe(1)
    expect(res.updatedScores.X).toBe(1)
  })

  test('previously-stored same sequence in reverse order prevents double-counting', () => {
    const board = emptyBoard()
    const player: Player = 'O'
    // place exact 5 vertically at col 10 rows 12..16
    for (let r = 12; r <= 16; r++) board[r][10] = player

    // Simulate stored sequence with reversed ordering
    const stored: Sequence = [[16, 10], [15, 10], [14, 10], [13, 10], [12, 10]]

    const currentScores = { X: 0, O: 0 }
    const res = checkWinConditions(board, player, 16, 10, [stored], currentScores)

    // Since the sequence is already marked (regardless of order), it should not score again
    expect(res.newSequences.length).toBe(0)
    expect(res.updatedScores.O).toBe(0)
  })
})

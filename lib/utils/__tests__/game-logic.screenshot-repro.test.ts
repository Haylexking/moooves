import { checkWinConditions } from '@/lib/utils/game-logic'
import type { GameBoard, Player, Sequence } from '@/lib/types'

// Create an empty board helper
function emptyBoard(): GameBoard {
  return Array.from({ length: 30 }, () => Array.from({ length: 30 }, () => null))
}

describe('checkWinConditions - screenshot repro', () => {
  test('detects the visible exact-5 cluster (approximation)', () => {
    const board = emptyBoard()
    const player: Player = 'X'

    // Approximate the circled cluster from the screenshot: build a vertical-ish cluster
    // We'll place a vertical 5 at column 20 rows 10..14 and some nearby X/O to mimic neighborhood
    for (let r = 10; r <= 14; r++) board[r][20] = player

    // Add a few surrounding O markers to ensure we are not extendable
    board[9][20] = null
    board[15][20] = null

    const usedSequences: Sequence[] = []
    const currentScores = { X: 0, O: 0 }

    // Last move assumed to be at the bottom of the five (14,20)
    const { newSequences, updatedScores } = checkWinConditions(board, player, 14, 20, usedSequences, currentScores)

    expect(newSequences.length).toBeGreaterThanOrEqual(1)
    expect(updatedScores.X).toBeGreaterThanOrEqual(1)
  })
})

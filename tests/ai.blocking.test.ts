import { mockOpponentMove } from '@/lib/mocks/mock-opponent'
import type { GameBoard, Player } from '@/lib/types'

function emptyBoard(): GameBoard {
  return Array.from({ length: 30 }, () => Array.from({ length: 30 }, () => null))
}

describe('AI blocking behavior', () => {
  test('AI blocks opponent immediate 5-in-a-row even if it has a winning move that would allow opponent to win next turn', () => {
    const board = emptyBoard()

    // Setup scenario:
    // Opponent X has 4 in a row and can win by playing (10,10)
    // AI (O) currently has a potential winning move elsewhere, but placing it would leave X the immediate win

    // Place X at (10,6)-(10,9)
    board[10][6] = 'X'
    board[10][7] = 'X'
    board[10][8] = 'X'
    board[10][9] = 'X'

    // AI has a near-win at (5,5)-(5,8) but not immediate
    board[5][5] = 'O'
    board[5][6] = 'O'
    board[5][7] = 'O'
    board[5][8] = null

    const move = mockOpponentMove(board, 'O')

    // AI should block at (10,10) or (10,5) depending on open ends, but must prevent X from getting 5
    expect(move).not.toBeNull()
    const [r, c] = move as [number, number]
    // Ensure the chosen move lies on or adjacent to the danger row 10 between cols 5..10
    const blocksOpponent = r === 10 && c >= 5 && c <= 10
    expect(blocksOpponent).toBe(true)
  })
})

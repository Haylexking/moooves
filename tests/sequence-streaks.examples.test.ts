import { checkWinConditions } from '@/lib/utils/game-logic'
import type { GameBoard, Player, Sequence, Position } from '@/lib/types'

function emptyBoard(): GameBoard {
  return Array.from({ length: 30 }, () => Array.from({ length: 30 }, () => null))
}

function boardFromLine(line: string): { board: GameBoard; lastMoves: Array<{ player: Player; row: number; col: number }> } {
  const board = emptyBoard()
  const lastMoves: Array<{ player: Player; row: number; col: number }> = []
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === 'X' || ch === 'O') {
      board[0][i] = ch
      lastMoves.push({ player: ch, row: 0, col: i })
    }
  }
  return { board, lastMoves }
}

function scoreLine(line: string) {
  const { board, lastMoves } = boardFromLine(line)
  let scores = { X: 0, O: 0 }
  let usedSequences: Sequence[] = []
  const usedPositions = new Set<string>()

  // iterate over all placed cells and invoke scorer; this simulates moves having been made
  for (const lm of lastMoves) {
    const res = checkWinConditions(board, lm.player, lm.row, lm.col, usedSequences, scores, usedPositions)
    if (res.newSequences.length > 0) {
      usedSequences = [...usedSequences, ...res.newSequences]
      for (const p of res.newUsedPositions) usedPositions.add(`${p[0]},${p[1]}`)
    }
    scores = res.updatedScores
  }

  return scores
}

describe('Sequence streak examples (5+ streak counts once)', () => {
  test.each([
    { line: 'XOXXXXXXOXXXXXXX', expected: { X: 2, O: 0 } },
    { line: 'OXOOOOOXXOOOXXXXXO', expected: { X: 1, O: 1 } },
    { line: 'XXXXX', expected: { X: 1, O: 0 } },
    { line: 'OOOOO', expected: { X: 0, O: 1 } },
    { line: 'XXXXXXXOXXXXX', expected: { X: 2, O: 0 } },
    { line: 'OOOOOXXOOXXXXOOOOO', expected: { X: 0, O: 2 } },
    { line: 'OXOXOXOXO', expected: { X: 0, O: 0 } },
  ])('line %s -> X: $expected.X, O: $expected.O', ({ line, expected }) => {
    const scores = scoreLine(line)
    expect(scores).toEqual(expected)
  })
})

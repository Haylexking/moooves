/**
 * Tests proving the two scoring bugs are fixed:
 *
 * Bug 1 (Critical): Cross-direction sequences were blocked when any of their cells
 *   belonged to a previously scored line in a different direction.
 *
 * Bug 2 (Moderate): When a run of 10+ pieces existed and the first 5 were already
 *   scored, the non-overlapping second block of 5 was never detected.
 */

import { checkWinConditions, calculateGameStateFromBoard } from "../game-logic"
import type { GameBoard, Position, Sequence } from "@/lib/types"

function emptyBoard(): GameBoard {
  return Array.from({ length: 30 }, () => Array.from({ length: 30 }, () => null))
}

// ─────────────────────────────────────────────────────────────────────────────
// Bug 1 — Cross-direction sequences must score independently
// ─────────────────────────────────────────────────────────────────────────────

describe("Bug 1 fix — cross-direction sequences score independently", () => {
  it("diagonal through a cell already used in a horizontal score still scores", () => {
    const board = emptyBoard()

    // Horizontal 5-in-a-row for X: row 5, cols 3–7
    for (let c = 3; c <= 7; c++) board[5][c] = "X"

    // Diagonal 5-in-a-row for X: (1,3),(2,4),(3,5),(4,6),(5,7)
    // Cell (5,7) is shared with the horizontal line above
    board[1][3] = "X"
    board[2][4] = "X"
    board[3][5] = "X"
    board[4][6] = "X"
    // (5,7) already set above

    // Simulate: horizontal was scored first (placed in usedSequences)
    const horizontalSeq: Position[] = [[5,3],[5,4],[5,5],[5,6],[5,7]]
    const usedSequences: Sequence[] = [horizontalSeq]
    const scores = { X: 1, O: 0 } // 1 from the horizontal

    // Now place the final diagonal piece at (5,7) — this completes the diagonal
    const result = checkWinConditions(board, "X", 5, 7, usedSequences, scores)

    expect(result.newSequences.length).toBe(1)
    expect(result.updatedScores.X).toBe(2)
  })

  it("vertical through a cell already used in a horizontal score still scores", () => {
    const board = emptyBoard()

    // Horizontal 5-in-a-row: row 10, cols 10–14
    for (let c = 10; c <= 14; c++) board[10][c] = "X"

    // Vertical 5-in-a-row: col 12, rows 8–12
    // Cell (10,12) is shared with the horizontal
    for (let r = 8; r <= 12; r++) board[r][12] = "X"

    const horizontalSeq: Position[] = [[10,10],[10,11],[10,12],[10,13],[10,14]]
    const usedSequences: Sequence[] = [horizontalSeq]
    const scores = { X: 1, O: 0 }

    // Last move: (12, 12) completes the vertical
    const result = checkWinConditions(board, "X", 12, 12, usedSequences, scores)

    expect(result.newSequences.length).toBe(1)
    expect(result.updatedScores.X).toBe(2)
  })

  it("diagonal through a cell already used in a vertical score still scores", () => {
    const board = emptyBoard()

    // Vertical 5-in-a-row for O: col 5, rows 2–6
    for (let r = 2; r <= 6; r++) board[r][5] = "O"

    // Diagonal (down-right) 5-in-a-row for O: (2,1),(3,2),(4,3),(5,4),(6,5)
    // Cell (6,5) is shared with the vertical
    board[2][1] = "O"
    board[3][2] = "O"
    board[4][3] = "O"
    board[5][4] = "O"
    // (6,5) already set

    const verticalSeq: Position[] = [[2,5],[3,5],[4,5],[5,5],[6,5]]
    const usedSequences: Sequence[] = [verticalSeq]
    const scores = { X: 0, O: 1 }

    const result = checkWinConditions(board, "O", 6, 5, usedSequences, scores)

    expect(result.newSequences.length).toBe(1)
    expect(result.updatedScores.O).toBe(2)
  })

  it("two diagonals crossing at the same cell both score", () => {
    const board = emptyBoard()

    // Diagonal DR for X: (5,5),(6,6),(7,7),(8,8),(9,9)
    for (let i = 0; i < 5; i++) board[5 + i][5 + i] = "X"

    // Diagonal DL for X: (5,9),(6,8),(7,7),(8,6),(9,5)
    // Cell (7,7) is shared with DR diagonal
    board[5][9] = "X"
    board[6][8] = "X"
    // (7,7) already set
    board[8][6] = "X"
    board[9][5] = "X"

    // DR diagonal scored first
    const drSeq: Position[] = [[5,5],[6,6],[7,7],[8,8],[9,9]]
    const usedSequences: Sequence[] = [drSeq]
    const scores = { X: 1, O: 0 }

    // Last move completes the DL diagonal at (9,5)
    const result = checkWinConditions(board, "X", 9, 5, usedSequences, scores)

    expect(result.newSequences.length).toBe(1)
    expect(result.updatedScores.X).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Bug 2 — Sliding window finds the non-overlapping second block in a long run
// ─────────────────────────────────────────────────────────────────────────────

describe("Bug 2 fix — non-overlapping extensions of a scored run score again", () => {
  it("placing the 10th consecutive piece scores the second non-overlapping block", () => {
    const board = emptyBoard()

    // X has pieces at row 0, cols 0–9 (10 in a row)
    for (let c = 0; c <= 9; c++) board[0][c] = "X"

    // Simulate: cols 0–4 were already scored
    const firstSeq: Position[] = [[0,0],[0,1],[0,2],[0,3],[0,4]]
    const usedSequences: Sequence[] = [firstSeq]
    const scores = { X: 1, O: 0 }

    // The 10th piece was just placed at (0,9)
    const result = checkWinConditions(board, "X", 0, 9, usedSequences, scores)

    expect(result.newSequences.length).toBe(1)
    expect(result.updatedScores.X).toBe(2)
  })

  it("single-cell extension of a scored run does NOT score (cols 0–4 scored, then [5] added)", () => {
    const board = emptyBoard()

    // X at cols 0–5
    for (let c = 0; c <= 5; c++) board[0][c] = "X"

    const firstSeq: Position[] = [[0,0],[0,1],[0,2],[0,3],[0,4]]
    const usedSequences: Sequence[] = [firstSeq]
    const scores = { X: 1, O: 0 }

    // Only 1 new piece at (0,5); the resulting sequence [0-5] has no fresh 5-window
    // because windows [0-4] is locked and [1-5] still overlaps locked positions [1-4]
    const result = checkWinConditions(board, "X", 0, 5, usedSequences, scores)

    expect(result.newSequences.length).toBe(0)
    expect(result.updatedScores.X).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// calculateGameStateFromBoard — same cross-direction fix
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateGameStateFromBoard — cross-direction sequences both score", () => {
  it("scores a horizontal and a crossing diagonal independently", () => {
    const board = emptyBoard()

    // Horizontal 5-in-a-row: row 10, cols 10–14
    for (let c = 10; c <= 14; c++) board[10][c] = "X"

    // Diagonal DR 5-in-a-row: (8,10),(9,11),(10,12),(11,13),(12,14)
    // shares (10,12) with the horizontal
    board[8][10]  = "X"
    board[9][11]  = "X"
    // (10,12) already set
    board[11][13] = "X"
    board[12][14] = "X"

    const { scores } = calculateGameStateFromBoard(board)

    // Both directions should score 1 each
    expect(scores.X).toBe(2)
    expect(scores.O).toBe(0)
  })

  it("scores a vertical and a crossing diagonal independently", () => {
    const board = emptyBoard()

    // Vertical 5-in-a-row: col 5, rows 5–9
    for (let r = 5; r <= 9; r++) board[r][5] = "X"

    // Diagonal DL 5-in-a-row: (5,9),(6,8),(7,7),(8,6),(9,5)
    // shares (9,5) with the vertical
    board[5][9] = "X"
    board[6][8] = "X"
    board[7][7] = "X"
    board[8][6] = "X"
    // (9,5) already set

    const { scores } = calculateGameStateFromBoard(board)

    expect(scores.X).toBe(2)
    expect(scores.O).toBe(0)
  })

  it("scores horizontal + vertical + both diagonals through the same center cell", () => {
    const board = emptyBoard()
    const cx = 15, cy = 15

    // Horizontal: (15,13)–(15,17)
    for (let c = cx - 2; c <= cx + 2; c++) board[cy][c] = "X"

    // Vertical: (13,15)–(17,15)
    for (let r = cy - 2; r <= cy + 2; r++) board[r][cx] = "X"

    // Diagonal DR: (13,13)–(17,17)
    for (let i = -2; i <= 2; i++) board[cy + i][cx + i] = "X"

    // Diagonal DL: (13,17)–(17,13)
    for (let i = -2; i <= 2; i++) board[cy + i][cx - i] = "X"

    const { scores } = calculateGameStateFromBoard(board)

    // All four 5-in-a-rows share the center cell — each should still score
    expect(scores.X).toBe(4)
  })
})

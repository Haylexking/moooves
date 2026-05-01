import { checkWinConditions } from "../game-logic"
import type { GameBoard, Position } from "@/lib/types"

function createTestBoard(): GameBoard {
  return Array(30)
    .fill(null)
    .map(() => Array(30).fill(null))
}

describe("checkWinConditions additional cases", () => {
  it("handles a move that doesn't create a sequence", () => {
    const board = createTestBoard()
    board[0][0] = "X"
    const result = checkWinConditions(board, "O", 1, 1, [], { X: 0, O: 0 })
    expect(result.newSequences).toHaveLength(0)
    expect(result.updatedScores.O).toBe(0)
  })

  it("does not double-count a horizontal sequence already recorded in usedSequences", () => {
    const board = createTestBoard()
    // A horizontal 6-run; the first 5 were already scored in a previous move
    for (let i = 0; i < 6; i++) {
      board[10][10 + i] = "X"
    }

    // Represent the previously scored sequence via usedSequences (not raw usedPositions)
    const usedSeqs: Position[][] = [[[10,10],[10,11],[10,12],[10,13],[10,14]]]
    const result = checkWinConditions(board, "X", 10, 15, usedSeqs, { X: 0, O: 0 })
    // [10,10..14] is locked in the horizontal direction; [10,11..15] shares [10,11..14]
    // which are also locked — no new score expected for a 1-cell extension
    expect(result.newSequences.length).toBe(0)
  })
})

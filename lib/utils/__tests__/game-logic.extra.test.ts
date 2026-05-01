import { checkWinConditions } from "../game-logic"
import type { GameBoard, Position } from "@/lib/types"

function createTestBoard(): GameBoard {
  return Array(30)
    .fill(null)
    .map(() => Array(30).fill(null))
}

describe("checkWinConditions extra cases", () => {
  it("handles a move at the top-left corner without blowing up", () => {
    const board = createTestBoard()
    board[0][0] = "X"
    const result = checkWinConditions(board, "X", 0, 0, [], { X: 0, O: 0 })
    expect(result.newSequences.length).toBe(0)
  })

  it("doesn't re-score an exact sequence already recorded in usedSequences", () => {
    const board = createTestBoard()
    for (let i = 0; i < 5; i++) {
      board[2][2 + i] = "O"
    }
    // The exact same 5-in-a-row is already in usedSequences
    const usedSeqs: Position[][] = [[[2,2],[2,3],[2,4],[2,5],[2,6]]]
    const result = checkWinConditions(board, "O", 2, 6, usedSeqs, { X: 0, O: 0 })
    expect(result.newSequences.length).toBe(0)
  })
})

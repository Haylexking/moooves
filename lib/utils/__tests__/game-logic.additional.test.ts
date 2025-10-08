import { checkWinConditions } from "../game-logic"
import type { GameBoard } from "@/lib/types"

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

  it("does not double-count sequences that overlap usedPositions", () => {
    const board = createTestBoard()
    // make a horizontal 6 sequence but mark one subsequence as used via usedPositions
    for (let i = 0; i < 6; i++) {
      board[10][10 + i] = "X"
    }

    const usedPositions = new Set<string>(["10,10","10,11","10,12","10,13","10,14"])
    const result = checkWinConditions(board, "X", 10, 15, [], { X: 0, O: 0 }, usedPositions)
    // No subsequence should be counted because usedPositions overlaps the candidate subsequences
    expect(result.newSequences.length).toBe(0)
  })
})

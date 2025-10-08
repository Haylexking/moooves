import { checkWinConditions } from "../game-logic"
import type { GameBoard } from "@/lib/types"

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

  it("doesn't count sequences if positions are already used via usedPositions set", () => {
    const board = createTestBoard()
    for (let i = 0; i < 5; i++) {
      board[2][2 + i] = "O"
    }
    const usedPositions = new Set<string>(["2,2","2,3","2,4","2,5","2,6"])
    const result = checkWinConditions(board, "O", 2, 6, [], { X: 0, O: 0 }, usedPositions)
    expect(result.newSequences.length).toBe(0)
  })
})

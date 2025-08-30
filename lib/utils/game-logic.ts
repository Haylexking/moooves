import type { GameBoard, Player, Position, Sequence } from "@/lib/types"

// All 8 directions: horizontal, vertical, and diagonal
const DIRECTIONS = [
  [0, 1], // horizontal right
  [1, 0], // vertical down
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
  // No need for opposite directions, as findSequenceInDirection handles both ways
]

export function checkWinConditions(
  board: GameBoard,
  player: Player,
  row: number,
  col: number,
  usedSequences: Sequence[],
  currentScores: Record<Player, number>,
  usedPositions: Set<string> = new Set(),
): { newSequences: Sequence[]; updatedScores: Record<Player, number>; newUsedPositions: Position[] } {
  const newSequences: Sequence[] = []
  const newUsedPositions: Position[] = []
  let scoreIncrease = 0

  // Check each direction (and its opposite implicitly by findSequenceInDirection)
  for (const [dr, dc] of DIRECTIONS) {
    const sequence = findSequenceInDirection(board, player, row, col, dr, dc)

    if (sequence.length >= 5) {
      // Check all possible 5-in-a-row subsequences within this longer sequence
      for (let i = 0; i <= sequence.length - 5; i++) {
        const fiveSequence = sequence.slice(i, i + 5)

        // Sort the sequence to ensure consistent comparison regardless of discovery order
        const sortedFiveSequence = fiveSequence.sort((a, b) => a[0] - b[0] || a[1] - b[1])

        const hasUsedPosition = sortedFiveSequence.some(([r, c]) => usedPositions.has(`${r},${c}`))

        if (!isSequenceUsed(sortedFiveSequence, usedSequences) && !hasUsedPosition) {
          newSequences.push(sortedFiveSequence)
          newUsedPositions.push(...sortedFiveSequence)
          scoreIncrease++
        }
      }
    }
  }

  const updatedScores = {
    ...currentScores,
    [player]: currentScores[player] + scoreIncrease,
  }

  return { newSequences, updatedScores, newUsedPositions }
}

// Utility function to check if a position is valid
export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 30 && col >= 0 && col < 30
}

// Revised function to find the full sequence in a given direction (and its opposite)
function findSequenceInDirection(
  board: GameBoard,
  player: Player,
  startRow: number,
  startCol: number,
  dr: number,
  dc: number,
): Position[] {
  const sequence: Position[] = [[startRow, startCol]] // Start with the current cell

  // Check forward direction
  let r = startRow + dr
  let c = startCol + dc
  while (isValidPosition(r, c) && board[r][c] === player) {
    sequence.push([r, c])
    r += dr
    c += dc
  }

  // Check backward direction
  r = startRow - dr
  c = startCol - dc
  while (isValidPosition(r, c) && board[r][c] === player) {
    sequence.unshift([r, c]) // Add to the beginning of the array
    r -= dr
    c -= dc
  }

  return sequence
}

function isSequenceUsed(sequence: Position[], usedSequences: Sequence[]): boolean {
  // Compare sorted sequences to ensure order doesn't matter for uniqueness
  return usedSequences.some((usedSeq) => {
    if (usedSeq.length !== sequence.length) return false
    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i][0] !== usedSeq[i][0] || sequence[i][1] !== usedSeq[i][1]) {
        return false
      }
    }
    return true
  })
}

// Utility function to get available moves
export function getAvailableMoves(board: GameBoard): Position[] {
  const moves: Position[] = []

  for (let row = 0; row < 30; row++) {
    for (let col = 0; col < 30; col++) {
      if (board[row][col] === null) {
        moves.push([row, col])
      }
    }
  }

  return moves
}

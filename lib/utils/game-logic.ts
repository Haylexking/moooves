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
  const awardedKeys = new Set<string>()
  // Track positions that are already used from previous turns to avoid re-scoring them.
  const previouslyUsed = new Set<string>(usedPositions)

  // Build a quick lookup of already-used sequences using a canonical string key
  const usedSequenceKeys = new Set<string>(usedSequences.map((s) => canonicalSeqKey(s)))

  // Check each direction (and its opposite implicitly by findSequenceInDirection)
  for (const [dr, dc] of DIRECTIONS) {
    const sequence = findSequenceInDirection(board, player, row, col, dr, dc)

    // For sequences of 5 or more, check for valid 5-in-a-row
    if (sequence.length >= 5) {
      // Only check the first valid 5-in-a-row in this direction
      // to avoid multiple points for overlapping sequences
      const block = sequence.slice(0, 5)
      
      // Check if any position in this block is already used
      const hasUsed = block.some(([r, c]) => previouslyUsed.has(`${r},${c}`))
      if (hasUsed) continue
      
      // Any 5-in-a-row sequence is valid, regardless of being boxed in by opponent
      // We only need to check if the sequence is already used

      const blockKey = canonicalSeqKey(block)
      if (!usedSequenceKeys.has(blockKey) && !awardedKeys.has(blockKey)) {
        const canonicalSeq = canonicalSeqFromKey(blockKey)
        newSequences.push(canonicalSeq)
        newUsedPositions.push(...canonicalSeq)
        awardedKeys.add(blockKey)
        scoreIncrease++
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

// Create a canonical key for a sequence that is orientation-insensitive but preserves
// adjacency (so diagonals stay correctly ordered). We compute both forward and
// reversed string forms and pick the lexicographically smaller one as canonical.
export function canonicalSeqKey(sequence: Position[]): string {
  if (!sequence || sequence.length === 0) return ""
  const forward = sequence.map(([r, c]) => `${r},${c}`).join("|")
  const reversed = [...sequence].reverse().map(([r, c]) => `${r},${c}`).join("|")
  return forward < reversed ? forward : reversed
}

export function canonicalSeqFromKey(key: string): Position[] {
  if (!key) return []
  return key.split("|").map((p) => {
    const [r, c] = p.split(",").map((n) => parseInt(n, 10))
    return [r, c]
  }) as Position[]
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

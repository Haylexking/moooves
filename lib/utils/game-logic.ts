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

  // Build a quick lookup of already-used sequences using a canonical string key
  const usedSequenceKeys = new Set<string>(usedSequences.map((s) => canonicalSeqKey(s)))

  // Check each direction (and its opposite implicitly by findSequenceInDirection)
  for (const [dr, dc] of DIRECTIONS) {
    const sequence = findSequenceInDirection(board, player, row, col, dr, dc)

    if (sequence.length >= 5) {
      // Only award sequences that are exactly 5 long or are "isolated" 5-length windows
      // We should avoid counting overlapping subsequences that are part of a longer run unless
      // that exact window is bounded by empty cells or board edges (i.e., not extendable on either side).
      for (let i = 0; i <= sequence.length - 5; i++) {
        const fiveSequence = sequence.slice(i, i + 5)

        // Determine if this 5-window is extendable on either side (part of a longer run)
        const before = sequence[i - 1]
        const after = sequence[i + 5]

        const isExtendableBefore = !!before && board[before[0]][before[1]] === player
        const isExtendableAfter = !!after && board[after[0]][after[1]] === player

        // If either side extends the 5-window, skip it (we only count exact 5 that are not part of a longer contiguous run)
        if (isExtendableBefore || isExtendableAfter) continue

        // Canonicalize the 5-window into a deterministic key (order-insensitive)
        const canonicalKey = canonicalSeqKey(fiveSequence)

        const hasUsedPosition = fiveSequence.some(([r, c]) => usedPositions.has(`${r},${c}`))

        if (!usedSequenceKeys.has(canonicalKey) && !hasUsedPosition) {
          // push the canonical (sorted) sequence so storage/use is consistent
          const canonicalSeq = canonicalSeqFromKey(canonicalKey)
          newSequences.push(canonicalSeq)
          newUsedPositions.push(...canonicalSeq)
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

// Canonicalize a sequence into a stable string key (order-insensitive)
function canonicalSeqKey(sequence: Position[]): string {
  return [...sequence]
    .slice()
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([r, c]) => `${r},${c}`)
    .join("|")
}

function canonicalSeqFromKey(key: string): Position[] {
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

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
      // We'll scan every 5-length window within the contiguous run and decide whether
      // to count it. Use direction-based checks to determine if the 5-window is
      // extendable beyond its ends on the board (not just by presence in sequence array).
      for (let i = 0; i <= sequence.length - 5; i++) {
        const fiveSequence = sequence.slice(i, i + 5)

        // Compute before/after coordinates using vector from first two elements
        // of the fiveSequence to determine direction.
        const [r0, c0] = fiveSequence[0]
        const [r1, c1] = fiveSequence[1]
        const dr = r1 - r0
        const dc = c1 - c0

        // position just before the five-window
        const beforeR = r0 - dr
        const beforeC = c0 - dc
        const afterR = fiveSequence[4][0] + dr
        const afterC = fiveSequence[4][1] + dc

        const isExtendableBefore = isValidPosition(beforeR, beforeC) && board[beforeR][beforeC] === player
        const isExtendableAfter = isValidPosition(afterR, afterC) && board[afterR][afterC] === player

        // If either side extends the 5-window as contiguous same-player marks, skip it
        if (isExtendableBefore || isExtendableAfter) continue

        const canonicalKey = canonicalSeqKey(fiveSequence)
        const hasUsedPosition = fiveSequence.some(([r, c]) => usedPositions.has(`${r},${c}`))

        if (!usedSequenceKeys.has(canonicalKey) && !hasUsedPosition) {
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

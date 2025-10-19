import type { GameBoard, Player, Position, Sequence } from "@/lib/types"

// All 8 directions: horizontal, vertical, and diagonal
const DIRECTIONS = [
  [0, 1], // horizontal right
  [1, 0], // vertical down
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
  // No need for opposite directions, as findSequenceInDirection handles both ways
]

function getDirectionName(dr: number, dc: number): string {
  if (dr === 0 && dc === 1) return "HORIZONTAL_RIGHT"
  if (dr === 1 && dc === 0) return "VERTICAL_DOWN"
  if (dr === 1 && dc === 1) return "DIAGONAL_DOWN_RIGHT"
  if (dr === 1 && dc === -1) return "DIAGONAL_DOWN_LEFT"
  return `UNKNOWN_${dr}_${dc}`
}

export function checkWinConditions(
  board: GameBoard,
  player: Player,
  row: number,
  col: number,
  usedSequences: Sequence[],
  currentScores: Record<Player, number>,
  usedPositions: Set<string> = new Set(),
): { newSequences: Sequence[]; updatedScores: Record<Player, number>; newUsedPositions: Position[] } {
  console.log("🔍 CHECK WIN CONDITIONS START", {
    player,
    position: [row, col],
    usedSequences: usedSequences.map(seq => ({ sequence: seq, key: canonicalSeqKey(seq) })),
    usedPositions: Array.from(usedPositions),
    currentScores,
    timestamp: new Date().toISOString()
  })

  const newSequences: Sequence[] = []
  const newUsedPositions: Position[] = []
  let scoreIncrease = 0

  // Build a quick lookup of already-used sequences using a canonical string key
  const usedSequenceKeys = new Set<string>(usedSequences.map((s) => canonicalSeqKey(s)))

  console.log("📋 USED SEQUENCE KEYS", {
    keys: Array.from(usedSequenceKeys),
    count: usedSequenceKeys.size,
    timestamp: new Date().toISOString()
  })

  // Check each direction (and its opposite implicitly by findSequenceInDirection)
  for (const [dr, dc] of DIRECTIONS) {
    const directionName = getDirectionName(dr, dc)
    console.log(`🧭 CHECKING DIRECTION: ${directionName}`, {
      direction: [dr, dc],
      timestamp: new Date().toISOString()
    })

    const sequence = findSequenceInDirection(board, player, row, col, dr, dc)

    console.log(`📏 SEQUENCE FOUND IN ${directionName}`, {
      direction: [dr, dc],
      sequenceLength: sequence.length,
      sequence: sequence.map(pos => `[${pos[0]},${pos[1]}]`),
      timestamp: new Date().toISOString()
    })

    if (sequence.length >= 5) {
      console.log(`✅ SEQUENCE LENGTH >= 5 IN ${directionName}`, {
        length: sequence.length,
        windows: sequence.length - 4,
        timestamp: new Date().toISOString()
      })

      // We'll scan every 5-length window within the contiguous run and decide whether
      // to count it. Use direction-based checks to determine if the 5-window is
      // extendable beyond its ends on the board (not just by presence in sequence array).
      for (let i = 0; i <= sequence.length - 5; i++) {
        const fiveSequence = sequence.slice(i, i + 5)

        console.log(`🔍 CHECKING 5-SEQUENCE WINDOW ${i + 1}/${sequence.length - 4}`, {
          window: fiveSequence.map(pos => `[${pos[0]},${pos[1]}]`),
          direction: [dr, dc],
          timestamp: new Date().toISOString()
        })

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

        console.log(`🔍 EXTENSIBILITY CHECK`, {
          before: { pos: [beforeR, beforeC], valid: isValidPosition(beforeR, beforeC), value: isValidPosition(beforeR, beforeC) ? board[beforeR][beforeC] : 'out of bounds', extendable: isExtendableBefore },
          after: { pos: [afterR, afterC], valid: isValidPosition(afterR, afterC), value: isValidPosition(afterR, afterC) ? board[afterR][afterC] : 'out of bounds', extendable: isExtendableAfter },
          timestamp: new Date().toISOString()
        })

        // If either side extends the 5-window as contiguous same-player marks, skip it
        if (isExtendableBefore || isExtendableAfter) {
          console.log(`⏭️ SKIPPING EXTENDABLE SEQUENCE`, {
            reason: isExtendableBefore ? 'extendable before' : 'extendable after',
            sequence: fiveSequence.map(pos => `[${pos[0]},${pos[1]}]`),
            timestamp: new Date().toISOString()
          })
          continue
        }

        const canonicalKey = canonicalSeqKey(fiveSequence)
        const hasUsedPosition = fiveSequence.some(([r, c]) => usedPositions.has(`${r},${c}`))

        console.log(`🔑 SEQUENCE VALIDATION`, {
          canonicalKey,
          hasUsedSequence: usedSequenceKeys.has(canonicalKey),
          hasUsedPosition,
          usedPositions: fiveSequence.map(([r, c]) => `${r},${c}`).filter(pos => usedPositions.has(pos)),
          valid: !usedSequenceKeys.has(canonicalKey) && !hasUsedPosition,
          timestamp: new Date().toISOString()
        })

        if (!usedSequenceKeys.has(canonicalKey) && !hasUsedPosition) {
          const canonicalSeq = canonicalSeqFromKey(canonicalKey)
          newSequences.push(canonicalSeq)
          newUsedPositions.push(...canonicalSeq)
          scoreIncrease++

          console.log(`✅ NEW SEQUENCE ADDED`, {
            sequence: canonicalSeq.map(pos => `[${pos[0]},${pos[1]}]`),
            canonicalKey,
            scoreIncrease,
            timestamp: new Date().toISOString()
          })
        } else {
          console.log(`❌ SEQUENCE REJECTED`, {
            reason: usedSequenceKeys.has(canonicalKey) ? 'already used sequence' : 'has used position',
            sequence: fiveSequence.map(pos => `[${pos[0]},${pos[1]}]`),
            canonicalKey,
            timestamp: new Date().toISOString()
          })
        }
      }
    } else {
      console.log(`ℹ️ SEQUENCE TOO SHORT IN ${directionName}`, {
        length: sequence.length,
        required: 5,
        timestamp: new Date().toISOString()
      })
    }
  }

  const updatedScores = {
    ...currentScores,
    [player]: currentScores[player] + scoreIncrease,
  }

  console.log("🏁 CHECK WIN CONDITIONS COMPLETE", {
    player,
    position: [row, col],
    newSequences: newSequences.map(seq => ({
      sequence: seq.map(pos => `[${pos[0]},${pos[1]}]`),
      key: canonicalSeqKey(seq)
    })),
    newUsedPositions: newUsedPositions.map(pos => `[${pos[0]},${pos[1]}]`),
    scoreIncrease,
    oldScores: currentScores,
    newScores: updatedScores,
    totalNewSequences: newSequences.length,
    timestamp: new Date().toISOString()
  })

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

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
      console.log(`✅ STREAK CANDIDATE (5+) IN ${directionName}`, {
        length: sequence.length,
        start: sequence[0] ? [sequence[0][0], sequence[0][1]] : null,
        end: sequence[sequence.length - 1] ? [sequence[sequence.length - 1][0], sequence[sequence.length - 1][1]] : null,
        timestamp: new Date().toISOString()
      })

      // Check that the streak begins at an edge or immediately after an interruption
      const [sr, sc] = sequence[0]
      const beforeR = sr - dr
      const beforeC = sc - dc
      const beginsAtEdgeOrInterruption = !isValidPosition(beforeR, beforeC) || board[beforeR][beforeC] !== player

      console.log(`🟢 STREAK BEGIN CHECK`, {
        beginsAt: [sr, sc],
        before: { pos: [beforeR, beforeC], valid: isValidPosition(beforeR, beforeC), value: isValidPosition(beforeR, beforeC) ? board[beforeR][beforeC] : 'out of bounds' },
        beginsAtEdgeOrInterruption,
        timestamp: new Date().toISOString()
      })

      if (beginsAtEdgeOrInterruption) {
        // Log when the streak reaches 5
        const reachFivePos = sequence[4]
        console.log(`🏁 STREAK REACHED 5`, {
          at: [reachFivePos[0], reachFivePos[1]],
          direction: [dr, dc],
          timestamp: new Date().toISOString()
        })

        const fiveSequence = sequence.slice(0, 5)
        const canonicalKey = canonicalSeqKey(fiveSequence)
        const hasUsedPosition = fiveSequence.some(([r, c]) => usedPositions.has(`${r},${c}`))

        console.log(`🔑 STREAK VALIDATION`, {
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

          console.log(`✅ STREAK ENDED AND SCORED`, {
            start: [sr, sc],
            end: [sequence[sequence.length - 1][0], sequence[sequence.length - 1][1]],
            direction: [dr, dc],
            sequence: canonicalSeq.map(pos => `[${pos[0]},${pos[1]}]`),
            canonicalKey,
            scoreIncrease,
            timestamp: new Date().toISOString()
          })
        } else {
          console.log(`❌ STREAK REJECTED`, {
            reason: usedSequenceKeys.has(canonicalKey) ? 'already used sequence' : 'has used position',
            sequence: fiveSequence.map(pos => `[${pos[0]},${pos[1]}]`),
            canonicalKey,
            timestamp: new Date().toISOString()
          })
        }
      } else {
        console.log(`ℹ️ STREAK DOES NOT BEGIN AT EDGE/INTERRUPTION`, {
          start: [sr, sc],
          direction: [dr, dc],
          timestamp: new Date().toISOString()
        })
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

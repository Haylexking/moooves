import type { GameBoard, Position, Player, Sequence } from "@/lib/types"
import { checkWinConditions } from "@/lib/utils/game-logic"

export function mockOpponentMove(
  board: GameBoard,
  currentPlayer: Player = "O",
  usedSequences: Sequence[] = [],
  currentScores: Record<Player, number> = { X: 0, O: 0 },
): Position | null {
  const availableMoves = getAvailableMoves(board)

  // Candidate pruning for efficiency: for strategic steps, consider only moves near activity
  const nearbyCandidates = getNearbyCandidates(board, 2)
  const strategicCandidates = nearbyCandidates.length > 0 ? nearbyCandidates : availableMoves

  if (availableMoves.length === 0) {
    return null
  }

  // 1. First priority: Try to win immediately
  const opponentPlayer: Player = currentPlayer === "X" ? "O" : "X"
  const winningMove = findWinningMove(board, currentPlayer, availableMoves, usedSequences, currentScores)
  if (winningMove) return winningMove

  // 2. Second priority: Block opponent immediate win
  const blockingMove = findWinningMove(board, opponentPlayer, availableMoves, usedSequences, currentScores)
  if (blockingMove) return blockingMove

  // 3. Third priority: Block emerging threats (2+ in a row with open ends)
  const emerging = findEmergingThreatMove(board, opponentPlayer, availableMoves, currentPlayer)
  if (emerging) return emerging

  // 3.5. If no threats to block, try to create a fork (two simultaneous strong threats)
  const forkMove = findForkWinningSetupMove(board, currentPlayer, strategicCandidates)
  if (forkMove) return forkMove

  // 4. Fourth priority: Make strategic moves (extend existing sequences) with stronger heuristics
  const strategicMove = findStrategicMove(board, currentPlayer, strategicCandidates, usedSequences)
  if (strategicMove) {
    // One-ply safety: avoid moves that hand opponent an immediate win
    if (!wouldGiveOpponentImmediateWin(board, strategicMove[0], strategicMove[1], currentPlayer, usedSequences, currentScores)) {
      return strategicMove
    }
    // Try to find the best safe strategic alternative
    let bestSafe: { pos: Position; score: number } | null = null
    for (const [r, c] of strategicCandidates) {
      if (wouldGiveOpponentImmediateWin(board, r, c, currentPlayer, usedSequences, currentScores)) continue
      const s = evaluateSelfStrategic(board, currentPlayer, r, c)
      if (!bestSafe || s > bestSafe.score) bestSafe = { pos: [r, c], score: s }
    }
    if (bestSafe) return bestSafe.pos
  }

  // 5. Fifth priority: Move near existing pieces
  // If pruning was used, try to pick from candidateMoves; as a fallback use the existing nearby heuristic
  const nearbyMove = findNearbyMove(board, strategicCandidates)
  if (nearbyMove) {
    if (!wouldGiveOpponentImmediateWin(board, nearbyMove[0], nearbyMove[1], currentPlayer, usedSequences, currentScores)) {
      return nearbyMove
    }
  }

  // 6. Fallback: Random move (prefer center area)
  const randomMove = getRandomMove(availableMoves)
  return randomMove
}

function getAvailableMoves(board: GameBoard): Position[] {
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

// Return empty array if no existing pieces found (so caller can fallback to full list)
function getNearbyCandidates(board: GameBoard, radius = 3): Position[] {
  const existing: Position[] = []
  for (let r = 0; r < 30; r++) {
    for (let c = 0; c < 30; c++) {
      if (board[r][c] !== null) existing.push([r, c])
    }
  }

  if (existing.length === 0) return []

  const candidateSet = new Set<string>()
  for (const [er, ec] of existing) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const nr = er + dr
        const nc = ec + dc
        if (nr >= 0 && nr < 30 && nc >= 0 && nc < 30 && board[nr][nc] === null) {
          candidateSet.add(`${nr},${nc}`)
        }
      }
    }
  }

  return Array.from(candidateSet).map((s) => s.split(",").map((n) => parseInt(n, 10)) as Position)
}

function findWinningMove(
  board: GameBoard,
  player: Player,
  availableMoves: Position[],
  usedSequences: Sequence[],
  currentScores: Record<Player, number>,
): Position | null {
  // Try each available move and see if it creates NEW winning sequences
  for (const [row, col] of availableMoves) {
    // Temporarily place the piece
    const testBoard = board.map((r) => [...r])
    testBoard[row][col] = player

    // Check if this move creates any NEW sequences (not already used)
    const { newSequences } = checkWinConditions(testBoard, player, row, col, usedSequences, currentScores)

    if (newSequences.length > 0) return [row, col]
  }
  return null
}

function evaluateSelfStrategic(board: GameBoard, player: Player, row: number, col: number): number {
  // Score a candidate move for offensive potential without mutating state
  let score = 0
  let forkDirs = 0
  const directions: Position[] = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ]
  for (const [dr, dc] of directions) {
    const { length, openEnds } = measureLine(board, player, row, col, dr, dc)
    if (length > 0 && openEnds > 0) {
      const base = length * length * (openEnds === 2 ? 2 : 1)
      const fourBoost = length >= 3 ? 3 : 1
      score += base * fourBoost
      if (length >= 2) forkDirs++
    }
  }
  if (forkDirs >= 2) score += forkDirs * forkDirs * 10
  return score
}

// Try to create a fork: placing a stone that forms two separate strong threats.
// We consider a fork move if, after placing, there are at least two axes where
// the combined line length would be >= 3 and has open ends.
function findForkWinningSetupMove(
  board: GameBoard,
  player: Player,
  candidateMoves: Position[],
): Position | null {
  let best: { pos: Position; forkCount: number; sumLen: number } | null = null

  // Use the 4 principal axes (each measureLine counts both sides)
  const axes: Position[] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]

  for (const [row, col] of candidateMoves) {
    if (board[row][col] !== null) continue
    let forkCount = 0
    let sumLen = 0
    for (const [dr, dc] of axes) {
      const { length, openEnds } = measureLine(board, player, row, col, dr, dc)
      // If we place here, the combined line would be (length + 1). Consider it a threat when >= 3 with open ends.
      if (openEnds > 0 && length + 1 >= 3) {
        forkCount++
        sumLen += length
      }
    }
    if (forkCount >= 2) {
      if (!best || forkCount > best.forkCount || (forkCount === best.forkCount && sumLen > best.sumLen)) {
        best = { pos: [row, col], forkCount, sumLen }
      }
    }
  }

  return best ? best.pos : null
}

function wouldGiveOpponentImmediateWin(
  board: GameBoard,
  row: number,
  col: number,
  self: Player,
  usedSequences: Sequence[],
  currentScores: Record<Player, number>,
): boolean {
  if (board[row][col] !== null) return true
  const opponent: Player = self === 'X' ? 'O' : 'X'
  const testBoard = board.map((r) => [...r])
  testBoard[row][col] = self
  const avail = getAvailableMoves(testBoard)
  const threat = findWinningMove(testBoard, opponent, avail, usedSequences, currentScores)
  return !!threat
}

// Threat detection: aggressively block opponent patterns of length >= 2 with openness
function findThreatBlockingMove(
  board: GameBoard,
  opponent: Player,
  self: Player,
  availableMoves: Position[],
): Position | null {
  let best: { position: Position; score: number; selfTie: number } | null = null

  for (const [row, col] of availableMoves) {
    // Hypothetically place opponent here to evaluate threat growth prevented
    const score = evaluateThreatBlockedByMove(board, opponent, row, col)
    if (score > 0) {
      // Tie-breaker: if two blocks are equally strong defensively, prefer the one that also
      // improves our own potential (longer line with open ends)
      let selfTie = 0
      const directions: Position[] = [
        [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
      ]
      for (const [dr, dc] of directions) {
        const { length, openEnds } = measureLine(board, self, row, col, dr, dc)
        if (length > 0 && openEnds > 0) {
          const endsMultiplier = openEnds === 2 ? 2 : 1
          selfTie += Math.pow(length, 2) * endsMultiplier
        }
      }

      if (!best || score > best.score || (score === best.score && selfTie > best.selfTie)) {
        best = { position: [row, col], score, selfTie }
      }
    }
  }

  return best ? best.position : null
}

function evaluateThreatBlockedByMove(
  board: GameBoard,
  opponent: Player,
  row: number,
  col: number,
): number {
  // Block threats by occupying the empty that would extend or keep open an opponent line
  // Score higher for blocking longer lines. Consider ANY line length >= 2 regardless of openness.
  // Still weight lines with open ends higher, but do NOT require them.
  // Use an aggressive weighting to prioritize defense over offense.
  let total = 0
  const directions: Position[] = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dr, dc] of directions) {
    const { length, openEnds } = measureLine(board, opponent, row, col, dr, dc)
    // Consider any emerging threat length >= 2 (even if closed at both ends)
    if (length >= 2) {
      // Heuristic: cubic growth by length; weight open ends stronger but include closed as 1x
      const endsMultiplier = openEnds === 2 ? 3.0 : openEnds === 1 ? 2.0 : 1.0
      // Boost for very long lines (>=4) to ensure we always block them
      const longBoost = length >= 4 ? 2.5 : length === 3 ? 1.5 : 1.0
      const threatScore = Math.pow(length, 3) * endsMultiplier * longBoost
      total += threatScore
    }
  }

  return total;
}

function findEmergingThreatMove(
  board: GameBoard,
  opponent: Player,
  availableMoves: Position[],
  self: Player,
): Position | null {
  return findThreatBlockingMove(board, opponent, self, availableMoves)
}

function measureLine(
  board: GameBoard,
  player: Player,
  row: number,
  col: number,
  dr: number,
  dc: number,
): { length: number; openEnds: number } {
  // Count contiguous stones of player on both sides from the empty (row,col)
  let length = 0
  let openEnds = 0

  // forward
  let r = row + dr
  let c = col + dc
  while (r >= 0 && r < 30 && c >= 0 && c < 30 && board[r][c] === player) {
    length++
    r += dr
    c += dc
  }
  if (r >= 0 && r < 30 && c >= 0 && c < 30 && board[r][c] === null) {
    openEnds++
  }

  // backward
  r = row - dr
  c = col - dc
  while (r >= 0 && r < 30 && c >= 0 && c < 30 && board[r][c] === player) {
    length++
    r -= dr
    c -= dc
  }
  if (r >= 0 && r < 30 && c >= 0 && c < 30 && board[r][c] === null) {
    openEnds++
  }

  return { length, openEnds }
}

function findStrategicMove(
  board: GameBoard,
  player: Player,
  availableMoves: Position[],
  usedSequences: Sequence[],
): Position | null {
  let bestScore = -Infinity
  let bestMove: Position | null = null
  const forbiddenExtensions = buildForbiddenExtensions(board, usedSequences)
  const opponent: Player = player === 'X' ? 'O' : 'X'
  const strategicMoves: { position: Position; score: number }[] = []

  // First pass: evaluate all available moves
  for (const [row, col] of availableMoves) {
    // Skip moves that would extend an already-scored sequence
    if (forbiddenExtensions.has(`${row},${col}`)) {
      continue
    }

    let score = 0
    
    // Check all 8 directions
    for (const [dr, dc] of [
      [0, 1], [1, 0], [1, 1], [1, -1],  // horizontal, vertical, diagonals
      [0, -1], [-1, 0], [-1, -1], [-1, 1]
    ]) {
      // Evaluate offensive potential (our sequences)
      const ourSequence = buildPotentialSequence(board, player, row, col, dr, dc)
      if (ourSequence.length >= 2) {
        // Prefer longer sequences with open ends
        const { openEnds } = measureLine(board, player, row, col, dr, dc)
        score += Math.pow(ourSequence.length, 2) * (1 + openEnds * 0.5)
      }

      // Evaluate defensive potential (opponent's sequences)
      const theirSequence = buildPotentialSequence(board, opponent, row, col, dr, dc)
      if (theirSequence.length >= 2) {
        // More urgent to block longer opponent sequences
        const { openEnds } = measureLine(board, opponent, row, col, dr, dc)
        score += Math.pow(theirSequence.length, 3) * (1 + openEnds * 0.5)
      }
    }

    // Center control bonus (decreases as game progresses)
    const centerDist = Math.sqrt(Math.pow(row - 14.5, 2) + Math.pow(col - 14.5, 2))
    const centerBonus = 15 - centerDist * 0.5
    score += centerBonus

    // Slight random factor to avoid predictable moves
    score += Math.random() * 2 - 1

    strategicMoves.push({ position: [row, col], score })
  }

  // Find the best move among strategic moves
  if (strategicMoves.length > 0) {
    strategicMoves.sort((a, b) => b.score - a.score)
    return strategicMoves[0].position
  }

  // Fallback: find any non-forbidden move
  for (const move of availableMoves) {
    if (!forbiddenExtensions.has(`${move[0]},${move[1]}`)) {
      return move
    }
  }

  // If all moves are forbidden (shouldn't happen), just pick the first available
  return availableMoves[0] || null
}

function buildPotentialSequence(
  board: GameBoard,
  player: Player,
  row: number,
  col: number,
  dr: number,
  dc: number,
): Position[] {
  const sequence: Position[] = [[row, col]]

  // Check forward direction
  let r = row + dr
  let c = col + dc
  while (r >= 0 && r < 30 && c >= 0 && c < 30 && board[r][c] === player) {
    sequence.push([r, c])
    r += dr
    c += dc
  }

  // Check backward direction
  r = row - dr
  c = col - dc
  while (r >= 0 && r < 30 && c >= 0 && c < 30 && board[r][c] === player) {
    sequence.unshift([r, c])
    r -= dr
    c -= dc
  }

  return sequence
}

function isSequencePartiallyUsed(sequence: Position[], usedSequences: Sequence[]): boolean {
  // Check if any part of this sequence overlaps with used sequences
  for (const usedSeq of usedSequences) {
    for (const [row, col] of sequence) {
      if (usedSeq.some(([ur, uc]) => ur === row && uc === col)) {
        return true
      }
    }
  }
  return false
}

function buildForbiddenExtensions(
  board: GameBoard,
  usedSequences: Sequence[],
): Set<string> {
  const forbidden = new Set<string>()
  for (const seq of usedSequences) {
    if (!seq || seq.length < 2) continue
    const [sr, sc] = seq[0]
    const [er, ec] = seq[seq.length - 1]
    const dr = Math.sign(er - sr)
    const dc = Math.sign(ec - sc)
    // If direction cannot be determined (all same cell), skip
    if (dr === 0 && dc === 0) continue

    // 1) Mark immediate cells beyond both ends as forbidden
    const ends: Position[] = [
      [sr - dr, sc - dc],
      [er + dr, ec + dc],
    ]
    for (const [r, c] of ends) {
      if (r >= 0 && r < 30 && c >= 0 && c < 30 && board[r][c] === null) {
        forbidden.add(`${r},${c}`)
      }
    }

    // 2) Extend the forbidden line outward further from both ends while cells are empty
    //    This prevents the AI from continuing to push the already-scored line at a distance.
    //    Stop when hitting a non-empty cell or the board edge.
    let rF = er + dr
    let cF = ec + dc
    while (rF >= 0 && rF < 30 && cF >= 0 && cF < 30 && board[rF][cF] === null) {
      forbidden.add(`${rF},${cF}`)
      rF += dr
      cF += dc
    }

    let rB = sr - dr
    let cB = sc - dc
    while (rB >= 0 && rB < 30 && cB >= 0 && cB < 30 && board[rB][cB] === null) {
      forbidden.add(`${rB},${cB}`)
      rB -= dr
      cB -= dc
    }

    // 3) Light “buffer” around the five: also avoid the two orthogonal side-cells adjacent to the ends
    //    to discourage diagonal sidestepping that still piggybacks the scored line.
    const orthogonals: Position[] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
    for (const [erow, ecol] of [seq[0], seq[seq.length - 1]]) {
      for (const [odr, odc] of orthogonals) {
        const rr = erow + odr
        const cc = ecol + odc
        if (rr >= 0 && rr < 30 && cc >= 0 && cc < 30 && board[rr][cc] === null) {
          forbidden.add(`${rr},${cc}`)
        }
      }
    }
  }
  return forbidden
}

function getSequenceLength(board: GameBoard, player: Player, row: number, col: number, dr: number, dc: number): number {
  let count = 0

  // Check in one direction
  let r = row + dr
  let c = col + dc
  while (r >= 0 && r < 30 && c >= 0 && c < 30 && board[r][c] === player) {
    count++
    r += dr
    c += dc
  }

  // Check in opposite direction
  r = row - dr
  c = col - dc
  while (r >= 0 && r < 30 && c >= 0 && c < 30 && board[r][c] === player) {
    count++
    r -= dr
    c -= dc
  }

  return count
}

function findNearbyMove(board: GameBoard, availableMoves: Position[]): Position | null {
  const nearbyMoves: Position[] = []

  for (const [row, col] of availableMoves) {
    // Check if this move is adjacent to any existing piece
    if (hasAdjacentPiece(board, row, col)) {
      nearbyMoves.push([row, col])
    }
  }

  if (nearbyMoves.length > 0) {
    return nearbyMoves[Math.floor(Math.random() * nearbyMoves.length)]
  }

  return null
}

function hasAdjacentPiece(board: GameBoard, row: number, col: number): boolean {
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ]

  for (const [dr, dc] of directions) {
    const newRow = row + dr
    const newCol = col + dc

    if (newRow >= 0 && newRow < 30 && newCol >= 0 && newCol < 30) {
      if (board[newRow][newCol] !== null) {
        return true
      }
    }
  }

  return false
}

function getRandomMove(availableMoves: Position[]): Position {
  // Prefer moves closer to center
  const centerRow = 15
  const centerCol = 15
  const maxDistance = Math.sqrt(2 * 15 * 15) // Max distance from center

  const weightedMoves = availableMoves.map(([row, col]) => {
    const distance = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2)
    const weight = 1 - distance / maxDistance // Closer to center = higher weight
    return { position: [row, col] as Position, weight }
  })

  // Use weighted random selection
  const totalWeight = weightedMoves.reduce((sum, move) => sum + move.weight, 0)
  let random = Math.random() * totalWeight

  for (const move of weightedMoves) {
    random -= move.weight
    if (random <= 0) {
      return move.position
    }
  }

  // Fallback to truly random
  return availableMoves[Math.floor(Math.random() * availableMoves.length)]
}

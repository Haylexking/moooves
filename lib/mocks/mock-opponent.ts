import type { GameBoard, Position, Player, Sequence } from "@/lib/types"
import { checkWinConditions } from "@/lib/utils/game-logic"

export function mockOpponentMove(
  board: GameBoard,
  currentPlayer: Player = "O",
  usedSequences: Sequence[] = [],
  currentScores: Record<Player, number> = { X: 0, O: 0 },
): Position | null {
  const availableMoves = getAvailableMoves(board)

  // Candidate pruning: only consider moves within a small radius of existing pieces
  const candidateMoves = getNearbyCandidates(board, 3)
  const movesToConsider = candidateMoves.length > 0 ? candidateMoves : availableMoves

  if (availableMoves.length === 0) {
    return null
  }

  // 1. First priority: Check if computer can win in one move (but only NEW sequences)
  // Prefer evaluating the pruned candidate set first
  const winningMove = findWinningMove(board, currentPlayer, movesToConsider, usedSequences, currentScores)
  if (winningMove) {
    // Even if we can win now, check if the opponent has an immediate winning response next turn
    // If opponent can also win next turn (e.g., via another move), prefer a blocking move to secure the game
    const opponent: Player = currentPlayer === 'X' ? 'O' : 'X'
    const opponentWinningAfterOurWin = (() => {
      // Simulate placing our winning move, then check if opponent has any immediate winning move
      const testBoard = board.map((r) => [...r])
      testBoard[winningMove[0]][winningMove[1]] = currentPlayer

      const opponentCanWin = !!findWinningMove(testBoard, opponent, getNearbyCandidates(testBoard, 3).length ? getNearbyCandidates(testBoard, 3) : getAvailableMoves(testBoard), usedSequences, currentScores)
      return opponentCanWin
    })()

    if (opponentWinningAfterOurWin) {
      // If opponent could win after our move, try to block opponent instead
      const blockingMove = findWinningMove(board, opponent, movesToConsider, usedSequences, currentScores)
      if (blockingMove) {
        return blockingMove
      }
    }

    return winningMove
  }

  // 2. Second priority: Block player from winning (prevent NEW sequences)
  const opponentPlayer: Player = currentPlayer === "X" ? "O" : "X"
  const blockingMove = findWinningMove(board, opponentPlayer, movesToConsider, usedSequences, currentScores)
  if (blockingMove) return blockingMove

  // 3. Third priority: Aggressively block emerging threats (length 2–4 with openness)
  const threatBlockingMove = findThreatBlockingMove(board, opponentPlayer, movesToConsider)
  if (threatBlockingMove) return threatBlockingMove

  // 4. Fourth priority: Make strategic moves (extend existing sequences) with stronger heuristics
  const strategicMove = findStrategicMove(board, currentPlayer, movesToConsider, usedSequences)
  if (strategicMove) return strategicMove

  // 5. Fifth priority: Move near existing pieces
  // If pruning was used, try to pick from candidateMoves; as a fallback use the existing nearby heuristic
  const nearbyMove = findNearbyMove(board, movesToConsider)
  if (nearbyMove) return nearbyMove

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

// Threat detection: find opponent patterns of length 2–4 with open ends and block the best
function findThreatBlockingMove(
  board: GameBoard,
  opponent: Player,
  availableMoves: Position[],
): Position | null {
  let best: { position: Position; score: number } | null = null

  for (const [row, col] of availableMoves) {
    // Hypothetically place opponent here to evaluate threat growth prevented
    const score = evaluateThreatBlockedByMove(board, opponent, row, col)
    if (score > 0) {
      if (!best || score > best.score) {
        best = { position: [row, col], score }
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
  // Score higher for blocking longer, more open lines (e.g., open-3, open-2)
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
    const { length, openEnds } = measureLine(board, opponent, row, col, dr, dc);
    // Only consider emerging threats (2–3) with at least one open end
    if (length >= 2 && length <= 3 && openEnds > 0) {
      // Heuristic: longer lines and more open ends are more dangerous
      const threatScore = length * length * (openEnds === 2 ? 2 : 1);
      total += threatScore;
    }
  }

  return total;
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
  const strategicMoves: { position: Position; score: number }[] = []

  for (const [row, col] of availableMoves) {
    let score = 0

    // Check all 8 directions for existing sequences to extend
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
      const { length, openEnds } = measureLine(board, player, row, col, dr, dc)
      if (length > 0) {
        const potentialSequence = buildPotentialSequence(board, player, row, col, dr, dc)
        // Prefer extensions that are not overlapping with used sequences
        if (potentialSequence.length >= 2 && !isSequencePartiallyUsed(potentialSequence, usedSequences)) {
          // Heuristic: value longer and more open shapes, boost for creating 4
          const base = length * length * (openEnds === 2 ? 2 : 1)
          const fourBoost = length >= 3 ? 3 : 1
          score += base * fourBoost
        }
      }
    }

    if (score > 0) {
      strategicMoves.push({ position: [row, col], score })
    }
  }

  if (strategicMoves.length > 0) {
    // Sort by score and return the best move
    strategicMoves.sort((a, b) => b.score - a.score)
    return strategicMoves[0].position
  }

  return null
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

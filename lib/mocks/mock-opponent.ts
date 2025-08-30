import type { GameBoard, Position, Player, Sequence } from "@/lib/types"
import { checkWinConditions } from "@/lib/utils/game-logic"

export function mockOpponentMove(
  board: GameBoard,
  currentPlayer: Player = "O",
  usedSequences: Sequence[] = [],
  currentScores: Record<Player, number> = { X: 0, O: 0 },
): Position | null {
  const availableMoves = getAvailableMoves(board)

  if (availableMoves.length === 0) {
    return null
  }

  // 1. First priority: Check if computer can win in one move (but only NEW sequences)
  const winningMove = findWinningMove(board, currentPlayer, availableMoves, usedSequences, currentScores)
  if (winningMove) {
    console.log("🤖 Computer found winning move:", winningMove)
    return winningMove
  }

  // 2. Second priority: Block player from winning (prevent NEW sequences)
  const opponentPlayer: Player = currentPlayer === "X" ? "O" : "X"
  const blockingMove = findWinningMove(board, opponentPlayer, availableMoves, usedSequences, currentScores)
  if (blockingMove) {
    console.log("🤖 Computer blocking player move:", blockingMove)
    return blockingMove
  }

  // 3. Third priority: Make strategic moves (extend existing sequences)
  const strategicMove = findStrategicMove(board, currentPlayer, availableMoves, usedSequences)
  if (strategicMove) {
    console.log("🤖 Computer making strategic move:", strategicMove)
    return strategicMove
  }

  // 4. Fourth priority: Move near existing pieces
  const nearbyMove = findNearbyMove(board, availableMoves)
  if (nearbyMove) {
    console.log("🤖 Computer moving near existing pieces:", nearbyMove)
    return nearbyMove
  }

  // 5. Fallback: Random move (prefer center area)
  const randomMove = getRandomMove(availableMoves)
  console.log("🤖 Computer making random move:", randomMove)
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

    if (newSequences.length > 0) {
      console.log(`🤖 Found ${newSequences.length} new sequences for move [${row}, ${col}]`)
      return [row, col]
    }
  }
  return null
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
      const sequenceLength = getSequenceLength(board, player, row, col, dr, dc)
      if (sequenceLength > 0) {
        // Check if extending this sequence would create something new
        // Higher score for longer sequences that aren't already used
        const potentialSequence = buildPotentialSequence(board, player, row, col, dr, dc)
        if (potentialSequence.length >= 3 && !isSequencePartiallyUsed(potentialSequence, usedSequences)) {
          score += sequenceLength * sequenceLength
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

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

export function calculateGameStateFromBoard(board: GameBoard): {
  scores: Record<Player, number>;
  usedSequences: Sequence[];
  usedPositions: Set<string>;
} {
  const scores: Record<Player, number> = { X: 0, O: 0 };
  const usedSequences: Sequence[] = [];
  const usedPositions = new Set<string>();
  const awardedKeys = new Set<string>();

  // Helper to process a potential sequence
  const processSequence = (player: Player, sequence: Position[]) => {
    if (sequence.length < 5) return;

    // Only take the first 5 for the scoring unit (as per checkWinConditions logic)
    // In a full scan, we might find 6-long sequences. 
    // The rule says "For sequences of 5 or more... Only check the first valid 5-in-a-row"
    // Ideally we iterate through all 5-blocks in the sequence?
    // The original logic only checked the sequence *containing the last move*.
    // Here we scan the whole board. Let's simplify: 
    // A 5-in-a-row is valid if none of its positions are used.

    // We treat the sequence as a contiguous line. 
    // If we have X X X X X X (6), is it 1 point or 2? 
    // Usually in 5-in-row games, it's 1 point (or sometimes 0 for overline). 
    // Assuming 5+ counts as 1 point per distinct non-overlapping set? 
    // The current checkWinConditions logic:
    // "Check if any position in this block is already used" -> "if (hasUsed) continue"
    // It implies minimal overlap.

    // Greedy approach: Take the first 5, mark used. 
    // If length > 5, check next 5? 
    // checkWinConditions implementation only checks `sequence.slice(0, 5)`. 
    // So distinct 5-blocks.

    // Iterate through all possible 5-sub-segments
    for (let i = 0; i <= sequence.length - 5; i++) {
      const block = sequence.slice(i, i + 5);
      const blockKey = canonicalSeqKey(block);

      // Check usage
      const hasUsed = block.some(([r, c]) => usedPositions.has(`${r},${c}`));
      if (!hasUsed && !awardedKeys.has(blockKey)) {
        // Valid score
        scores[player]++;
        usedSequences.push(canonicalSeqFromKey(blockKey));
        awardedKeys.add(blockKey);
        block.forEach(([r, c]) => usedPositions.add(`${r},${c}`));

        // Once a block consumes these positions, they can't be used again
        // So we jump index? The loop continues but `hasUsed` will be true for overlapping.
      }
    }
  };

  // We need to scan all rows, cols, and diagonals.
  // 1. Horizontal
  for (let r = 0; r < 30; r++) {
    let currentLen = 0;
    let currentPlayer: Player | null = null;
    let startC = 0;
    for (let c = 0; c < 30; c++) {
      const cell = board[r][c];
      if (cell === currentPlayer && cell !== null) {
        currentLen++;
      } else {
        if (currentLen >= 5 && currentPlayer) {
          // Found a sequence ending at c-1
          const seq: Position[] = [];
          for (let k = 0; k < currentLen; k++) seq.push([r, startC + k]);
          processSequence(currentPlayer, seq);
        }
        currentLen = cell ? 1 : 0;
        currentPlayer = cell;
        startC = c;
      }
    }
    // End of row check
    if (currentLen >= 5 && currentPlayer) {
      const seq: Position[] = [];
      for (let k = 0; k < currentLen; k++) seq.push([r, startC + k]);
      processSequence(currentPlayer, seq);
    }
  }

  // 2. Vertical
  for (let c = 0; c < 30; c++) {
    let currentLen = 0;
    let currentPlayer: Player | null = null;
    let startR = 0;
    for (let r = 0; r < 30; r++) {
      const cell = board[r][c];
      if (cell === currentPlayer && cell !== null) {
        currentLen++;
      } else {
        if (currentLen >= 5 && currentPlayer) {
          const seq: Position[] = [];
          for (let k = 0; k < currentLen; k++) seq.push([startR + k, c]);
          processSequence(currentPlayer, seq);
        }
        currentLen = cell ? 1 : 0;
        currentPlayer = cell;
        startR = r;
      }
    }
    if (currentLen >= 5 && currentPlayer) {
      const seq: Position[] = [];
      for (let k = 0; k < currentLen; k++) seq.push([startR + k, c]);
      processSequence(currentPlayer, seq);
    }
  }

  // 3. Diagonals (Down-Right)
  // Starts from first column (rows 0-29) and first row (cols 1-29)
  const checkDiag = (startR: number, startC: number, dr: number, dc: number) => {
    let r = startR;
    let c = startC;
    let currentLen = 0;
    let currentPlayer: Player | null = null;
    let seqStartR = r;
    let seqStartC = c;

    while (r >= 0 && r < 30 && c >= 0 && c < 30) {
      const cell = board[r][c];
      if (cell === currentPlayer && cell !== null) {
        currentLen++;
      } else {
        if (currentLen >= 5 && currentPlayer) {
          const seq: Position[] = [];
          for (let k = 0; k < currentLen; k++) seq.push([seqStartR + k * dr, seqStartC + k * dc]);
          processSequence(currentPlayer, seq);
        }
        currentLen = cell ? 1 : 0;
        currentPlayer = cell;
        seqStartR = r; // reset start of next potential sequence
        seqStartC = c; // Note: this logic needs care. `r` is current. 
        // Simplification: just collect the whole diagonal line segments?
        // Re-implement: Just push position to buffer if match.
        if (cell) { // started new
          seqStartR = r;
          seqStartC = c;
        }
      }
      r += dr;
      c += dc;
    }
    if (currentLen >= 5 && currentPlayer) {
      const seq: Position[] = [];
      for (let k = 0; k < currentLen; k++) seq.push([seqStartR + k * dr, seqStartC + k * dc]);
      processSequence(currentPlayer, seq);
    }
  };

  // TL to BR diagonals
  for (let r = 0; r < 30; r++) checkDiag(r, 0, 1, 1);
  for (let c = 1; c < 30; c++) checkDiag(0, c, 1, 1);

  // TR to BL diagonals
  // Starts from last column (rows 0-29) and first row (cols 0-28)
  // dr = 1, dc = -1
  for (let r = 0; r < 30; r++) checkDiag(r, 29, 1, -1);
  for (let c = 0; c < 29; c++) checkDiag(0, c, 1, -1);

  return { scores, usedSequences, usedPositions };
}

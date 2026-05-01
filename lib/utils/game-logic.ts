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

  // Build a quick lookup of already-used sequences using a canonical string key
  const usedSequenceKeys = new Set<string>(usedSequences.map((s) => canonicalSeqKey(s)))

  // Check each direction (and its opposite implicitly by findSequenceInDirection)
  for (const [dr, dc] of DIRECTIONS) {
    const sequence = findSequenceInDirection(board, player, row, col, dr, dc)

    if (sequence.length < 5) continue

    // Build used-position set for THIS direction only, derived from previously scored
    // sequences in the same direction. This allows cross-direction sequences (e.g. a
    // diagonal crossing a scored horizontal line) to score independently.
    // Use the same canonical key scheme as getSeqDirectionKey so lookups match.
    const dirKey = dr === 0 ? "0,1" : dc === 0 ? "1,0" : dr * dc > 0 ? "1,1" : "1,-1"
    const dirUsedPositions = new Set<string>()
    for (const seq of usedSequences) {
      if (getSeqDirectionKey(seq) === dirKey) {
        seq.forEach(([r, c]) => dirUsedPositions.add(`${r},${c}`))
      }
    }

    // Slide through windows of 5, skipping positions already locked in this direction.
    // This also handles runs of 10+ where the first 5 are locked but [5-9] should score.
    let scored = false
    for (let i = 0; i <= sequence.length - 5 && !scored; i++) {
      const block = sequence.slice(i, i + 5)

      // Skip if any position in this block was already scored in the same direction
      if (block.some(([r, c]) => dirUsedPositions.has(`${r},${c}`))) continue

      const blockKey = canonicalSeqKey(block)
      if (usedSequenceKeys.has(blockKey) || awardedKeys.has(blockKey)) continue

      const canonicalSeq = canonicalSeqFromKey(blockKey)
      newSequences.push(canonicalSeq)
      newUsedPositions.push(...canonicalSeq)
      awardedKeys.add(blockKey)
      scoreIncrease++
      scored = true
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

// Returns a normalised direction key for a sequence that matches the canonical DIRECTIONS
// values: "0,1" (horizontal), "1,0" (vertical), "1,1" (diagonal DR), "1,-1" (diagonal DL).
// Because canonicalSeqKey may store a sequence in either order, we normalise the delta so
// that dr is always non-negative (and dc positive when dr is 0).
function getSeqDirectionKey(seq: Sequence): string {
  if (seq.length < 2) return ""
  const dr = seq[1][0] - seq[0][0]
  const dc = seq[1][1] - seq[0][1]
  if (dr === 0) return "0,1"             // horizontal
  if (dc === 0) return "1,0"             // vertical
  return dr * dc > 0 ? "1,1" : "1,-1"   // diagonal-right vs diagonal-left
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
  const usedPositions = new Set<string>(); // global — for return value / display
  const awardedKeys = new Set<string>();

  // Per-direction used-position sets so cross-direction sequences are never blocked
  // by cells already scored in a different direction.
  const hUsedPos  = new Set<string>() // horizontal
  const vUsedPos  = new Set<string>() // vertical
  const drUsedPos = new Set<string>() // diagonal down-right
  const dlUsedPos = new Set<string>() // diagonal down-left

  // Helper to process a potential sequence.
  // dirUsedPositions is direction-specific so only same-direction overlaps block re-scoring.
  const processSequence = (player: Player, sequence: Position[], dirUsedPositions: Set<string>) => {
    if (sequence.length < 5) return;

    // Slide through windows of 5, skipping any that are already locked in this direction.
    for (let i = 0; i <= sequence.length - 5; i++) {
      const block = sequence.slice(i, i + 5);
      if (block.some(([r, c]) => dirUsedPositions.has(`${r},${c}`))) continue;
      const blockKey = canonicalSeqKey(block);
      if (awardedKeys.has(blockKey)) continue;
      // Valid score: 5-in-a-row = 1 point
      scores[player]++;
      usedSequences.push(canonicalSeqFromKey(blockKey));
      awardedKeys.add(blockKey);
      block.forEach(([r, c]) => {
        dirUsedPositions.add(`${r},${c}`); // direction-local lock
        usedPositions.add(`${r},${c}`);    // global (display / return)
      });
      break; // one score per run per call
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
          processSequence(currentPlayer, seq, hUsedPos);
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
      processSequence(currentPlayer, seq, hUsedPos);
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
          processSequence(currentPlayer, seq, vUsedPos);
        }
        currentLen = cell ? 1 : 0;
        currentPlayer = cell;
        startR = r;
      }
    }
    if (currentLen >= 5 && currentPlayer) {
      const seq: Position[] = [];
      for (let k = 0; k < currentLen; k++) seq.push([startR + k, c]);
      processSequence(currentPlayer, seq, vUsedPos);
    }
  }

  // 3. Diagonals — each direction gets its own used-position set
  const checkDiag = (startR: number, startC: number, dr: number, dc: number, dirUsedPos: Set<string>) => {
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
          processSequence(currentPlayer, seq, dirUsedPos);
        }
        currentLen = cell ? 1 : 0;
        currentPlayer = cell;
        if (cell) {
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
      processSequence(currentPlayer, seq, dirUsedPos);
    }
  };

  // TL to BR diagonals
  for (let r = 0; r < 30; r++) checkDiag(r, 0, 1, 1, drUsedPos);
  for (let c = 1; c < 30; c++) checkDiag(0, c, 1, 1, drUsedPos);

  // TR to BL diagonals
  for (let r = 0; r < 30; r++) checkDiag(r, 29, 1, -1, dlUsedPos);
  for (let c = 0; c < 29; c++) checkDiag(0, c, 1, -1, dlUsedPos);

  return { scores, usedSequences, usedPositions };
}

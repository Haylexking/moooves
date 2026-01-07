
// debug-scoring.ts
import { checkWinConditions, canonicalSeqKey } from "./lib/utils/game-logic";
import type { GameBoard, Player, Sequence } from "./lib/types";

// Mock minimal GameBoard (30x30)
const createBoard = (): GameBoard => Array(30).fill(null).map(() => Array(30).fill(null));

function runTest() {
    const board = createBoard();
    const player: Player = "X";
    const usedSequences: Sequence[] = [];
    const scores = { X: 0, O: 0 };
    const usedPositions = new Set<string>();

    console.log("--- Starting Scoring Test ---");

    // Scenario 1: Horizontal 5-in-a-row
    console.log("Test 1: Horizontal 5-in-a-row (0,0 to 0,4)");
    for (let c = 0; c < 5; c++) board[0][c] = "X";
    // Check from the last placed piece
    let result = checkWinConditions(board, "X", 0, 4, usedSequences, scores, usedPositions);

    if (result.newSequences.length === 1 && result.updatedScores.X === 1) {
        console.log("PASS: Recognized horizontal sequence.");
    } else {
        console.error("FAIL: Horizontal sequence missed.", result);
    }

    // Update state
    if (result.newSequences.length > 0) {
        usedSequences.push(...result.newSequences);
        result.newUsedPositions.forEach(([r, c]) => usedPositions.add(`${r},${c}`));
    }

    // Scenario 2: Diagonal 5-in-a-row (1,0 to 5,4) - "Straight Line" check
    console.log("Test 2: Diagonal 5-in-a-row");
    const diagStart = 1;
    const diagBoard = createBoard();
    for (let i = 0; i < 5; i++) diagBoard[diagStart + i][i] = "O";

    result = checkWinConditions(diagBoard, "O", diagStart + 4, 4, [], { X: 0, O: 0 }, new Set());
    if (result.newSequences.length === 1 && result.updatedScores.O === 1) {
        console.log("PASS: Recognized diagonal sequence.");
    } else {
        console.error("FAIL: Diagonal sequence missed.", result);
    }

    // Scenario 3: Verify Canonical Keys (Reverse Order)
    console.log("Test 3: Canonical Key Consistency");
    const forwardSeq = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] as Sequence;
    const reverseSeq = [[0, 4], [0, 3], [0, 2], [0, 1], [0, 0]] as Sequence;
    const k1 = canonicalSeqKey(forwardSeq);
    const k2 = canonicalSeqKey(reverseSeq);

    if (k1 === k2) {
        console.log("PASS: Canonical keys match for reverse sequences.");
    } else {
        console.error(`FAIL: Keys mismatch. '${k1}' vs '${k2}'`);
    }
}

// Mocking types for pure JS run if needed, but we are TS.
// runTest();

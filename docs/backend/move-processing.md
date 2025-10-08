# Move processing: server-authoritative atomic updates

Purpose

This document explains how the server should process moves for online matches in an atomic, consistent way (MongoDB examples). It documents the expected API contract, atomic update patterns to avoid double-scoring and race conditions, idempotency keys and recovery strategies, and sample Node/Express + Mongo code snippets.

Assumptions / data model

- Each match document looks like:
  {
    _id: ObjectId,
    board: string[][], // or a flat array; each cell is null | playerId
    usedPositions: string[], // array of "r,c" strings
    usedSequences: string[], // array of serialized sequences: "r1,c1|r2,c2|..."
    scores: { [playerId: string]: number },
    nextTurn: string | null, // player id who should move next
    status: "active" | "finished",
    lastMoveId?: string, // optional id of last applied move
    // ... other metadata
  }

Goals

- Only one move should be accepted at a time for a given match to avoid double-application.
- Moves must be validated server-side against current match state (turn, cell occupancy, status).
- When applying a move that creates new scoring sequences, update the `usedPositions`, `usedSequences`, and `scores` in a single atomic operation.
- Return the new authoritative match state in the response so clients can render exactly what the server has applied.

API contract expectations

- POST /matches/:id/move
  - Request body: { playerId: string, row: number, col: number, clientMoveId?: string }
  - Response 200: `{
      "success": true,
      "match": { /* authoritative match document */ }
    }`
  - Response 400: { success: false, error: "invalid_move", reason: "not_your_turn" | "cell_taken" | "match_finished" }
  - Response 409: { success: false, error: "conflict", reason: "stale_state" }

Atomic update pattern (Mongo)

1) Validate turn and cell occupancy in a single findOneAndUpdate call using pre-conditions in the query. Use $setOnInsert and $push/$addToSet/$inc as needed.

Example pseudo-code using the modern Node MongoDB driver and `findOneAndUpdate`:

```js
const filter = {
  _id: matchId,
  status: 'active',
  nextTurn: playerId,
  [`board.${row}.${col}`]: null, // or board[row][col] === null
}

const newSequences = calculateSequences(board, row, col, playerId) // run server-side game logic
const sequenceKeys = newSequences.map(s => serializeSequence(s))
const positionKeys = newSequences.flat().map(p => `${p.row},${p.col}`)

const update = {
  $set: {
    [`board.${row}.${col}`]: playerId,
    nextTurn: computeNextTurn(),
  },
  $addToSet: {
    usedPositions: { $each: positionKeys },
    usedSequences: { $each: sequenceKeys },
  },
  $inc: scoresIncObject, // e.g. { 'scores.playerA': 1 }
}

const opts = { returnDocument: 'after' }

const result = await matchesCollection.findOneAndUpdate(filter, update, opts)
if (!result.value) {
  // The preconditions failed; respond with 400 or 409 depending on why
}

// Return result.value as authoritative match state
```

Notes

- Use $addToSet for usedSequences and usedPositions to avoid duplicates.
- Building `scoresIncObject`: compute how many points each player gains from the new sequences and include in $inc.
- It's important to compute sequences on the server using deterministic logic that matches the client.

Idempotency and clientMoveId

- Clients may include a `clientMoveId` (uuid) with each move. Server should record the last applied `clientMoveId` (or a small history) and return 200 (with authoritative state) if the same id is re-sent.
- Alternatively, use a dedupe table keyed by `clientMoveId` to avoid re-applying moves.

Conflict handling and retry

- On 409 (conflict/stale), return the server match doc + reason. Client should fetch the authoritative match and re-sync UI.
- Avoid automatic retries that re-send the same move without user confirmation unless the client can guarantee idempotency.

Tests & validation

- Add unit tests for the server `applyMove` logic that mirror the client's `checkWinConditions` outputs. Ensure the same sequences are detected and the same scoring increments are returned.
- Add integration tests that run multiple concurrent requests against the same match to ensure `findOneAndUpdate` filter logic prevents double-apply.

Monitoring & observability

- Log move requests and their result (applied/rejected) with request ids and player ids.
- Track metrics for rejected moves (by reason) and conflicts; alert if conflict rate increases.

Appendix: sample Express handler

```js
// Express example (using async/await, Node Mongo driver)
app.post('/matches/:id/move', async (req, res) => {
  const { id } = req.params
  const { playerId, row, col, clientMoveId } = req.body

  // 1. Load match, validate turn, etc.
  // 2. Calculate sequences deterministically
  // 3. Use findOneAndUpdate with precondition filter shown above

  try {
    const result = await applyMoveAtomic(id, playerId, row, col, clientMoveId)
    if (!result.applied) {
      return res.status(409).json({ success: false, error: 'conflict', reason: result.reason, match: result.match })
    }
    return res.json({ success: true, match: result.match })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, error: 'internal_error' })
  }
})
```



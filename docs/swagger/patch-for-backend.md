Swagger patch proposal — align scoring to frontend (5-in-a-row only)

Goal

Bring the server API documentation (`/api/v1/move`) in `swagger.json` in line with the frontend’s canonical game rules:
- Scoring is only for 5-in-a-row subsequences.
- Longer runs should yield multiple 5-length subsequences where disjoint/un-used.
- No points for 2/3/4-in-a-row tiers — remove them from docs.

Why

Frontend implements and relies on deterministic 5-in-a-row scoring. Mismatched docs lead to inconsistent client/server implementations and integration bugs for online matches.

Required changes (concise)

1) Update `/api/v1/move` endpoint description and scoring section
- Replace the Scoring subsection that lists 2/3/4-tier points with a clear statement:
  - "Scoring: Each unique 5-in-a-row subsequence awards 1 point to the player. Overlapping subsequences that contain any cell listed in `usedPositions` should not be counted. Longer contiguous runs may contain multiple 5-length subsequences; server must enumerate and add each non-previously-used subsequence atomically."

2) Update response shape examples
- Ensure the `match` object returned includes:
  - `board`: 2D array of cell values (null, 'X', or 'O')
  - `usedPositions`: array of strings like "r,c"
  - `usedSequences`: array of sequences where each sequence is an array of position strings or coordinate pairs (pick consistent format; frontend expects arrays of [row,col])
  - `scores`: object { X: number, O: number }
  - `nextTurn`: player id or symbol

Example (recommended payload):
```json
{
  ---
  # Swagger patch proposal — align scoring to frontend (5-in-a-row only)

  Goal

  Bring the server API documentation (`/api/v1/move`) in `swagger.json` in line with the frontend’s canonical game rules.

  Key points

  - Scoring is only for 5-in-a-row subsequences.
  - Longer runs may contain multiple 5-length subsequences; each non-previously-used subsequence awards 1 point.
  - Overlapping subsequences that include any cell in `usedPositions` must not be counted.

  Why

  Frontend implements deterministic 5-in-a-row scoring. Mismatched docs lead to inconsistent client/server behavior for online matches.

  Required changes (concise)

  1. Update `/api/v1/move` endpoint description and scoring section

     Replace the current scoring paragraph (2/3/4-tier points) with the following statement:

     "Scoring: Each unique 5-in-a-row subsequence awards 1 point to the player. Overlapping subsequences that contain any cell listed in `usedPositions` should not be counted. Longer contiguous runs may contain multiple 5-length subsequences; the server must enumerate and add each non-previously-used subsequence atomically."

  2. Update response shape examples

     Ensure the `match` object returned includes the following fields (recommended formats):

     - `board`: 2D array of cell values (null, 'X', or 'O')
     - `usedPositions`: array of strings like "r,c"
     - `usedSequences`: array of 5-length subsequences expressed as arrays of [row, col] pairs (e.g. [[10,10],[10,11],[10,12],[10,13],[10,14]])
     - `scores`: object { "X": number, "O": number }
     - `nextTurn`: player id or symbol

  Example (recommended payload):

  ```json
  {
    "message": "Move made",
    "winner": null,
    "match": {
      "_id": "650b7d9a87f91345c1234567",
      "board": [[null, "X", "O", ...], ...],
      "usedPositions": ["10,10","10,11"],
      "usedSequences": [[[10,10],[10,11],[10,12],[10,13],[10,14]]],
      "scores": {"X": 2, "O": 1},
      "nextTurn": "playerId-or-X",
      "status": "active"
    }
  }
  ```

  3) Document error codes and idempotency

  - 400: invalid request (missing fields, cell occupied, etc.)
  - 403: not player's turn or player not in match
  - 409: conflict (precondition failed - e.g., move attempted on stale match state)
  - 500: internal error
  - Recommend supporting an optional `clientMoveId` for idempotency; if a duplicate `clientMoveId` is received, return 200 with the authoritative match doc.

  4) Server-side contract note

  - Recommend using `findOneAndUpdate` with preconditions and atomic operators (`$set`, `$addToSet`, `$inc`) to apply board, usedPositions, usedSequences, and scores in a single operation. See `docs/backend/move-processing.md` for a sample implementation.

  Suggested JSON patch (partial) to `/api/v1/move -> post -> description`:

  - Replace the scoring paragraph with the new bullet points above.

  Delivery

  If you want, I can prepare a ready-to-apply JSON patch for `swagger.json` (a snippet that replaces the scoring text and updates response examples). Tell me if you want a full `git` patch/PR or just the textual changes for the backend dev to apply.

  ---

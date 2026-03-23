
// Standalone reproduction script for Rematch 500 error (JS Version)

const API_CONFIG = {
    BASE_URL: "https://mooves.onrender.com/api/v1",
    ENDPOINTS: {
        LOGIN: "/login",
        REGISTER: "/users",
        MATCH_ROOMS: "/match-rooms",
        MATCHES: "/matches"
    }
};

async function request(endpoint, method = "GET", body, token) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
    const headers = {
        "Content-Type": "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    console.log(`[REQ] ${method} ${url}`);

    try {
        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const contentType = res.headers.get("content-type") || "";
        let data;
        if (contentType.includes("application/json")) {
            try {
                data = await res.json();
            } catch (e) {
                console.error("JSON Parse Error:", e);
                data = await res.text();
            }
        } else {
            data = await res.text();
            try { data = JSON.parse(data); } catch { }
        }

        if (!res.ok) {
            console.error(`[ERR] HTTP ${res.status}:`, data);
            return { success: false, status: res.status, data };
        }
        return { success: true, status: res.status, data };
    } catch (e) {
        console.error(`[NET] Error: ${e.message}`);
        return { success: false, error: e.message };
    }
}

async function run() {
    console.log("Starting Standalone Rematch Repro (JS)...");

    // 1. Register User A
    const emailA = `test_repro_a_${Date.now()}@example.com`;
    console.log(`1. Registering User A: ${emailA}`);
    const regA = await request("/users", "POST", {
        fullName: "User A",
        email: emailA,
        password: "P@ssword123!",
        repeatPassword: "P@ssword123!"
    });
    if (!regA.success) return;
    const tokenA = regA.data.token;
    const userA = regA.data.data;

    // 2. Register User B
    const emailB = `test_repro_b_${Date.now()}@example.com`;
    console.log(`2. Registering User B: ${emailB}`);
    const regB = await request("/users", "POST", {
        fullName: "User B",
        email: emailB,
        password: "P@ssword123!",
        repeatPassword: "P@ssword123!"
    });
    if (!regB.success) return;
    const tokenB = regB.data.token;
    const userB = regB.data.data;

    // 3. Create Match Room (User A)
    console.log("3. Creating Match Room (User A)...");
    const roomRes = await request("/match-rooms", "POST", {
        userId: userA._id,
        gameType: "TicTacToe"
    }, tokenA);
    console.log("Create Room Res:", JSON.stringify(roomRes, null, 2));
    if (!roomRes.success) return;

    const roomData = roomRes.data.data || roomRes.data;
    const roomCode = roomData.matchCode || roomData.roomCode || roomData.code;
    const roomId = roomData.roomId || roomData._id || roomData.id;

    console.log(`   Room Created: ID=${roomId}, Code=${roomCode}`);

    // 3b. Host (User A) Auto-Joins Room
    console.log(`3b. User A (Host) Auto-Joining Room ${roomCode}...`);
    const hostJoinRes = await request("/match-rooms/join", "POST", {
        matchCode: roomCode,
        userId: userA._id
    }, tokenA);
    if (!hostJoinRes.success) {
        console.error("   Host Join failed!", hostJoinRes);
        return;
    }

    // 4. Join Match Room (User B) using Code
    console.log(`4. User B Joinng Room ${roomCode}...`);
    const joinRes = await request("/match-rooms/join", "POST", {
        matchCode: roomCode,
        userId: userB._id
    }, tokenB);

    if (!joinRes.success) {
        console.error("   Join failed!");
        return;
    }

    // 5. Get Match ID
    let matchData = joinRes.data.data || joinRes.data;
    let matchId = matchData.matchId || matchData.match?._id;
    console.log(`   Match ID: ${matchId}`);

    // 5. Host (User A) triggers Match Creation (Retry Loop)
    console.log("5. Host triggering Match Creation...");
    let matchCreationSuccess = false;
    let createAttempts = 0;

    // Debug: Probe Room Existence
    console.log(`   Probing Room ID: ${roomId}`);
    await request(`/match-rooms/${roomId}`, "GET", undefined, tokenA);
    await request(`/matchroom/${roomId}`, "GET", undefined, tokenA);

    while (!matchCreationSuccess && createAttempts < 5) {
        console.log(`   Triggering create1v1Match (Attempt ${createAttempts + 1})...`);
        let matchCreationRes = await request("/matches", "POST", { roomId: roomId }, tokenA);

        if (matchCreationRes.success) {
            console.log("   Match Creation SUCCESS!", matchCreationRes.data);
            matchCreationSuccess = true;
            // The response might contain the match object
            const m = matchCreationRes.data.match || matchCreationRes.data;
            if (m._id) matchId = m._id;
        } else {
            console.log("   Match Creation Failed:", matchCreationRes.status, matchCreationRes.data);
            await new Promise(r => setTimeout(r, 2000));
        }
        createAttempts++;
    }

    if (!matchId) {
        // 6. Poll for Match ID (if not returned by create)
        // ... (existing poll logic)
        console.log("   Polling for Match ID via GET /matches...");
        let attempts = 0;
        while (!matchId && attempts < 5) {
            // ... (rest of polling logic)
            // I will just copy the existing polling logic structure here but keep it cleaner
            await new Promise(r => setTimeout(r, 1000));
            // Try Standard GET /matches
            let listRes = await request("/matches", "GET", undefined, tokenA); // List all matches?
            // Or Poll specific match ID? 
            // Since we don't have matchId, we can't poll /matches/:id
            // But we can poll /match-rooms/:roomId to see if it has a matchId? (If that endpoint exists)

            // Revert to polling /matches/:roomId assuming it might return the match eventually?
            let roomDetails = await request(`/matches/${roomId}`, "GET", undefined, tokenA);
            if (roomDetails.success) {
                const m = roomDetails.data.match || roomDetails.data;
                if (m.status === 'ongoing' || m.status === 'started' || (m.player1 && m.player2)) {
                    matchId = m._id;
                    break;
                }
            }
            attempts++;
        }
    }

    if (!matchId) {
        console.error("   Could not find active Match ID. Trying direct join by ID...");
        await request(`/matches/${roomId}/join`, "POST", {}, tokenB);
        // one last check
        const finalCheck = await request(`/matches/${roomId}`, "GET", undefined, tokenA);
        matchId = finalCheck.data?._id || finalCheck.data?.match?._id;
    }

    if (!matchId) {
        console.error("   Still no Match ID. Aborting.");
        return;
    }

    // 6. Play Game (User A wins vertically)
    console.log("6. Playing Game (User A Wins)...");

    // Simple 5-move vertical sequence
    // A: 0,0 | B: 0,1
    // A: 1,0 | B: 1,1
    // A: 2,0 | B: 2,1
    // A: 3,0 | B: 3,1
    // A: 4,0 -> WIN

    const moves = [
        { u: userA, r: 0, c: 0, s: "X" }, { u: userB, r: 0, c: 1, s: "O" },
        { u: userA, r: 1, c: 0, s: "X" }, { u: userB, r: 1, c: 1, s: "O" },
        { u: userA, r: 2, c: 0, s: "X" }, { u: userB, r: 2, c: 1, s: "O" },
        { u: userA, r: 3, c: 0, s: "X" }, { u: userB, r: 3, c: 1, s: "O" },
        { u: userA, r: 4, c: 0, s: "X" }
    ];

    for (const m of moves) {
        // console.log(`   Move: ${m.s} (${m.r}, ${m.c})`);
        const res = await request(`/matches/${matchId}/move`, "POST", {
            playerId: m.u._id,
            row: m.r,
            col: m.c,
            // matchId: matchId, // In body? Swagger says 'matchid' lowercase? 
            // Update: Swagger says /api/v1/matches/{matchId}/move takes matchId in path.
            // Client.ts sends: { playerId, row, col, symbol } body to /matches/:id/move
            // Wait, client.ts MAKEGAMEMOVE: request(`/matches/${matchId}/move`)
            // But api-config might map it? No, client.ts text is explicit.
            symbol: m.s
        }, m.u === userA ? tokenA : tokenB);

        // My request helper appends BASE_URL/api/v1. Endpoint is /matches/:id/move
        // So I should pass /matches/${matchId}/move to request()
    }

    // Checking if game is completed
    console.log("   Moves completed. Checking status...");
    const matchCheck = await request(`/matches/${matchId}`, "GET", undefined, tokenA);
    console.log("   Match Status:", matchCheck.data.match?.status || matchCheck.data.status);
    console.log("   Match Winner:", matchCheck.data.match?.winner || matchCheck.data.winner);

    // 7. Request Rematch
    console.log("7. Requesting Rematch...");
    const rematchRes = await request(`/matches/${matchId}/rematch`, "POST", {
        userId: userA._id
    }, tokenA);

    console.log("---------------------------------------------------");
    console.log("REMATCH RESPONSE:");
    console.log(JSON.stringify(rematchRes, null, 2));
    console.log("---------------------------------------------------");

    // 8. Probe: Can we Reuse the Room to create a NEW match?
    console.log("8. Probing Room Reuse (create1v1Match with same RoomID)...");
    const reuseRes = await request("/matches", "POST", { roomId: roomId }, tokenA);
    console.log(`   Reuse Room Result:`, reuseRes.status, reuseRes.data);

    if (reuseRes.success) {
        const newMatch = reuseRes.data.match || reuseRes.data;
        console.log(`   NEW MATCH CREATED! ID: ${newMatch._id}`);
        // If this works, we found our workaround!
    } else {
        console.log("   Reuse failed. Maybe need to reset room status?");
    }
}

run().catch(console.error);

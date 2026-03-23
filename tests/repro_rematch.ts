
// Standalone reproduction script for Rematch 500 error

const API_CONFIG = {
    BASE_URL: "https://mooves.onrender.com/api/v1",
    ENDPOINTS: {
        LOGIN: "/login",
        REGISTER: "/users",
        MATCH_ROOMS: "/match-rooms",
        MATCHES: "/matches"
    }
};

async function request(endpoint: string, method: string = "GET", body?: any, token?: string) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
    const headers: any = {
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
            data = await res.json();
        } else {
            data = await res.text();
            try { data = JSON.parse(data); } catch { }
        }

        if (!res.ok) {
            console.error(`[ERR] HTTP ${res.status}:`, data);
            return { success: false, status: res.status, data };
        }
        return { success: true, status: res.status, data };
    } catch (e: any) {
        console.error(`[NET] Error: ${e.message}`);
        return { success: false, error: e.message };
    }
}

async function run() {
    console.log("Starting Standalone Rematch Repro...");

    // 1. Register User A
    const emailA = `test_repro_a_${Date.now()}@example.com`;
    console.log(`1. Registering User A: ${emailA}`);
    const regA = await request("/users", "POST", {
        fullName: "User A",
        email: emailA,
        password: "password123",
        repeatPassword: "password123"
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
        password: "password123",
        repeatPassword: "password123"
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
    if (!roomRes.success) return;

    // The structure might be { success: true, data: { ... } } or just { ... }
    // Based on logs, it returns { success: true, data: { roomCode: "...", ... } }
    const roomData = roomRes.data.data || roomRes.data;
    const roomCode = roomData.roomCode || roomData.code;
    const roomId = roomData._id || roomData.id;

    console.log(`   Room Created: ID=${roomId}, Code=${roomCode}`);

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
    // Join response usually has match info
    const matchData = joinRes.data.data || joinRes.data;
    const matchId = matchData.matchId || matchData.match?._id;
    console.log(`   Match ID: ${matchId}`);

    if (!matchId) {
        console.error("   No Match ID found in join response!", matchData);
        // Try to fetch room details to find match
        const roomDetails = await request(`/matchroom/${roomId}`, "GET", undefined, tokenA);
        console.log("   Room Details Probe:", roomDetails.data);
        return;
    }

    // 6. Wait (simulate game) - Optional, but let's just complete it
    // Submit Result (User A wins)
    console.log("6. Submitting Result (User A Wins)...");
    const submitRes = await request(`/${matchId}/submit-result`, "POST", {
        winnerId: userA._id
    }, tokenA);
    console.log("   Submit Result:", submitRes.success ? "OK" : "FAIL");

    // 7. Request Rematch
    console.log("7. Requesting Rematch...");
    const rematchRes = await request(`/matches/${matchId}/rematch`, "POST", {
        userId: userA._id
    }, tokenA);

    console.log("---------------------------------------------------");
    console.log("REMATCH RESPONSE:");
    console.log(JSON.stringify(rematchRes, null, 2));
    console.log("---------------------------------------------------");
}

run().catch(console.error);

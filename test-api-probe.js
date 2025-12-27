console.log("Script starting...");

if (!global.fetch) {
    console.error("This script requires Node.js 18+ with native fetch.");
    if (process.versions && process.versions.node) {
        const major = parseInt(process.versions.node.split('.')[0]);
        if (major < 18) {
            console.error(`Current Node version: ${process.version}. Please upgrade.`);
        }
    }
    process.exit(1);
}

const BASE_URL = 'https://mooves.onrender.com/api/v1';

async function run() {
    console.log(`Node Version: ${process.version}`);
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const password = 'password123';

    console.log(`--- 1. Registering User: ${email} ---`);
    let res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'Test User', email, password, repeatPassword: password })
    });

    if (!res.ok) {
        console.log("Register failed:", res.status, await res.text());
        // try login just in case
        console.log("Trying login...");
        res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    }

    let data = await res.json();
    const token = data.token;
    const userId = data.data?._id || data.data?.id;
    console.log(`User ID: ${userId}, Token: ${token ? 'YES' : 'NO'}`);

    if (!token) {
        console.error("Failed to get token, aborting.");
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log(`\n--- 2. Creating Live Match (POST /match-rooms) ---`);
    res = await fetch(`${BASE_URL}/match-rooms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, gameType: 'TicTacToe' })
    });
    const createData = await res.json();
    console.log("Create Response:", JSON.stringify(createData, null, 2));

    const roomId = createData.data?.roomId || createData.data?.id;
    const matchCode = createData.data?.matchCode || createData.data?.roomCode;

    if (!roomId) {
        console.error("No roomId returned!");
        return;
    }

    console.log(`\nRoomID: ${roomId}`);
    console.log(`MatchCode: ${matchCode}`);

    // Probe 1: GET /match-rooms/:roomId
    console.log(`\n--- 3. Probe with Token: GET /match-rooms/${roomId} ---`);
    res = await fetch(`${BASE_URL}/match-rooms/${roomId}`, { headers });
    console.log(`Status: ${res.status}`);
    console.log("Response:", await res.text());

    // Probe 2: GET /matches/:roomId
    console.log(`\n--- 4. Probe with Token: GET /matches/${roomId} ---`);
    res = await fetch(`${BASE_URL}/matches/${roomId}`, { headers });
    console.log(`Status: ${res.status}`);
    console.log("Response:", await res.text());

    // Probe 3: GET /matches (List)
    console.log(`\n--- 5. Probe with Token: GET /matches (List) ---`);
    res = await fetch(`${BASE_URL}/matches`, { headers });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
        const listWrapper = await res.json();
        // Adjust for wrapper
        // Usually { success: true, data: [...] }
        const list = Array.isArray(listWrapper) ? listWrapper : (listWrapper.data || []);
        console.log(`Found ${Array.isArray(list) ? list.length : 'unknown'} matches in list.`);
        console.log("First returned match (if any):", list && list.length > 0 ? JSON.stringify(list[0], null, 2) : "None");
    } else {
        console.log("Response:", await res.text());
    }

    // Probe 4: POST /match-rooms/join (Join by Code) - SELF JOIN
    // This is the critical test to see if "joining" provides the room details
    console.log(`\n--- 6. Probe with Token: POST /match-rooms/join (Join by Code: ${matchCode}) ---`);
    res = await fetch(`${BASE_URL}/match-rooms/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ matchCode, userId })
    });
    console.log(`Status: ${res.status}`);
    console.log("Response:", await res.text());
}

run().catch(e => console.error("RUN ERROR:", e));

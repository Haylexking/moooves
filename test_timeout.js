const fetch = require('node-fetch');

const PROD_URL = 'https://mooves.onrender.com/api/v1';

async function testGame() {
    console.log("Registering test users...");
    const u1 = `test_${Date.now()}@test.com`;
    const u2 = `test_${Date.now() + 1}@test.com`;

    // Register
    let res1 = await fetch(`${PROD_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u1, password: "Password123!", fullName: "Test 1" })
    });

    let res2 = await fetch(`${PROD_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u2, password: "Password123!", fullName: "Test 2" })
    });

    // Login user 1
    let login1 = await fetch(`${PROD_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u1, password: "Password123!" })
    });
    let auth1 = await login1.json();
    const token1 = auth1.token || auth1.data?.token;
    const uid1 = auth1.data?.user?._id || auth1.data?.user?.id || auth1.data?.id || auth1.user?.id || auth1.user?._id;

    // Login user 2
    let login2 = await fetch(`${PROD_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u2, password: "Password123!" })
    });
    let auth2 = await login2.json();
    const token2 = auth2.token || auth2.data?.token;
    const uid2 = auth2.data?.user?._id || auth2.data?.user?.id || auth2.data?.id || auth2.user?.id || auth2.user?._id;

    console.log("Creating room...");
    let createRes = await fetch(`${PROD_URL}/match-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
        body: JSON.stringify({ userId: uid1, gameType: "TicTacToe" })
    });

    let roomData = await createRes.json();
    const roomId = roomData.roomId || roomData.id || (roomData.room && roomData.room._id) || roomData.matchId || roomData.data?.roomId || roomData.data?.room?._id;
    const matchCode = roomData.matchCode || roomData.inviteCode || roomData.data?.matchCode || roomData.data?.roomCode || roomData.data?.room?.matchCode;

    console.log("Joining room with code:", matchCode);
    let joinRes = await fetch(`${PROD_URL}/match-rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
        body: JSON.stringify({ matchCode, userId: uid2 })
    });
    let joinData = await joinRes.json();

    console.log("Starting Match...");
    let startRes = await fetch(`${PROD_URL}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
        body: JSON.stringify({ roomId })
    });
    let startData = await startRes.json();
    let finalMatchId = startData.data?.match?._id || startData.data?.match?.id;

    if (!finalMatchId) {
        console.log("Could not start match. Fallback to older logic.", startData);
        return;
    }

    // Try a VALID 3x3 move first
    console.log("Making valid 3x3 move at 1,1 for match:", finalMatchId);
    let moveRes1 = await fetch(`${PROD_URL}/matches/${finalMatchId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
        body: JSON.stringify({ playerId: uid1, row: 1, col: 1, symbol: "X" })
    });
    console.log("Valid Move Response Status:", moveRes1.status);
    console.log("Valid Move Response:", await moveRes1.text());

    // Switch turns to player 2 for the out of bounds move
    console.log("Making OUT OF BOUNDS move at 11,7 for match:", finalMatchId);
    let moveRes2 = await fetch(`${PROD_URL}/matches/${finalMatchId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
        body: JSON.stringify({ playerId: uid2, row: 11, col: 7, symbol: "O" })
    });
    console.log("OOB Move Response Status:", moveRes2.status);
    console.log("OOB Move Response:", await moveRes2.text());
}

testGame().catch(console.error);

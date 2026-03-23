
const BASE_URL = 'https://mooves.onrender.com/api/v1';

async function testGame() {
    console.log("Registering test users...");
    const u1 = `test_${Date.now()}@test.com`;
    const u2 = `test_${Date.now() + 1}@test.com`;

    // Register
    let res1 = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u1, password: "Password123!", fullName: "Test 1" })
    });

    let res2 = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u2, password: "Password123!", fullName: "Test 2" })
    });

    // Login user 1
    let login1 = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u1, password: "Password123!" })
    });
    let auth1 = await login1.json();
    console.log("Auth 1:", auth1);
    const token1 = auth1.token || auth1.data?.token;
    const uid1 = auth1.data?.user?._id || auth1.data?.user?.id || auth1.data?.id || auth1.user?.id || auth1.user?._id;

    // Login user 2
    let login2 = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u2, password: "Password123!" })
    });
    let auth2 = await login2.json();
    const token2 = auth2.token || auth2.data?.token;
    const uid2 = auth2.data?.user?._id || auth2.data?.user?.id || auth2.data?.id || auth2.user?.id || auth2.user?._id;

    console.log("Creating room...");
    let createRes = await fetch(`${BASE_URL}/match-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
        body: JSON.stringify({ gameType: "1v1" }) // swagger example says gameType, but maybe userId is needed.
    });
    // Fallback if requires body userId
    if (!createRes.ok) {
        createRes = await fetch(`${BASE_URL}/match-rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
            body: JSON.stringify({ userId: uid1, gameType: "1v1" })
        });
    }

    let roomData = await createRes.json();
    console.log("Room Created:", roomData);

    const roomId = roomData.roomId || roomData.id || (roomData.room && roomData.room._id) || roomData.matchId || roomData.data?.roomId;
    const matchCode = roomData.matchCode || roomData.inviteCode || roomData.data?.matchCode;

    console.log("Joining room with code:", matchCode);
    let joinRes = await fetch(`${BASE_URL}/match-rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
        body: JSON.stringify({ matchCode, userId: uid2 })
    });
    let joinData = await joinRes.json();
    console.log("Joined Room:", joinData);

    let finalMatchId = joinData.room?._id || joinData.roomId || roomId;

    // Check if match exists and created from join 
    if (joinData.data?.matchId) {
        finalMatchId = joinData.data.matchId;
    }

    console.log("Making move at 15,15 for match:", finalMatchId);
    let moveRes = await fetch(`${BASE_URL}/matches/${finalMatchId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
        body: JSON.stringify({ playerId: uid1, row: 15, col: 15, symbol: "X" })
    });
    console.log("Move Response Status:", moveRes.status);
    console.log("Move Response:", await moveRes.text());
}

testGame().catch(console.error);

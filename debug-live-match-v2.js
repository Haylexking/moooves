
const https = require('https');
const fs = require('fs');

const LOG_FILE = 'debug_log.txt';
fs.writeFileSync(LOG_FILE, ''); // Clear log

function log(...args) {
    const msg = args.map(a => {
        if (a instanceof Error) return a.stack || a.message;
        if (typeof a === 'object') return JSON.stringify(a);
        return String(a);
    }).join(' ') + '\n';
    fs.appendFileSync(LOG_FILE, msg);
    process.stdout.write(msg);
}

console.log = log;
console.error = log;

const BASE_HOST = "mooves.onrender.com";
const BASE_PATH = "/api/v1";

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_HOST,
            path: BASE_PATH + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = jsonStr => {
                        try { return JSON.parse(jsonStr); } catch (e) { return jsonStr; }
                    };
                    resolve({ status: res.statusCode, data: json(data) });
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function run() {
    console.log("=== STARTING LIVE MATCH DEBUG (Native HTTPS) ===");

    try {
        // 1. Create User A (Host)
        const hostName = "HostUser" + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const hostUser = await registerUser(hostName);
        console.log("1. Host Created:", hostUser.email, hostUser._id);

        // 2. Create User B (Joiner)
        const joinerName = "JoinerUser" + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const joinerUser = await registerUser(joinerName);
        console.log("2. Joiner Created:", joinerUser.email, joinerUser._id);

        // 3. User A Creates Room
        console.log("\n--- Creating Room ---");
        const roomRes = await request('POST', '/match-rooms', { userId: hostUser._id, gameType: "TicTacToe" });
        console.log("Room Create Response:", roomRes.status, JSON.stringify(roomRes.data));

        if (!roomRes.data.matchCode) {
            console.error("FAILED to create room.");
            return;
        }

        const roomId = roomRes.data.roomId;
        const matchCode = roomRes.data.matchCode;

        // 3.5 Host Joins Room (Hypothesis check)
        console.log(`\n--- Host Joining Own Room with Code ${matchCode} ---`);
        const hostJoinRes = await request('POST', '/match-rooms/join', { matchCode: matchCode, userId: hostUser._id });
        console.log("Host Join Response:", hostJoinRes.status, JSON.stringify(hostJoinRes.data));

        // 4. User A Polls (Should Fail initially)
        console.log("\n--- Host Polling (Attempt 1 - Empty) ---");
        await pollMatch(roomId);

        // 5. User B Joins
        console.log(`\n--- Joiner Joining with Code ${matchCode} ---`);
        const joinRes = await request('POST', '/match-rooms/join', { matchCode: matchCode, userId: joinerUser._id });
        console.log("Join Response:", joinRes.status, JSON.stringify(joinRes.data));

        // 6. User A Polls (Should SUCCEED)
        console.log("\n--- Host Polling (Attempt 2 - After Join) ---");
        const success = await pollMatch(roomId);

        if (success) {
            console.log("\n✅ SUCCESS! Match created.");
        } else {
            console.log("\n❌ FAILED! Host could not create match despite joiner.");
        }
    } catch (e) {
        console.error("Script Error:", e);
    }
}

async function registerUser(username) {
    // Try /users first (as per api-config)
    try {
        const res = await request('POST', '/users', {
            fullName: username, // API maps username to fullName
            email: `${username}@test.com`,
            password: "Password123!",
            repeatPassword: "Password123!"
        });
        console.log("Register Response for", username, ":", JSON.stringify(res.data));
        if (res.status === 201 || res.status === 200) {
            // Adapt to the actual structure
            // If response is { success: true, data: { token, data: user } }
            // or { token, user }
            const body = res.data;
            if (body.user) return body.user;
            if (body.data && body.data.data) return body.data.data; // Common pattern in this codebase
            if (body.data && body.data.user) return body.data.user;
            if (body.data) return body.data;
            return body;
        }
        // Fallback or error
        throw new Error("Register Failed: " + JSON.stringify(res.data));
    } catch (e) {
        throw e;
    }
}

async function pollMatch(roomId) {
    const res = await request('POST', '/matches', { roomId: roomId });
    console.log(`Poll Result (${res.status}):`, JSON.stringify(res.data));
    return res.status === 201;
}

run();

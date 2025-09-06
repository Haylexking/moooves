import type {
    Tournament,
    TournamentParticipant,
    TournamentBracket,
    BracketRound,
    BracketMatch,
} from "@/lib/types"

// Seedable RNG (mulberry32)
function createRng(seed: number) {
    let t = seed >>> 0
    return function rng() {
        t += 0x6D2B79F5
        let r = Math.imul(t ^ (t >>> 15), 1 | t)
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
}

function uuid(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID()
    }
    // Fallback
    return `uuid-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

interface MinimalUserLike {
    userId: string
    email: string
}

export function createMockTournament(participants: MinimalUserLike[], seed = Date.now()): Tournament {
    const rng = createRng(typeof seed === "number" ? seed : Date.now())
    const now = Date.now()

    const tournamentId = uuid()

    const tournamentParticipants: TournamentParticipant[] = participants.map((p) => ({
        userId: p.userId,
        email: p.email,
        joinedAt: now,
        paymentStatus: "confirmed",
        eliminated: false,
    }))

    // Single round with round-robin pairings
    const matches: BracketMatch[] = []
    for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
            matches.push({
                id: uuid(),
                tournamentId,
                roundNumber: 1,
                player1Id: participants[i].userId,
                player2Id: participants[j].userId,
                status: "waiting",
                player1Score: 0,
                player2Score: 0,
                moveHistory: [],
            })
        }
    }

    const bracket: TournamentBracket = {
        rounds: [
            {
                roundNumber: 1,
                status: "waiting",
                matches,
            } as BracketRound,
        ],
        currentRound: 1,
    }

    const tournament: Tournament = {
        id: tournamentId,
        hostId: participants[0]?.userId || "host-unknown",
        name: "Mock Tournament",
        status: "waiting",
        inviteCode: Math.floor(rng() * 1_000_000)
            .toString()
            .padStart(6, "0"),
        inviteLink: `/join/${tournamentId}`,
        entryFee: 1000,
        minPlayers: 6,
        maxPlayers: 50,
        currentPlayers: tournamentParticipants.length,
        totalPool: tournamentParticipants.length * 1000,
        gameMode: "timed",
        matchDuration: 10 * 60 * 1000,
        participants: tournamentParticipants,
        bracket,
        winners: [],
        createdAt: now,
    }

    return tournament
}

export function simulateMatchResult(match: BracketMatch, seed = Date.now()): BracketMatch {
    const rng = createRng(typeof seed === "number" ? seed : Date.now())
    const p1 = Math.floor(rng() * 10)
    const p2 = Math.floor(rng() * 10)

    let winnerId: string | undefined
    if (p1 > p2) winnerId = match.player1Id
    else if (p2 > p1) winnerId = match.player2Id

    return {
        ...match,
        player1Score: p1,
        player2Score: p2,
        winnerId,
        status: "completed",
        completedAt: Date.now(),
    }
}



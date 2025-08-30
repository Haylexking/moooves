import type { Tournament, Match, Player } from "@/lib/types"

export function createMockTournament(participants: Player[]): Tournament {
  const tournament: Tournament = {
    id: `tournament-${Date.now()}`,
    name: "Mock Tournament",
    status: "pending",
    participants,
    matches: [],
    createdAt: Date.now(),
  }

  // Generate round-robin matches
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const match: Match = {
        id: `match-${i}-${j}-${Date.now()}`,
        tournamentId: tournament.id,
        players: [participants[i], participants[j]],
        status: "waiting",
      }
      tournament.matches.push(match)
    }
  }

  return tournament
}

export function simulateMatchResult(match: Match): Match {
  const randomWinner = Math.random() > 0.5 ? match.players[0] : match.players[1]
  const scores = {
    [match.players[0]]: Math.floor(Math.random() * 10),
    [match.players[1]]: Math.floor(Math.random() * 10),
  }

  return {
    ...match,
    status: "finished",
    result: {
      winner: randomWinner,
      isDraw: scores[match.players[0]] === scores[match.players[1]],
      finalScores: scores,
      totalMoves: Math.floor(Math.random() * 100) + 50,
      gameDuration: Math.floor(Math.random() * 600000) + 300000, // 5-15 minutes
      usedSequences: [], // Mock empty for now
    },
    startTime: Date.now() - Math.floor(Math.random() * 600000),
    endTime: Date.now(),
  }
}

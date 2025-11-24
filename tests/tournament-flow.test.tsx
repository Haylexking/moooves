import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { JoinTournamentFlow } from "@/components/tournament/join-tournament-flow"
import { TournamentView } from "@/components/tournament/tournament-view"
import type { Tournament } from "@/lib/types"
import { apiClient } from "@/lib/api/client"

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    initWalletTransaction: jest.fn(),
    verifyWalletTransaction: jest.fn(),
    joinTournamentWithCode: jest.fn(),
    getTournament: jest.fn(),
    getTournamentWinners: jest.fn(),
  },
}))

jest.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: (selector?: any) => {
    const state = {
      user: { id: "user-1", fullName: "Player One", emailVerified: true },
      refreshUser: jest.fn().mockResolvedValue(undefined),
    }
    return selector ? selector(state) : state
  },
}))

describe("Tournament user flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("JoinTournamentFlow shows ticket confirmation after successful join", async () => {
    const sampleTournament = buildTournament()
      ; (apiClient.initWalletTransaction as jest.Mock).mockResolvedValue({ success: true, data: {} })
      ; (apiClient.joinTournamentWithCode as jest.Mock).mockResolvedValue({ success: true, data: {} })

    render(<JoinTournamentFlow tournament={sampleTournament} inviteCode="ABC123" />)

    fireEvent.click(screen.getByRole("button", { name: /join tournament/i }))

    await waitFor(() => expect(screen.getByText(/You're in/i)).toBeInTheDocument())
    expect(screen.getByText(/Reference/)).toBeInTheDocument()
  })

  test("TournamentView renders bracket, countdown, and winners", () => {
    const tournament = buildTournament({
      status: "waiting",
      participants: [
        {
          userId: "user-1",
          email: "one@example.com",
          joinedAt: Date.now(),
          paymentStatus: "confirmed",
          eliminated: false,
        },
        {
          userId: "user-2",
          email: "two@example.com",
          joinedAt: Date.now(),
          paymentStatus: "confirmed",
          eliminated: false,
        },
      ],
      bracket: {
        currentRound: 1,
        rounds: [
          {
            roundNumber: 1,
            status: "waiting",
            matches: [
              {
                id: "match-1",
                tournamentId: "tournament-1",
                roundNumber: 1,
                player1Id: "user-1",
                player2Id: "user-2",
                winnerId: undefined,
                player1Score: 0,
                player2Score: 0,
                status: "waiting",
                moveHistory: [],
              },
            ],
          },
        ],
      },
      winners: [{ userId: "user-2", rank: 1, prize: 3000, paidOut: false }],
    })

    render(<TournamentView tournament={tournament} />)

    expect(screen.getByText(/Round 1/)).toBeInTheDocument()
    expect(screen.getByText(/one@example.com/i)).toBeInTheDocument()
    expect(screen.getByText(/₦3,000/)).toBeInTheDocument()
  })
})

function buildTournament(overrides: Partial<Tournament> = {}): Tournament {
  const now = Date.now()
  return {
    id: "tournament-1",
    hostId: "host-1",
    name: "Championship Clash",
    status: "waiting",
    inviteCode: "ABC123",
    inviteLink: "",
    entryFee: 500,
    minPlayers: 6,
    maxPlayers: 8,
    currentPlayers: 2,
    totalPool: 5000,
    gameMode: "timed",
    matchDuration: 10,
    participants: [],
    bracket: { currentRound: 0, rounds: [] },
    winners: [],
    createdAt: now,
    startedAt: now + 60 * 60 * 1000,
    completedAt: undefined,
    ...overrides,
  }
}

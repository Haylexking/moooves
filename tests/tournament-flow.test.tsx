import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { JoinTournamentFlow } from "@/components/tournament/join-tournament-flow"
import { TournamentBracket } from "@/components/tournament/tournament-bracket"
import { TournamentWaitingRoom } from "@/components/tournament/tournament-waiting-room"
import type { Tournament } from "@/lib/types"
import { apiClient } from "@/lib/api/client"

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    initWalletTransaction: jest.fn(),
    verifyWalletTransaction: jest.fn(),
    joinTournamentWithCode: jest.fn(),
    getTournament: jest.fn(),
    getTournamentWinners: jest.fn(),
    getTournamentWaitingRoom: jest.fn(),
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

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
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

    // Ensure button exists before clicking
    const joinBtn = screen.getByRole("button", { name: /join tournament/i })
    fireEvent.click(joinBtn)

    await waitFor(() => expect(screen.getByText(/You're in/i)).toBeInTheDocument())
    expect(screen.getByText(/Reference/)).toBeInTheDocument()
  })

  test("TournamentWaitingRoom renders players and invite code", async () => {
    // Mock the waiting room polling response with CORRECT shape
    const mockParticipants = [
      {
        _id: "p1",
        userId: { _id: "u1", username: "Player One", fullName: "Player One" },
        joinedAt: new Date().toISOString()
      },
      {
        _id: "p2",
        userId: { _id: "u2", username: "Player Two", fullName: "Player Two" },
        joinedAt: new Date().toISOString()
      }
    ]

      ; (apiClient.getTournamentWaitingRoom as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          players: mockParticipants,
          tournament: { currentPlayers: 2, maxPlayers: 8 }
        }
      })

    render(
      <TournamentWaitingRoom
        tournamentId="tournament-1"
        maxPlayers={8}
        inviteCode="ABC123"
        isHost={true}
        startTime={new Date().toISOString()}
      />
    )

    // Check for static elements
    // Note: "Waiting for players" is only shown when empty. 
    // We check for "Players Joined" which is in the status bar.
    expect(screen.getByText(/Players Joined/i)).toBeInTheDocument()
    expect(screen.getByText(/ABC123/)).toBeInTheDocument()

    // Check for polling results (wait for effect)
    await waitFor(() => {
      expect(apiClient.getTournamentWaitingRoom).toHaveBeenCalled()
      expect(screen.getByText("Player One")).toBeInTheDocument()
      expect(screen.getByText("Player Two")).toBeInTheDocument()
      // Check count "2" and "/8" separately as they are split by span
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("/8")).toBeInTheDocument()
    })
  })

  test("TournamentBracket renders rounds and matches correctly", () => {
    const bracket = {
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
            {
              id: "match-2",
              tournamentId: "tournament-1",
              roundNumber: 1,
              player1Id: "user-3",
              player2Id: "user-4",
              winnerId: undefined,
              player1Score: 0,
              player2Score: 0,
              status: "active",
              moveHistory: [],
            },
          ],
        },
      ],
    }

    render(<TournamentBracket bracket={bracket} currentUserId="user-1" />)

    expect(screen.getByText(/Round 1/i)).toBeInTheDocument()
    expect(screen.getByText(/user-1/i)).toBeInTheDocument() // Using slice(0,8) logic in component? user-1 is short enough
    expect(screen.getByText(/user-2/i)).toBeInTheDocument()
    // "Live" badge for active match
    expect(screen.getByText(/Live/i)).toBeInTheDocument()
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

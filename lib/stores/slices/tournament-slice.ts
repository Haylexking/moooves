import type { StateCreator } from "zustand"
import type { Tournament, CreateTournamentRequest, JoinTournamentRequest } from "@/lib/types"

export interface TournamentSlice {
  tournaments: Tournament[]
  currentTournament: Tournament | null
  userTournaments: Tournament[]
  isLoading: boolean

  // Actions
  createTournament: (request: CreateTournamentRequest) => Promise<Tournament>
  joinTournament: (request: JoinTournamentRequest) => Promise<void>
  loadUserTournaments: (userId: string) => Promise<void>
  loadTournament: (tournamentId: string) => Promise<void>
  startTournament: (tournamentId: string) => Promise<void>
  updateTournamentStatus: (tournamentId: string, status: Tournament["status"]) => void
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set, get) => ({
  tournaments: [],
  currentTournament: null,
  userTournaments: [],
  isLoading: false,

  createTournament: async (request: CreateTournamentRequest) => {
    set({ isLoading: true })
    try {
      // TODO: Replace with actual API call
      const tournament: Tournament = {
        id: `tournament-${Date.now()}`,
        hostId: "current-user-id", // Get from auth
        name: request.name,
        status: "created",
        inviteCode: generateInviteCode(),
        inviteLink: `https://moooves.app/join/${generateInviteCode()}`,
        entryFee: request.entryFee,
        minPlayers: 6,
        maxPlayers: request.maxPlayers,
        currentPlayers: 0,
        totalPool: 0,
        gameMode: request.gameMode,
        matchDuration: 10 * 60, // 10 minutes
        participants: [],
        bracket: { rounds: [], currentRound: 0 },
        winners: [],
        createdAt: Date.now(),
      }

      set((state) => ({
        tournaments: [...state.tournaments, tournament],
        currentTournament: tournament,
        isLoading: false,
      }))

      return tournament
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  joinTournament: async (request: JoinTournamentRequest) => {
    set({ isLoading: true })
    try {
      // TODO: Replace with actual API call
      // 1. Validate invite code
      // 2. Check tournament capacity
      // 3. Initiate payment
      // 4. Add user to participants

      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  loadUserTournaments: async (userId: string) => {
    set({ isLoading: true })
    try {
      // TODO: Replace with actual API call
      const userTournaments: Tournament[] = []
      set({ userTournaments, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  loadTournament: async (tournamentId: string) => {
    set({ isLoading: true })
    try {
      // TODO: Replace with actual API call
      const tournament = get().tournaments.find((t) => t.id === tournamentId)
      set({ currentTournament: tournament || null, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  startTournament: async (tournamentId: string) => {
    try {
      // TODO: Replace with actual API call
      // 1. Validate minimum players
      // 2. Generate bracket
      // 3. Start first round

      set((state) => ({
        tournaments: state.tournaments.map((t) =>
          t.id === tournamentId ? { ...t, status: "active" as const, startedAt: Date.now() } : t,
        ),
      }))
    } catch (error) {
      throw error
    }
  },

  updateTournamentStatus: (tournamentId: string, status: Tournament["status"]) => {
    set((state) => ({
      tournaments: state.tournaments.map((t) => (t.id === tournamentId ? { ...t, status } : t)),
      currentTournament:
        state.currentTournament?.id === tournamentId ? { ...state.currentTournament, status } : state.currentTournament,
    }))
  },
})

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

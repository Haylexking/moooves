import type { StateCreator } from "zustand"
import type { Tournament } from "@/lib/types"
import { API_CONFIG } from "@/lib/config/api-config"

export interface TournamentSlice {
  tournaments: Tournament[]
  currentTournament: Tournament | null
  isLoading: boolean

  // Actions
  createTournament: (data: {
    name: string
    entryfee: number
    maxPlayers: number
    organizerId?: string
  }) => Promise<Tournament>
  joinTournament: (inviteCode: string, userId: string) => Promise<void>
  loadAllTournaments: () => Promise<void>
  loadTournament: (tournamentId: string) => Promise<void>
  startTournament: (tournamentId: string) => Promise<void>
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set, get) => ({
  tournaments: [],
  currentTournament: null,
  isLoading: false,

  // ✅ CREATE TOURNAMENT
  createTournament: async ({ name, entryfee, maxPlayers, organizerId }) => {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/tournaments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          entryfee,
          maxPlayers: String(maxPlayers),
          organizerId,
        }),
      })

      if (!res.ok) throw new Error("Failed to create tournament")

      const data = await res.json()
      const tournament = data.tournament || data

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

  // ✅ JOIN TOURNAMENT
  joinTournament: async (inviteCode: string, userId: string) => {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/tournaments/join/${inviteCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) throw new Error("Failed to join tournament")

      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // ✅ LOAD ALL TOURNAMENTS
  loadAllTournaments: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/tournaments`)
      if (!res.ok) throw new Error("Failed to load tournaments")

      const data = await res.json()
      set({ tournaments: data.tournaments || [], isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // ✅ LOAD SINGLE TOURNAMENT
  loadTournament: async (tournamentId: string) => {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/tournaments/${tournamentId}`)
      if (!res.ok) throw new Error("Failed to load tournament")

      const data = await res.json()
      set({ currentTournament: data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // ✅ START TOURNAMENT
  startTournament: async (tournamentId: string) => {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/tournaments/${tournamentId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to start tournament")

      const data = await res.json()
      console.log(data)

      set((state) => ({
        tournaments: state.tournaments.map((t) =>
          t.id === tournamentId ? { ...t, status: "active" } : t
        ),
        currentTournament:
          state.currentTournament?.id === tournamentId
            ? { ...state.currentTournament, status: "active" }
            : state.currentTournament,
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
})
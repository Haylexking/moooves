import type { StateCreator } from "zustand"
import type { Tournament, CreateTournamentRequest, JoinTournamentRequest } from "@/lib/types"
import { tournamentEndpoints } from "@/lib/api/endpoints"
import { API_CONFIG } from "@/lib/config/api-config"

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
      const url = API_CONFIG.BASE_URL + API_CONFIG.VERSION + tournamentEndpoints.create()
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(request),
      })
      if (!res.ok) throw new Error("Failed to create tournament")
      const tournament = await res.json()
      set((state) => ({
        tournaments: [...state.tournaments, tournament],
        currentTournament: tournament,
        isLoading: false,
      }))

      // Auto-start if enough players already present
      try {
        if (typeof tournament.currentPlayers === "number" && typeof tournament.minPlayers === "number") {
          if (tournament.currentPlayers >= tournament.minPlayers && tournament.status !== "active") {
            // fire and forget start (backend will validate)
            get().startTournament(tournament.id).catch(() => {})
          }
        }
      } catch (err) {
        // ignore auto-start errors
      }
      return tournament
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  joinTournament: async (request: JoinTournamentRequest) => {
    set({ isLoading: true })
    try {
      // Find tournament by inviteCode (if needed, or backend handles it)
      // For now, assume inviteCode is used to get tournamentId
      // If endpoint expects /tournaments/:id/join, you may need to fetch tournamentId first
      // Here, we assume inviteCode is the id or backend accepts it
      const url = API_CONFIG.BASE_URL + API_CONFIG.VERSION + tournamentEndpoints.join(request.inviteCode)
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentMethod: request.paymentMethod }),
      })
      if (!res.ok) throw new Error("Failed to join tournament")
      // If join succeeded, attempt to refresh the tournament and auto-start if threshold met
      try {
        // try to retrieve tournament id from response or assume inviteCode maps to id
        const maybeTournament = await (async () => {
          try {
            return await res.clone().json()
          } catch (e) {
            return null
          }
        })()

        // If response contains tournament id, reload it to get updated counts
        const tournamentId = maybeTournament?.id || request.inviteCode
        if (tournamentId) {
          // load updated tournament
          try {
            await get().loadTournament(tournamentId)
            const current = get().currentTournament
            if (current && typeof current.currentPlayers === "number" && typeof current.minPlayers === "number") {
              if (current.currentPlayers >= current.minPlayers && current.status !== "active") {
                await get().startTournament(current.id)
              }
            }
          } catch (e) {
            // ignore reload/start errors
          }
        }
      } catch (e) {
        // ignore auto-start flow errors
      }
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  loadUserTournaments: async (userId: string) => {
    set({ isLoading: true })
    try {
      const url = API_CONFIG.BASE_URL + API_CONFIG.VERSION + tournamentEndpoints.userTournaments(userId)
      const res = await fetch(url, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch user tournaments")
      const userTournaments = await res.json()
      set({ userTournaments, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  loadTournament: async (tournamentId: string) => {
    set({ isLoading: true })
    try {
      const url = API_CONFIG.BASE_URL + API_CONFIG.VERSION + tournamentEndpoints.getById(tournamentId)
      const res = await fetch(url, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch tournament")
      const tournament = await res.json()
      set({ currentTournament: tournament, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  startTournament: async (tournamentId: string) => {
    set({ isLoading: true })
    try {
      // Assuming PATCH or POST to start tournament (adjust as per backend)
      const url = API_CONFIG.BASE_URL + API_CONFIG.VERSION + tournamentEndpoints.getById(tournamentId)
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "active" }),
      })
      if (!res.ok) throw new Error("Failed to start tournament")
      const updatedTournament = await res.json()
      set((state) => ({
        tournaments: state.tournaments.map((t) =>
          t.id === tournamentId ? updatedTournament : t
        ),
        currentTournament: updatedTournament,
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
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

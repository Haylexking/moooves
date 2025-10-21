import type { StateCreator } from "zustand"
import type { Tournament } from "@/lib/types"
import { API_CONFIG } from "@/lib/config/api-config"
import { apiClient } from "@/lib/api/client"

export interface TournamentSlice {
  tournaments: Tournament[]
  userTournaments?: Tournament[]
  currentTournament: Tournament | null
  isLoading: boolean

  // Actions
  createTournament: (data: {
    name: string
    entryFee?: number
    entryfee?: number
    maxPlayers: number
    organizerId?: string
    startTime?: string
  }) => Promise<Tournament>
  joinTournament: (inviteCode: string, userId: string) => Promise<void>
  loadAllTournaments: () => Promise<void>
  loadTournament: (tournamentId: string) => Promise<void>
  startTournament: (tournamentId: string) => Promise<void>
  loadUserTournaments: (userId: string) => Promise<Tournament[]>
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set, get) => ({
  tournaments: [],
  userTournaments: [],
  currentTournament: null,
  isLoading: false,

  // ✅ CREATE TOURNAMENT
  createTournament: async ({ name, entryFee, entryfee, maxPlayers, organizerId, gameMode, startTime }: any) => {
    set({ isLoading: true })
    try {
      const fee = typeof entryFee !== 'undefined' ? entryFee : entryfee

      const res = await apiClient.createTournament({
        name,
        organizerId,
        maxPlayers,
        entryFee: typeof fee !== 'undefined' ? fee : undefined,
        gameMode: (gameMode as string) || undefined,
        startTime: startTime,
      })

      if (!res.success) throw new Error(res.error || res.message || 'Failed to create tournament')

      const tournament = (res.data && (res.data.tournament || res.data)) || res.data || {}

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
      const res = await apiClient.joinTournamentWithCode(inviteCode, userId)
      if (!res.success) throw new Error(res.error || res.message || 'Failed to join tournament')
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
      const res = await apiClient.getAllTournaments()
      if (!res.success) throw new Error(res.error || res.message || 'Failed to load tournaments')
  const data = res.data || []
  // API may return { tournaments: [...] } or an array directly
  const d: any = data
  const tournaments = Array.isArray(d) ? d : d.tournaments || []
  set({ tournaments, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // ✅ LOAD SINGLE TOURNAMENT
  loadTournament: async (tournamentId: string) => {
    set({ isLoading: true })
    try {
      const res = await apiClient.getTournament(tournamentId)
      if (!res.success) throw new Error(res.error || res.message || 'Failed to load tournament')
      const data = res.data || {}
      set({ currentTournament: data.tournament || data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // ✅ START TOURNAMENT
  startTournament: async (tournamentId: string) => {
    set({ isLoading: true })
    try {
      const res = await apiClient.startTournament(tournamentId)
      if (!res.success) throw new Error(res.error || res.message || 'Failed to start tournament')

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
  // ✅ LOAD USER TOURNAMENTS (by participant or host id)
  loadUserTournaments: async (userId: string) => {
    set({ isLoading: true })
    try {
      const res = await apiClient.getAllTournaments()
      if (!res.success) throw new Error(res.error || res.message || 'Failed to load tournaments')
      const data = res.data || []
      const d: any = data
      const tournaments = Array.isArray(d) ? d : d.tournaments || []

      // Filter tournaments where user is a participant or host
      const userTournaments = tournaments.filter((t: Tournament) => {
        if (!t) return false
        const hostMatch = t.hostId && String(t.hostId) === String(userId)
        const participantMatch = Array.isArray(t.participants) && t.participants.some((p: any) => String(p.userId || p.id) === String(userId))
        return hostMatch || participantMatch
      })

      // Set both the full tournaments list and the derived userTournaments for callers
      set({ tournaments, userTournaments, isLoading: false })
      return userTournaments
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
})
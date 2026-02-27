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
    maxPlayers: number
    organizerId?: string
    startTime?: string
    type?: "free" | "paid"
  }) => Promise<Tournament>
  joinTournament: (inviteCode: string, userId: string) => Promise<void>
  loadAllTournaments: () => Promise<void>
  loadTournament: (tournamentId: string, isBackground?: boolean) => Promise<void>
  startTournament: (tournamentId: string) => Promise<void>
  loadUserTournaments: (userId: string) => Promise<Tournament[]>
  getActiveMatch: (userId: string) => import("@/lib/types").BracketMatch | undefined
}

export const createTournamentSlice: StateCreator<TournamentSlice> = (set, get) => ({
  tournaments: [],
  userTournaments: [],
  currentTournament: null,
  isLoading: false,

  // ✅ CREATE TOURNAMENT
  createTournament: async ({ name, entryFee, maxPlayers, organizerId, startTime, type }: any) => {
    set({ isLoading: true })
    try {
      const res = await apiClient.createTournament({
        name,
        organizerId,
        maxPlayers,
        entryFee,
        startTime,
        type,
      })

      if (!res.success) throw new Error(res.error || res.message || 'Failed to create tournament')

      const data = res.data
      console.log("Create Tournament Response:", res)

      let rawTournament =
        (data && data.tournament) ||
        (data && data.data && data.data.tournament) ||
        (data && data.data) ||
        data ||
        {}

      let tournament = {
        ...rawTournament,
        id: rawTournament._id || rawTournament.id || rawTournament.tournamentId
      }

      // Fallback: If ID is missing, fetch all tournaments and find the most recent one created by this user
      if (!tournament.id) {
        console.warn("Tournament ID missing in response, fetching all tournaments...")
        const allRes = await apiClient.getAllTournaments()
        if (allRes.success) {
          const payload: any = allRes.data || []
          const list = Array.isArray(payload)
            ? payload
            : (Array.isArray(payload.data) ? payload.data : payload.tournaments || [])
          // Sort by creation time descending (assuming newer ones are at the end or have higher createdAt)
          // We filter by organizerId and name to be safe
          const myTournaments = list.filter((t: any) =>
            (t.organizerId === organizerId || t.hostId === organizerId) &&
            t.name === name
          )
          if (myTournaments.length > 0) {
            // Pick the last one (most recent)
            const found = myTournaments[myTournaments.length - 1]
            tournament = { ...found, id: found.id || found._id }
          }
        }
      }

      console.log("Parsed Tournament:", tournament)

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
      const d: any = data
      const tournaments = (Array.isArray(d)
        ? d
        : (Array.isArray(d.data) ? d.data : d.tournaments || [])
      ).map((t: any) => ({ ...t, id: t.id || t._id }))
      set({ tournaments, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // ✅ LOAD SINGLE TOURNAMENT
  loadTournament: async (tournamentId: string, isBackground = false) => {
    if (!isBackground) set({ isLoading: true })
    try {
      const res = await apiClient.getTournament(tournamentId)
      if (!res.success) throw new Error(res.error || res.message || 'Failed to load tournament')
      const data = res.data || {}
      let td = data.tournament || data
      if (td && td._id && !td.id) {
        td.id = td._id
      }
      set({ currentTournament: td, isLoading: false })
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
      console.log("[loadUserTournaments] Raw Response:", res)

      if (!res.success) throw new Error(res.error || res.message || 'Failed to load tournaments')
      const data = res.data || []
      const d: any = data
      const tournaments = (Array.isArray(d)
        ? d
        : (Array.isArray(d.data) ? d.data : d.tournaments || [])
      ).map((t: any) => ({ ...t, id: t.id || t._id }))

      // console.log("[loadUserTournaments] Extracted Tournaments (Count):", tournaments.length)
      // if (tournaments.length > 0) {
      //   console.log("[loadUserTournaments] First Tournament Sample:", tournaments[0])
      //   console.log("[loadUserTournaments] First Tournament Keys:", Object.keys(tournaments[0]))
      // }
      // console.log("[loadUserTournaments] Filtering for User ID:", userId)

      // Filter tournaments where user is a participant or host
      const userTournaments = tournaments.filter((t: Tournament) => {
        if (!t) return false
        // Check for hostId, organizerId, or createdBy
        const hostId = t.hostId || (t as any).organizerId || (t as any).createdBy
        const hostMatch = hostId && String(hostId) === String(userId)
        const participantMatch = Array.isArray(t.participants) && t.participants.some((p: any) => String(p.userId || p.id) === String(userId))

        // console.log(`[loadUserTournaments] Checking T=${t.id}: Host=${hostId} (${hostMatch}), Part=${participantMatch}`)
        return hostMatch || participantMatch
      })

      // console.log("[loadUserTournaments] Filtered Count:", userTournaments.length)

      // Set both the full tournaments list and the derived userTournaments for callers
      set({ tournaments, userTournaments, isLoading: false })
      return userTournaments
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // ✅ GET ACTIVE MATCH FOR USER
  getActiveMatch: (userId: string) => {
    const { currentTournament } = get()
    if (!currentTournament || !currentTournament.bracket) return undefined

    // Search through all rounds and matches
    for (const round of currentTournament.bracket.rounds) {
      if (round.status === "completed") continue

      const match = round.matches.find(
        (m) =>
          (m.player1Id === userId || m.player2Id === userId) &&
          m.status !== "completed"
      )

      if (match) return match
    }

    return undefined
  },
})

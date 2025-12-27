import { API_CONFIG, MATCHROOM_ENDPOINTS } from "@/lib/config/api-config"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface LoginResponse {
  message: string
  data: {
    _id: string
    email: string
    name: string
    createdAt: string
    updatedAt: string
  }
  token: string
}

interface RegisterResponse {
  message: string
  data: {
    _id: string
    fullName: string
    email: string
    password: string
    createdAt: string
    updatedAt: string
  }
  token?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL + API_CONFIG.VERSION
    // Try to get token from localStorage on initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    const attempts = API_CONFIG.RETRY.ATTEMPTS || 1
    const baseDelay = API_CONFIG.RETRY.DELAY || 0

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined
        let timeoutId: any = null
        if (controller && API_CONFIG.TIMEOUT > 0) {
          timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)
        }
        const response = await fetch(url, {
          ...options,
          cache: 'no-store',
          headers,
          signal: controller ? (controller as AbortController).signal : undefined,
        })
        if (timeoutId) clearTimeout(timeoutId)

        let contentType = ""
        try {
          if (response && response.headers && typeof (response.headers as any).get === 'function') {
            contentType = (response.headers as any).get("content-type") || ""
          } else if (response && response.headers) {
            const h: any = response.headers
            contentType = h['content-type'] || h['Content-Type'] || ""
          } else {
            contentType = ""
          }
        } catch (err) {
          contentType = ""
        }

        let parsed: any = null

        if (response && typeof (response as any).json === 'function') {
          try {
            parsed = await (response as any).json()
          } catch (err) {
            try {
              const text = await (response as any).text()
              parsed = { error: `Invalid JSON response`, raw: text }
            } catch (err2) {
              parsed = { error: `Invalid JSON response and no text available` }
            }
          }
        } else {
          try {
            const text = await (response as any).text()
            parsed = { error: `Non-JSON response`, raw: text }
          } catch (err) {
            parsed = { error: `Non-JSON response and no text available` }
          }
        }

        if (!response.ok) {
          const msg = parsed?.message || parsed?.error || parsed?.raw || `HTTP ${response.status}`
          const safeMsg = typeof msg === "string" && msg.trim().startsWith("<") ? `${msg.substring(0, 200)}...` : msg
          const isSessionError =
            response.status === 401 ||
            (typeof safeMsg === 'string' && (
              (safeMsg.toLowerCase().includes('jwt expired') ||
                safeMsg.toLowerCase().includes('session timeout')) &&
              !safeMsg.toLowerCase().includes('invalid role') // Explicitly exclude "Invalid role" from auto-logout
            ))

          if (isSessionError && typeof window !== 'undefined') {
            try {
              const ret = `${window.location.pathname}${window.location.search}${window.location.hash}`
              localStorage.setItem('return_to', ret)
            } catch { }
            this.clearToken()
            try {
              window.location.href = '/onboarding'
            } catch { }
          }
          const retriable = response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504 || (typeof safeMsg === "string" && /timeout/i.test(safeMsg as string))
          if (retriable && attempt < attempts - 1) {
            const delay = baseDelay * Math.pow(2, attempt)
            if (delay > 0) await new Promise(r => setTimeout(r, delay))
            continue
          }
          return {
            success: false,
            error: safeMsg || `HTTP ${response.status}`,
          }
        }

        return {
          success: true,
          data: parsed,
        }
      } catch (error) {
        if (attempt < attempts - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          if (delay > 0) await new Promise(r => setTimeout(r, delay))
          continue
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : "Network error",
        }
      }
    }

    return {
      success: false,
      error: "Network error",
    }
  }

  // Token management
  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  getToken(): string | null {
    return this.token
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(
    fullName: string,
    email: string,
    password: string,
  ): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>("/users", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        email,
        password,
        repeatPassword: password, // API requires repeatPassword field
      }),
    })
  }

  async verifyEmail(code: string): Promise<ApiResponse<any>> {
    return this.request("/verify-email", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
  }

  // Forgot Password (email-only) flow
  async forgotPassword(email: string): Promise<ApiResponse<any>> {
    // Use /forgot per Swagger definition (some backends expose /forgot under /api/v1)
    return this.request("/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  // Reset password. Backwards-compatible: callers may pass (email, password) or
  // a payload object { id, newPassword } per the Swagger spec.
  async resetPassword(
    idOrEmailOrPayload: string | { id?: string; email?: string; newPassword: string },
    password?: string,
  ): Promise<ApiResponse<any>> {
    let body: Record<string, any>

    if (typeof idOrEmailOrPayload === "string") {
      const first = idOrEmailOrPayload
      const looksLikeEmail = first.includes("@")
      if (looksLikeEmail) {
        // legacy callers passing (email, password)
        body = { email: first, newPassword: password }
      } else {
        // treat as id
        body = { id: first, newPassword: password }
      }
    } else {
      // payload object
      body = {
        ...(idOrEmailOrPayload.id ? { id: idOrEmailOrPayload.id } : {}),
        ...(idOrEmailOrPayload.email ? { email: idOrEmailOrPayload.email } : {}),
        newPassword: idOrEmailOrPayload.newPassword,
      }
    }

    return this.request("/forgot/reset", {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  // Google OAuth methods
  getGoogleAuthUrl(): string {
    return `${API_CONFIG.BASE_URL}/auth/google/login`
  }

  getHostGoogleAuthUrl(): string {
    return `${API_CONFIG.BASE_URL}/host/auth/google/login`
  }

  // Host auth methods
  async hostLogin(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>("/hostlogin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async createHost(
    fullName: string,
    email: string,
    password: string,
  ): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>("/host", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        email,
        password,
        repeatPassword: password, // API requires repeatPassword field
      }),
    })
  }

  async getHostById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/host/${id}`)
  }

  // User methods
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request("/users/me")
  }

  async updateUser(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getAllUsers(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/users")
  }

  async getUserById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`)
  }

  // User stats (authenticated)
  async getUserStats(): Promise<ApiResponse<any>> {
    // Backend commonly exposes /api/v1/users/stats
    return this.request(`/users/stats`)
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    })
  }

  async logout(userId: string): Promise<ApiResponse<any>> {
    const response = await this.request("/logout-user", {
      method: "POST",
      body: JSON.stringify({ id: userId }),
    })

    // Clear token on successful logout
    if (response.success) {
      this.clearToken()
    }

    return response
  }

  async requestHostAccess(userId: string): Promise<ApiResponse<any>> {
    return this.request("/request-host-access", {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }

  async grantHostAccess(userId: string): Promise<ApiResponse<any>> {
    // This endpoint uses /auth instead of /api/v1
    const url = `${API_CONFIG.BASE_URL}/auth/grant-host-access`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  // Match Room methods
  async createMatchRoom(userId: string, gameType = "TicTacToe"): Promise<ApiResponse<any>> {
    return this.request(MATCHROOM_ENDPOINTS.CREATE, {
      method: "POST",
      body: JSON.stringify({ userId, gameType }),
    })
  }

  async joinMatchRoom(roomId: string, userId: string, handshakeToken: string): Promise<ApiResponse<any>> {
    return this.request(MATCHROOM_ENDPOINTS.JOIN.replace(':id', roomId), {
      method: "POST",
      body: JSON.stringify({ userId, handshakeToken }),
    })
  }

  // Live 1-on-1 Match Methods
  async createLiveMatch(userId: string): Promise<ApiResponse<any>> {
    return this.request("/match-rooms", {
      method: "POST",
      body: JSON.stringify({ userId, gameType: "p2p" }), // Changed from "1v1" to match GameMode type enum
    })
  }

  async joinMatchByCode(code: string, userId: string): Promise<ApiResponse<any>> {
    return this.request("/match-rooms/join", {
      method: "POST",
      body: JSON.stringify({ matchCode: code, userId }),
    })
  }

  async getAllMatchRooms(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(MATCHROOM_ENDPOINTS.LIST)
  }

  async getMatchRoom(roomId: string): Promise<ApiResponse<any>> {
    return this.request(MATCHROOM_ENDPOINTS.GET_BY_ID.replace(':id', roomId))
  }

  async deleteMatchRoom(roomId: string): Promise<ApiResponse<any>> {
    return this.request(MATCHROOM_ENDPOINTS.DELETE.replace(':id', roomId), {
      method: "DELETE",
    })
  }

  // Game move methods
  async makeGameMove(playerId: string, row: number, col: number, matchId: string): Promise<ApiResponse<any>> {
    return this.request("/move", {
      method: "POST",
      body: JSON.stringify({ playerId, row, col, matchid: matchId }),
    })
  }

  async createOfflineMatch(data: any): Promise<ApiResponse<any>> {
    return this.request("/moves", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async createTournament(payload: { name: string; organizerId: string; startTime: string; maxPlayers?: number; entryFee?: number }): Promise<ApiResponse<any>> {
    // Per Swagger, POST /api/v1/tournaments expects organizerId, name, startTime, optional maxPlayers (<= 50), entryFee
    const body: any = {
      organizerId: payload.organizerId,
      name: payload.name,
      startTime: payload.startTime,
      ...(typeof payload.maxPlayers !== 'undefined' ? { maxPlayers: payload.maxPlayers } : {}),
      ...(typeof payload.entryFee !== 'undefined' ? { entryFee: payload.entryFee } : {}),
    }

    return this.request("/tournaments", {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  private _normalizeTournament(t: any): any {
    if (!t) return t
    return {
      ...t,
      id: t.id || t._id,
      maxPlayers: t.maxPlayers || t.maxParticipants || 50,
      currentPlayers: t.currentPlayers || (t.participants ? t.participants.length : 0) || 0,
      participants: t.participants || [],
      inviteCode: t.inviteCode || t.invite_code,
    }
  }

  async getAllTournaments(): Promise<ApiResponse<any[]>> {
    const res = await this.request<any[]>("/tournaments")
    if (res.success) {
      // Handle wrapped response { tournaments: [...] } or { data: [...] }
      const raw = res.data as any
      const list = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.tournaments) ? raw.tournaments : (Array.isArray(raw?.data) ? raw.data : []))

      res.data = list.map((t: any) => this._normalizeTournament(t))
    }
    return res
  }

  async getTournament(id: string): Promise<ApiResponse<any>> {
    console.log(`[getTournament] Fetching tournament ${id}...`)
    try {
      const res = await this.request(`/tournaments/${id}`)
      if (res.success) {
        return { ...res, data: this._normalizeTournament(res.data) }
      }
    } catch (e) {
      console.warn(`[getTournament] Direct fetch threw for ${id}`, e)
    }

    console.log(`[getTournament] Fallback: Fetching all tournaments...`)
    const res = await this.getAllTournaments()
    // getAllTournaments now returns normalized data
    if (!res.success) return res

    const payload: any = res.data || []
    const list = Array.isArray(payload)
      ? payload
      : (Array.isArray(payload.data) ? payload.data : payload.tournaments || [])

    const match = list.find((t: any) => t.id === id || t._id === id)

    if (match) {
      return { success: true, data: match } // Already normalized by getAllTournaments
    }

    return { success: false, error: "Tournament not found" }
  }

  async findTournamentByInviteCode(inviteCode: string): Promise<ApiResponse<any>> {
    const res = await this.getAllTournaments()
    if (!res.success) return res
    // res.data is already normalized
    const tournaments: any[] = res.data || []

    const match = tournaments.find((t: any) => {
      const code = (t?.inviteCode || "").toString().toLowerCase()
      return code === inviteCode.toLowerCase()
    })
    if (match) {
      return {
        success: true,
        data: match,
      }
    }
    return {
      success: false,
      error: "Tournament with this invite code was not found",
    }
  }

  async deleteTournament(id: string): Promise<ApiResponse<any>> {
    return this.request(`/tournaments/${id}`, {
      method: "DELETE",
    })
  }

  async joinTournamentWithCode(inviteCode: string, userId: string): Promise<ApiResponse<any>> {
    return this.request(`/tournaments/join/${inviteCode}`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }

  async getTournamentInviteLink(tournamentId: string): Promise<ApiResponse<any>> {
    return this.request(`/tournaments/${tournamentId}/invite`)
  }

  async startTournament(id: string, force?: boolean): Promise<ApiResponse<any>> {
    const qs = force ? "?force=true" : ""
    return this.request(`/tournaments/${id}/start${qs}`, {
      method: "POST",
    })
  }

  async rescheduleTournament(id: string, newStartTime: string): Promise<ApiResponse<any>> {
    return this.request(`/${id}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify({ newStartTime }),
    })
  }

  async getTournamentWinners(tournamentId: string): Promise<ApiResponse<any>> {
    return this.request(`/tournaments/${tournamentId}/winners`)
  }

  // Payment / Payout methods
  async distributePayouts(
    tournamentId: string,
    winners: { first: string; second?: string; third?: string }
  ): Promise<ApiResponse<any>> {
    // The backend exposes /distribute/{tournamentId} which calculates and transfers payouts
    return this.request(`/distribute/${tournamentId}`, {
      method: "POST",
      body: JSON.stringify({ winners }),
    })
  }

  async sendManualPayout(
    accountBank: string,
    accountNumber: string,
    amount: number,
    narration?: string,
  ): Promise<ApiResponse<any>> {
    return this.request(`/send`, {
      method: "POST",
      body: JSON.stringify({ accountBank, accountNumber, amount, narration }),
    })
  }

  // Match/Game methods
  async joinMatch(matchId: string): Promise<ApiResponse<any>> {
    // POST /api/v1/matches/{matchId}/join per Swagger
    return this.request(`/matches/${matchId}/join`, {
      method: "POST",
    })
  }
  async getAllMatches(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/matches")
  }

  async getMatch(matchId: string): Promise<ApiResponse<any>> {
    return this.request(`/matches/${matchId}`)
  }

  async deleteMatch(matchId: string): Promise<ApiResponse<any>> {
    return this.request(`/matches/${matchId}`, {
      method: "DELETE",
    })
  }

  async submitMatchResult(matchId: string, winnerId: string): Promise<ApiResponse<any>> {
    return this.request(`/${matchId}/submit-result`, {
      method: "POST",
      body: JSON.stringify({ winnerId }),
    })
  }

  async submitOfflineMatchResult(matchId: string, winnerId: string, handshakeToken: string): Promise<ApiResponse<any>> {
    return this.request(`/${matchId}/submit-resultoffline`, {
      method: "POST",
      body: JSON.stringify({ winnerId, handshakeToken }),
    })
  }

  async requestRematch(matchId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request(`/matches/${matchId}/rematch`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }

  async declineRematch(matchId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request(`/matches/${matchId}/decline`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }

  // OTP / Verification
  async verifyAccountOtp(email: string, otp: string): Promise<ApiResponse<any>> {
    // Swagger: POST /api/v1/verify with { email, otp }
    return this.request("/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    })
  }

  async getTournaments(): Promise<ApiResponse<any>> {
    return this.getAllTournaments()
  }

  async joinTournament(id: string): Promise<ApiResponse<any>> {
    // This method needs userId parameter, so it's deprecated in favor of joinTournamentWithCode
    throw new Error("Use joinTournamentWithCode instead")
  }

  async getGames(): Promise<ApiResponse<any>> {
    return this.getAllMatches()
  }

  async createGame(data: any): Promise<ApiResponse<any>> {
    // Games are created through match rooms or tournaments
    throw new Error("Use createMatchRoom or createTournament instead")
  }

  async makeMove(gameId: string, move: any): Promise<ApiResponse<any>> {
    // Use makeGameMove instead
    throw new Error("Use makeGameMove instead")
  }

  async initWalletTransaction(payload: { amount: number; method: string; email?: string; name?: string; userId?: string; redirectUrl?: string; tournamentId?: string }): Promise<ApiResponse<any>> {
    // Swagger: POST /api/v1/initial — returns { message, payment_link }
    const body = {
      amount: payload.amount,
      method: payload.method,
      email: payload.email,
      name: payload.name,
      userId: payload.userId,
      redirectUrl: payload.redirectUrl,
      ...(payload.tournamentId ? { tournamentId: payload.tournamentId } : {}),
    }
    console.log(`[initWalletTransaction] Sending payload to /initial:`, body)
    return this.request(`/initial`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async verifyWalletTransaction(payload: { transactionId: string }): Promise<ApiResponse<any>> {
    // Swagger: GET /api/v1/verify?transaction_id=...
    const qs = `?transaction_id=${encodeURIComponent(payload.transactionId)}`
    return this.request(`/verify${qs}`)
  }

  // Bank methods
  async listBanks(): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.BANK.BANKS)
  }

  async findBankByName(name: string): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.BANK.BANKS_FIND, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async verifyBankAccount(payload: { accountNumber: string; bankCode: string }): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.BANK.VERIFY, {
      method: "POST",
      body: JSON.stringify({
        account_number: payload.accountNumber,
        bank_code: payload.bankCode,
      }),
    })
  }

  async addBank(payload: { accountNumber: string; bankCode: string; role?: string; userId?: string; accountName?: string }): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.BANK.ADD, {
      method: 'POST',
      body: JSON.stringify({
        accountNumber: payload.accountNumber,
        bankCode: payload.bankCode,
        role: payload.role,
        userId: payload.userId,
      }),
    })
  }

  async removeBank(payload: { userId: string; role: "host" | "user" }): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.BANK.REMOVE, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async getSavedBanks(userId: string, role: string): Promise<ApiResponse<any>> {
    // Prefer Swagger's /api/v1/all and filter client-side for this user
    try {
      const all = await this.request(API_CONFIG.ENDPOINTS.BANK.SAVED_ALL)
      if (all.success) {
        const payload: any = all.data || {}
        const items: any[] = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : [])
        const filtered = items
          .filter((b: any) => {
            const bUserId = b._id || b.id || b.userId || b.user_id
            return String(bUserId) === String(userId)
          })
          .map((u: any) => {
            // Extract bank account from user object
            const bank = u.bankAccount || {}
            return {
              id: u._id,
              accountNumber: bank.accountNumber,
              bankCode: bank.bankCode,
              accountName: bank.accountName,
              bankName: bank.bankName, // Might not be present, but that's okay
              userId: u._id,
              role: u.role
            }
          })
          .filter((b: any) => b.accountNumber) // Only return if account number exists

        return { success: true, data: filtered }
      }
    } catch { }

    const roleParam = role === 'player' ? 'user' : role
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.VERSION}/${roleParam}/${userId}`
    try {
      const r = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) } })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return { success: false, error: data?.message || data?.error || `HTTP ${r.status}` }
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error' }
    }
  }

  async deleteSavedBank(beneficiaryId: string): Promise<ApiResponse<any>> {
    const p = API_CONFIG.ENDPOINTS.BANK.DELETE.replace(':beneficiaryId', beneficiaryId)
    return this.request(p, { method: 'DELETE' })
  }

  // Optional backend WebRTC signaling
  async postOffer(roomId: string, sdp: any): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.SIGNALING.OFFER, { method: 'POST', body: JSON.stringify({ roomId, sdp }) })
  }
  async getOffer(roomId: string): Promise<ApiResponse<any>> {
    return this.request(`${API_CONFIG.ENDPOINTS.SIGNALING.OFFER}?roomId=${encodeURIComponent(roomId)}`)
  }
  async postAnswer(roomId: string, sdp: any): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.SIGNALING.ANSWER, { method: 'POST', body: JSON.stringify({ roomId, sdp }) })
  }
  async getAnswer(roomId: string): Promise<ApiResponse<any>> {
    return this.request(`${API_CONFIG.ENDPOINTS.SIGNALING.ANSWER}?roomId=${encodeURIComponent(roomId)}`)
  }
  async postIce(roomId: string, candidate: any, from?: 'host' | 'guest'): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.SIGNALING.ICE, { method: 'POST', body: JSON.stringify({ roomId, candidate, from }) })
  }
  async getIce(roomId: string, after?: number): Promise<ApiResponse<any>> {
    const qs = after ? `&after=${after}` : ''
    return this.request(`${API_CONFIG.ENDPOINTS.SIGNALING.ICE}?roomId=${encodeURIComponent(roomId)}${qs}`)
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()

// Also export the Fetcher for OpenAPI if needed
import { Fetcher } from "openapi-typescript-fetch"
import type { paths } from "../types/api"

export const api = Fetcher.for<paths>()
api.configure({ baseUrl: API_CONFIG.BASE_URL })

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

    // Defensive: if token isn't set on this ApiClient instance but a token exists
    // in localStorage (rehydration race or different initialization order), read
    // it so requests include the up-to-date token.
    try {
      if (!this.token && typeof window !== "undefined") {
        const stored = localStorage.getItem("auth_token")
        if (stored) {
          this.token = stored
          headers["Authorization"] = `Bearer ${this.token}`
        }
      }
    } catch (e) {
      // ignore localStorage access errors
    }

    // Debug: log request metadata and whether an Authorization header is present.
    // We intentionally log only a short snippet of the token (not the full token)
    // to avoid leaking secrets in logs.
    try {
      if (typeof window !== "undefined") {
        const authSnippet = headers["Authorization"] ? String(headers["Authorization"]).slice(0, 20) + '...' : null
        // eslint-disable-next-line no-console
        console.debug('[ApiClient] Request', { endpoint, method: (options.method || 'GET'), authorizationSnippet: authSnippet })
      }
    } catch (e) {
      // noop
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })
      // Check content type and try to parse JSON when possible. If the server returns HTML
      // (for example an error page), avoid throwing a JSON parsing error and return a
      // readable error string instead.
      // response.headers may be missing or not implement .get in test mocks
      let contentType = ""
      try {
        if (response && response.headers && typeof (response.headers as any).get === 'function') {
          contentType = (response.headers as any).get("content-type") || ""
        } else if (response && response.headers) {
          // Some test mocks set headers as a plain object; tolerate that shape
          const h: any = response.headers
          contentType = h['content-type'] || h['Content-Type'] || ""
        } else {
          contentType = ""
        }
      } catch (err) {
        contentType = ""
      }

      let parsed: any = null

      // Prefer JSON parsing when response.json exists (mocks often omit headers)
      if (response && typeof (response as any).json === 'function') {
        try {
          parsed = await (response as any).json()
        } catch (err) {
          // If JSON parsing fails, try text as a fallback
          try {
            const text = await (response as any).text()
            parsed = { error: `Invalid JSON response`, raw: text }
          } catch (err2) {
            parsed = { error: `Invalid JSON response and no text available` }
          }
        }
      } else {
        // Non-JSON response (HTML or plain text). Capture text for diagnostics if available.
        try {
          const text = await (response as any).text()
          parsed = { error: `Non-JSON response`, raw: text }
        } catch (err) {
          parsed = { error: `Non-JSON response and no text available` }
        }
      }

      if (!response.ok) {
        // If the server responded with 401 Unauthorized, clear stored token
        // to avoid reusing an invalid/expired token on subsequent requests.
        try {
          if ((response as any).status === 401) {
            this.clearToken()
          }
        } catch (e) {
          // ignore
        }
        // Prefer structured error message from parsed body, otherwise include raw text snippet
        const msg = parsed?.message || parsed?.error || parsed?.raw || `HTTP ${response.status}`
        // If the parsed raw content looks like HTML, give a concise message
        const safeMsg = typeof msg === "string" && msg.trim().startsWith("<") ? `${msg.substring(0, 200)}...` : msg
        return {
          success: false,
          error: safeMsg || `HTTP ${response.status}`,
        }
      }

      // Success: return parsed JSON if available, otherwise return raw text under data
      return {
        success: true,
        data: parsed,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
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
    phone?: string,
  ): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>("/users", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        email,
        password,
        repeatPassword: password, // API requires repeatPassword field
        phone,
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

  // User methods
  async getCurrentUser(): Promise<ApiResponse<any>> {
    // Prefer decoding the JWT and fetching the user by id using the Swagger-documented
    // GET /users/{id} endpoint. This mirrors the host flow and avoids relying on a
    // non-existent /users/me endpoint on some backend versions.
    let token: string | null = this.token
    try {
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("auth_token")
      }
    } catch (e) {
      // ignore
    }

    if (token) {
      try {
        const parts = token.split('.')
        if (parts.length >= 2) {
          const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          const pad = payloadB64.length % 4
          const padded = pad === 0 ? payloadB64 : payloadB64 + '='.repeat(4 - pad)
          const json = JSON.parse(typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf8'))
          const candidateId = json?.userId || json?.id || json?._id || json?.sub
          if (candidateId) {
            const res = await this.request(`/users/${candidateId}`)
            if (res.success) return res
            return { success: false, error: `Failed to fetch user by id (${candidateId}): ${res.error || 'unknown'}` }
          }
        }
      } catch (err) {
        // decoding failed - fall through to legacy probing
      }
    }

    // Legacy fallback: try common /users/me path
    try {
      const res = await this.request('/users/me')
      return res
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  // Host identity endpoint (hosts are stored separately from users)
  async getCurrentHost(): Promise<ApiResponse<any>> {
    // First attempt: if we have a JWT, decode it and try to resolve the host by ID
    // using the Swagger-documented endpoint: GET /api/v1/host/{id}.
    // This is more reliable than probing for a /host(s)/me endpoint because
    // the Swagger exposes GET /host/{id} and createHost may not return a token.
    let token: string | null = this.token
    try {
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("auth_token")
      }
    } catch (e) {
      // ignore localStorage errors
    }

    if (token) {
      try {
        const parts = token.split('.')
        if (parts.length >= 2) {
          // base64 decode the payload portion (URL-safe base64)
          const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          // Add padding if necessary
          const pad = payloadB64.length % 4
          const padded = pad === 0 ? payloadB64 : payloadB64 + '='.repeat(4 - pad)
          // atob exists in browsers; wrap in try/catch for safety
          const json = JSON.parse(typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf8'))

          // Try a list of common claim names that might contain the host id
          const candidateId = json?.hostId || json?.userId || json?.id || json?._id || json?.sub
          if (candidateId) {
            const res = await this.request(`/host/${candidateId}`)
            if (res.success) return res
            // If fetching by id failed, return the error from the attempt so callers get immediate feedback
            return {
              success: false,
              error: `Failed to fetch host by id (${candidateId}): ${res.error || 'unknown'}`,
            }
          }
        }
      } catch (err) {
        // decoding failed, fall through to the legacy probing behavior below
      }
    }

    // Legacy fallback: try multiple possible host identity endpoints used by different backend versions.
    const candidates = ["/hosts/me", "/host/me"]
    let lastErr: ApiResponse<any> | null = null
    for (const ep of candidates) {
      try {
        const res = await this.request(ep)
        if (res.success) return res
        lastErr = res
        // continue to next candidate on non-success (e.g., 404)
      } catch (e) {
        // ignore and try next
        lastErr = { success: false, error: (e instanceof Error ? e.message : String(e)) }
      }
    }

    // If none succeeded, return a helpful error indicating which endpoints were tried.
    return {
      success: false,
      error: `Host identity not resolvable. Tried: decode->/host/{id} and endpoints: ${candidates.join(', ')}. Last error: ${lastErr ? lastErr.error : 'unknown'}`,
    }
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

  // Tournament methods
  async createTournament(payload: { name: string; organizerId?: string; maxPlayers?: number | string; entryFee?: number; gameMode?: string }): Promise<ApiResponse<any>> {
    // The backend Swagger expects `createdBy` (required) and `entryfee` (lowercase).
    // Keep `organizerId` for backwards compatibility, but include `createdBy` when organizerId is provided.
    const body: any = {
      name: payload.name,
      ...(payload.organizerId ? { organizerId: payload.organizerId, createdBy: payload.organizerId } : {}),
      ...(payload.maxPlayers ? { maxPlayers: String(payload.maxPlayers) } : {}),
      ...(typeof payload.entryFee !== 'undefined' ? { entryfee: payload.entryFee } : {}),
      ...(payload.gameMode ? { gameMode: payload.gameMode } : {}),
    }

    return this.request("/tournaments", {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async getAllTournaments(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/tournaments")
  }

  async getTournament(id: string): Promise<ApiResponse<any>> {
    return this.request(`/tournaments/${id}`)
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

  async startTournament(id: string): Promise<ApiResponse<any>> {
    return this.request(`/tournaments/${id}/start`, {
      method: "POST",
    })
  }

  async getTournamentWinners(tournamentId: string): Promise<ApiResponse<any>> {
    return this.request(`/tournaments/${tournamentId}/winners`)
  }

  // Payment / Payout methods
  async verifyTournamentPayouts(tournamentId: string): Promise<ApiResponse<any>> {
    // The backend exposes /distribute/{tournamentId} which returns payouts summary and status
    return this.request(`/distribute/${tournamentId}`, {
      method: "POST",
      body: JSON.stringify({}),
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
}

// Create and export a singleton instance
export const apiClient = new ApiClient()

// Also export the Fetcher for OpenAPI if needed
import { Fetcher } from "openapi-typescript-fetch"
import type { paths } from "../types/api"

export const api = Fetcher.for<paths>()
api.configure({ baseUrl: API_CONFIG.BASE_URL })

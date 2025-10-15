import { API_CONFIG } from "@/lib/config/api-config"

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

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })
      // Check content type and try to parse JSON when possible. If the server returns HTML
      // (for example an error page), avoid throwing a JSON parsing error and return a
      // readable error string instead.
      const contentType = response.headers.get("content-type") || ""
      let parsed: any = null

      if (contentType.includes("application/json") || contentType.includes("application/ld+json")) {
        try {
          parsed = await response.json()
        } catch (err) {
          // If parsing fails, fall back to text to capture the server response
          const text = await response.text()
          parsed = { error: `Invalid JSON response`, raw: text }
        }
      } else {
        // Non-JSON response (HTML or plain text). Capture text for diagnostics.
        const text = await response.text()
        parsed = { error: `Non-JSON response`, raw: text }
      }

      if (!response.ok) {
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
    phone?: string,
  ): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>("/host", {
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
    return this.request("/match", {
      method: "POST",
      body: JSON.stringify({ userId, gameType }),
    })
  }

  async joinMatchRoom(roomId: string, userId: string, handshakeToken: string): Promise<ApiResponse<any>> {
    return this.request(`/match/${roomId}`, {
      method: "POST",
      body: JSON.stringify({ userId, handshakeToken }),
    })
  }

  async getAllMatchRooms(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/matchs")
  }

  async getMatchRoom(roomId: string): Promise<ApiResponse<any>> {
    return this.request(`/matchs/${roomId}`)
  }

  async deleteMatchRoom(roomId: string): Promise<ApiResponse<any>> {
    return this.request(`/matchs/${roomId}`, {
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
  async createTournament(name: string, organizerId: string, maxPlayers?: string): Promise<ApiResponse<any>> {
    return this.request("/tournaments", {
      method: "POST",
      body: JSON.stringify({ name, organizerId, maxPlayers }),
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

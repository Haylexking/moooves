import { API_CONFIG } from "@/lib/config/api-config"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    fullName: string
    phone?: string
    emailVerified: boolean
  }
}

interface RegisterResponse {
  token: string
  user: {
    id: string
    email: string
    fullName: string
    phone?: string
    emailVerified: boolean
  }
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

  // Google OAuth methods
  getGoogleAuthUrl(): string {
    return `${this.baseUrl}/google-authenticate`
  }

  getHostGoogleAuthUrl(): string {
    return `${this.baseUrl}/host-google-authenticate`
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
      body: JSON.stringify({ fullName, email, password, phone }),
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

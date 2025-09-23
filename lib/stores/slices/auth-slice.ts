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

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    // Add authorization header if token exists
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: API_CONFIG.TIMEOUT,
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

  // Tournament methods (placeholder for future implementation)
  async getTournaments(): Promise<ApiResponse<any>> {
    return this.request("/tournaments")
  }

  async createTournament(data: any): Promise<ApiResponse<any>> {
    return this.request("/tournaments", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async joinTournament(id: string): Promise<ApiResponse<any>> {
    return this.request(`/tournaments/${id}/join`, {
      method: "POST",
    })
  }

  // Game methods (placeholder for future implementation)
  async getGames(): Promise<ApiResponse<any>> {
    return this.request("/games")
  }

  async createGame(data: any): Promise<ApiResponse<any>> {
    return this.request("/games", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async makeMove(gameId: string, move: any): Promise<ApiResponse<any>> {
    return this.request(`/games/${gameId}/moves`, {
      method: "POST",
      body: JSON.stringify(move),
    })
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()

// Also export the Fetcher for OpenAPI if needed
import { Fetcher } from "openapi-typescript-fetch"
import type { paths } from "../types/api"

export const api = Fetcher.for<paths>()
api.configure({ baseUrl: API_CONFIG.BASE_URL })

"use client"

import { API_CONFIG } from "@/lib/config/api-config"
import { tournamentEndpoints, gameEndpoints, paymentEndpoints } from "./endpoints"

// Update the API Configuration
const API_BASE_URL = API_CONFIG.BASE_URL

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL + API_CONFIG.VERSION
    // Get token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      console.log("Making API request to:", url)
      console.log("Request options:", { ...options, headers })

      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      // Check if response is HTML (error page)
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        const htmlText = await response.text()
        console.error("Received HTML instead of JSON:", htmlText.substring(0, 200))
        return {
          success: false,
          error: `Server returned HTML instead of JSON. Status: ${response.status}. Check if backend is running.`,
        }
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        return {
          success: false,
          error: "Invalid JSON response from server",
        }
      }

      console.log("Response data:", data)

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
      console.error("Network error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  // Auth endpoints - using your actual backend structure
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(fullName: string, email: string, password: string, phone?: string) {
    // Create user payload - adjust based on your backend schema
    const payload = {
      fullName,
      email,
      password,
      repeatPassword: password, // If your backend expects this
      ...(phone && { phone }), // Only include phone if provided
    }

    console.log("Registration payload:", payload)

    return this.request<{ token: string; user: any }>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async verifyEmail(code: string) {
    return this.request<{ verified: boolean }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
  }

  // User management endpoints
  async getUsers() {
    return this.request<any[]>("/users")
  }

  async getUser(id: string) {
    return this.request<any>(`/users/${id}`)
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string) {
    return this.request<any>(`/users/${id}`, {
      method: "DELETE",
    })
  }

  // Tournament endpoints (placeholders - adjust when you provide tournament endpoints)
  async createTournament(data: {
    name: string
    entryFee: number
    maxPlayers: number
    gameMode: string
  }) {
    return this.request<any>(tournamentEndpoints.create(), {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getTournaments() {
    return this.request<any[]>(tournamentEndpoints.list())
  }

  async getTournament(id: string) {
    return this.request<any>(tournamentEndpoints.getById(id))
  }

  async joinTournament(tournamentId: string, inviteCode: string) {
    return this.request<any>(tournamentEndpoints.join(tournamentId), {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    })
  }

  async getTournamentByInvite(code: string) {
    return this.request<any>(tournamentEndpoints.getByInvite(code))
  }

  // Game endpoints (placeholders)
  async createGame(tournamentId: string, player1Id: string, player2Id: string) {
    return this.request<any>(gameEndpoints.create(), {
      method: "POST",
      body: JSON.stringify({ tournamentId, player1Id, player2Id }),
    })
  }

  async makeMove(
    gameId: string,
    move: {
      player: string
      position: [number, number]
      timestamp: number
    },
  ) {
    return this.request<any>(gameEndpoints.makeMove(gameId), {
      method: "POST",
      body: JSON.stringify(move),
    })
  }

  // Payment endpoints (placeholders)
  async initiatePayment(data: {
    tournamentId: string
    amount: number
    method: string
  }) {
    return this.request<{ paymentUrl: string; reference: string }>(paymentEndpoints.initiate(), {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async verifyPayment(reference: string) {
    return this.request<{ status: string }>(paymentEndpoints.verify(reference))
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

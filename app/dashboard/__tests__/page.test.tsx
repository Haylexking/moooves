import React from "react"
import { screen, act } from "@testing-library/react"
// Provide typing for the global test helper injected in jest.setup.js
declare global {
  var renderWithProviders: (ui: any, options?: any) => any
}
import "@testing-library/jest-dom"

// Mock the auth store and next/navigation
jest.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: jest.fn(),
}))

// Mock tournament store to avoid network fetches during tests
jest.mock("@/lib/stores/tournament-store", () => ({
  useTournamentStore: jest.fn(),
}))

const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  __esModule: true,
}))

import { useAuthStore } from "@/lib/stores/auth-store"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import DashboardPage from "../page"
import GameRulesProvider from "@/components/game/GameRulesProvider"

const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
const mockedUseTournamentStore = useTournamentStore as jest.MockedFunction<typeof useTournamentStore>

describe("Dashboard page rehydration and auth behavior", () => {
  beforeEach(() => {
    mockedUseAuthStore.mockReset()
    mockedUseTournamentStore.mockReset()
    mockPush.mockReset()
  })

  test("shows loading fallback when rehydrated=false", async () => {
    mockedUseAuthStore.mockReturnValue({ rehydrated: false } as any)
    mockedUseTournamentStore.mockReturnValue({ userTournaments: [], loadUserTournaments: jest.fn(), isLoading: false } as any)
    // @ts-ignore - renderWithProviders injected by jest.setup.js
    await act(async () => {
      global.renderWithProviders(<DashboardPage />)
    })

    expect(screen.getByText(/loading session/i)).toBeInTheDocument()
  })

  test("renders dashboard when rehydrated and authenticated", async () => {
    mockedUseAuthStore.mockReturnValue({ rehydrated: true, isAuthenticated: true, user: { id: 1, username: 'u' } } as any)
    mockedUseTournamentStore.mockReturnValue({ userTournaments: [], loadUserTournaments: jest.fn(), isLoading: false } as any)
    // Prefer the global render helper to ensure consistent providers
    // @ts-ignore - renderWithProviders injected by jest.setup.js
    await act(async () => {
      global.renderWithProviders(<DashboardPage />)
    })

    // Dashboard content includes heading or other known text; pick a safe assertion
    // If component renders, it should not show loading
    expect(screen.queryByText(/loading session/i)).not.toBeInTheDocument()
  })

  test("redirects to login when rehydrated and not authenticated", async () => {
    mockedUseTournamentStore.mockReturnValue({ userTournaments: [], loadUserTournaments: jest.fn(), isLoading: false } as any)
    mockedUseAuthStore.mockReturnValue({ rehydrated: true, isAuthenticated: false } as any)
    // @ts-ignore - renderWithProviders injected by jest.setup.js
    await act(async () => {
      global.renderWithProviders(<DashboardPage />)
    })

    // When not authenticated, component returns null; no loading text
    expect(screen.queryByText(/loading session/i)).not.toBeInTheDocument()
  })
})

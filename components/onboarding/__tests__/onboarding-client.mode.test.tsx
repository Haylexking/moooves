import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

// Mock the auth store
jest.mock("@/lib/stores/auth-store", () => {
  return {
    useAuthStore: jest.fn(),
  }
})

// Mock next/navigation router used by the component and expose the push mock
const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  __esModule: true,
}))

import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"

// Increase timeout for these async interaction-heavy tests
jest.setTimeout(10000)

// Test helpers
const getSubmitButtonByTestId = (id: string) => screen.getByTestId(id)
import OnboardingClient from "../onboarding-client"

describe("OnboardingClient mode switch", () => {
  const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

  beforeEach(() => {
    mockedUseAuthStore.mockReset()
    // reset router push mock
    ;(useRouter() as any).push.mockReset?.()
  })

  // Helper to return a base auth store mock with rehydrated control
  const baseAuthMock = (overrides = {}) => ({
    isLoading: false,
    error: null,
    clearError: jest.fn(),
    rehydrated: true,
    isAuthenticated: true,
    ...overrides,
  } as any)

  test("calls hostRegister when registering in host mode and hostLogin when logging in", async () => {
    const hostRegister = jest.fn().mockResolvedValue(undefined)
    const hostLogin = jest.fn().mockResolvedValue(undefined)

    // Return object with needed methods and rehydrated=true
    mockedUseAuthStore.mockReturnValue(
      baseAuthMock({ hostRegister, hostLogin, rehydrated: true, isAuthenticated: true })
    )

  render(<OnboardingClient mode="host" />)
    const user = userEvent.setup()

    // Fill register fields (username, email, password)
    const username = screen.getByPlaceholderText(/username/i)
    const email = screen.getByPlaceholderText(/email/i)
    const password = screen.getByPlaceholderText(/enter your password/i)
    const confirm = screen.getByPlaceholderText(/confirm your password/i)
    await act(async () => {
      await user.type(username, "Hosty")
      await user.type(email, "host@example.com")
      await user.type(password, "Abc123!@#")
      await user.type(confirm, "Abc123!@#")
    })

    // Submit register - use data-testid
    const registerBtn = getSubmitButtonByTestId("onboarding-register-submit")
    await act(async () => {
      await user.click(registerBtn)
    })
    await waitFor(() => expect(hostRegister).toHaveBeenCalled())
    // navigation should have been triggered to /dashboard
    expect(useRouter().push).toHaveBeenCalledWith("/dashboard")

    // Now click login tab and submit login
    const loginTab = screen.getByRole("button", { name: /login/i })
    await act(async () => {
      await user.click(loginTab)
    })
      const loginEmail = await screen.findByPlaceholderText(/enter your email/i)
      const loginPassword = await screen.findByPlaceholderText(/enter your password/i)
      await act(async () => {
        await user.type(loginEmail, "host@example.com")
        await user.type(loginPassword, "Abc123!@#")
      })
    // The page has multiple "Login" buttons (tab + submit). Find the submit button by filtering for type="submit"
    const loginBtn = getSubmitButtonByTestId("onboarding-login-submit")
    await act(async () => {
      await user.click(loginBtn)
    })
    await waitFor(() => expect(hostLogin).toHaveBeenCalled())
    await waitFor(() => expect(useRouter().push).toHaveBeenCalledWith("/dashboard"))
  })

  test("calls register and login for player mode", async () => {
    const register = jest.fn().mockResolvedValue(undefined)
    const login = jest.fn().mockResolvedValue(undefined)

    mockedUseAuthStore.mockReturnValue(baseAuthMock({ register, login, rehydrated: true, isAuthenticated: true }))

    render(<OnboardingClient mode="player" />)
    const user = userEvent.setup()

    const username = screen.getByPlaceholderText(/username/i)
    const email = screen.getByPlaceholderText(/email/i)
    const password = screen.getByPlaceholderText(/enter your password/i)
    const confirm = screen.getByPlaceholderText(/confirm your password/i)
    await act(async () => {
      await user.type(username, "PlayerOne")
      await user.type(email, "player@example.com")
      await user.type(password, "Abc123!@#")
      await user.type(confirm, "Abc123!@#")
    })

    // Submit register - use data-testid
    const registerBtn = getSubmitButtonByTestId("onboarding-register-submit")
    await act(async () => {
      await user.click(registerBtn)
    })
    await waitFor(() => expect(register).toHaveBeenCalled())
    expect(useRouter().push).toHaveBeenCalledWith("/dashboard")

  const loginTab = screen.getByRole("button", { name: /login/i })
  await act(async () => {
    await user.click(loginTab)
  })
    const loginEmail = await screen.findByPlaceholderText(/enter your email/i)
    const loginPassword = await screen.findByPlaceholderText(/enter your password/i)
    await act(async () => {
      await user.type(loginEmail, "player@example.com")
      await user.type(loginPassword, "Abc123!@#")
    })
  const loginBtn = getSubmitButtonByTestId("onboarding-login-submit")
  await act(async () => {
    await user.click(loginBtn)
  })
  await waitFor(() => expect(login).toHaveBeenCalled())
  await waitFor(() => expect(useRouter().push).toHaveBeenCalledWith("/dashboard"))
  })
})


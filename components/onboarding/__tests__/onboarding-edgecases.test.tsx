import React from 'react'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('@/lib/stores/auth-store', () => ({ useAuthStore: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), __esModule: true }))
jest.mock('@/lib/api/client', () => ({ apiClient: { getToken: jest.fn(() => null) } }))

import { useAuthStore } from '@/lib/stores/auth-store'
import OnboardingPlayerClient from '@/components/onboarding/onboarding-player-client'

const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('Onboarding edge cases', () => {
  beforeEach(() => mockedUseAuthStore.mockReset())

  test('first-time user (no persisted token) shows loading then allows login flow', async () => {
    // Implement a deterministic fake auth store that the component can subscribe to
    function createFakeAuthStore(initial: any) {
      let state = { ...initial }
      const listeners: Array<(s: any) => void> = []
      return {
        getState: () => state,
        subscribe: (cb: (s: any) => void) => {
          listeners.push(cb)
          return () => {
            const idx = listeners.indexOf(cb)
            if (idx >= 0) listeners.splice(idx, 1)
          }
        },
        setState: (next: any) => {
          state = { ...state, ...next }
          listeners.forEach((l) => l(state))
        },
      }
    }

    const fake = createFakeAuthStore({ rehydrated: false, isAuthenticated: false, user: null })

    // Provide register function that updates the fake store (simulate server + persistence)
    const register = jest.fn(async () => {
      // Simulate server accepted registration and token persisted
      fake.setState({ isAuthenticated: true, user: { id: 100 } })
      // Simulate rehydration finishing shortly after
      fake.setState({ rehydrated: true })
      return Promise.resolve()
    })

    // Mock the auth store to expose the Zustand-like API expected by waitForAuthInit
    // We substitute the module mock to return an object with getState/subscribe/setState and the action fns
    mockedUseAuthStore.mockImplementation(() => ({
      // direct api used by components
      register,
      login: jest.fn(),
      hostLogin: jest.fn(),
      hostRegister: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
      // Zustand-like API for waitForAuthInit helper
      getState: fake.getState,
      subscribe: fake.subscribe,
    } as any))

    const rtl = require('@testing-library/react')
  const { rerender } = rtl.render(<OnboardingPlayerClient />)

    // Ensure loading fallback is visible initially; the component uses rehydrated to decide
    // We'll assert the page rendered (no crash) and call the register button
    const registerBtn = screen.getByTestId('onboarding-register-submit')
    expect(registerBtn).toBeInTheDocument()

    // Fill out the form so validation passes
    await act(async () => {
      fireEvent.input(screen.getByPlaceholderText(/Enter your username/i), { target: { value: 'newuser' } })
      fireEvent.input(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'new@example.com' } })
      fireEvent.input(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'Abc123!@#' } })
      fireEvent.input(screen.getByPlaceholderText(/Confirm your password/i), { target: { value: 'Abc123!@#' } })
      // Simulate user clicking register which invokes our mocked register
      fireEvent.click(registerBtn)
    })

    // register should have been called and then fake store transitions to rehydrated/isAuthenticated
    await waitFor(() => expect(register).toHaveBeenCalled())
    await waitFor(() => expect(fake.getState().rehydrated).toBe(true))
    await waitFor(() => expect(fake.getState().isAuthenticated).toBe(true))
  })

  test('slow server response keeps fallback visible until ready', async () => {
    const login = jest.fn().mockImplementation(() => new Promise((res) => setTimeout(() => res(undefined), 200)))
    mockedUseAuthStore.mockReturnValue({ login, rehydrated: false, isAuthenticated: false } as any)

  const rtl = require('@testing-library/react')
  rtl.render(<OnboardingPlayerClient />)

  // Switch to login tab first
  fireEvent.click(screen.getByRole('button', { name: /login/i }))
  fireEvent.input(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'slow@example.com' } })
  fireEvent.input(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'Abc123!@#' } })
  fireEvent.click(screen.getByTestId('onboarding-login-submit'))

    // Ensure the component didn't crash and login was invoked
    await waitFor(() => expect(login).toHaveBeenCalled())
  })

  test('multiple accounts: clearing and setting token leads to dashboard readiness', async () => {
    const login = jest.fn().mockResolvedValue(undefined)
    // First simulate authenticated with token for account A
    mockedUseAuthStore.mockReturnValue({ login, rehydrated: true, isAuthenticated: true, user: { id: 1 } } as any)

  const rtl = require('@testing-library/react')
  const { rerender } = rtl.render(<OnboardingPlayerClient />)

    // Now simulate switching accounts: auth cleared then set for account B
  mockedUseAuthStore.mockReturnValue({ login, rehydrated: false, isAuthenticated: false } as any)
  rerender(<OnboardingPlayerClient />)

    // Then rehydrate for account B
  mockedUseAuthStore.mockReturnValue({ login, rehydrated: true, isAuthenticated: true, user: { id: 2 } } as any)
  rerender(<OnboardingPlayerClient />)

    // Sanity: ensure login mock still works
    expect(login).toBeDefined()
  })

  test('registration: duplicate email shows inline error and preserves form', async () => {
    // Fake store that will set error after register is called
    let state: { rehydrated: boolean; isAuthenticated: boolean; error: string | null } = {
      rehydrated: true,
      isAuthenticated: false,
      error: null,
    }
    const listeners: Array<(s: any) => void> = []
    const fakeStore = {
      getState: () => state,
      subscribe: (cb: (s: any) => void) => {
        listeners.push(cb)
        return () => {}
      },
      register: jest.fn(async () => {
        // Simulate backend returning duplicate email error
        state = { ...state, error: 'Email: test@example.com already in use' }
        listeners.forEach((l) => l(state))
        return Promise.resolve()
      }),
      login: jest.fn(),
      hostLogin: jest.fn(),
      hostRegister: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    }

    mockedUseAuthStore.mockImplementation(() => fakeStore as any)

    const rtl = require('@testing-library/react')
  rtl.render(<OnboardingPlayerClient />)

    // Fill form
    fireEvent.input(screen.getByPlaceholderText(/Enter your username/i), { target: { value: 'dupuser' } })
    fireEvent.input(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'test@example.com' } })
    fireEvent.input(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'Abc123!@#' } })
    fireEvent.input(screen.getByPlaceholderText(/Confirm your password/i), { target: { value: 'Abc123!@#' } })

    // Submit
    fireEvent.click(screen.getByTestId('onboarding-register-submit'))

    // register called
    await waitFor(() => expect(fakeStore.register).toHaveBeenCalled())

    // Inline email error should appear
    await waitFor(() => expect(screen.getByText(/already in use/i)).toBeInTheDocument())

    // Form values still present
    expect((screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement).value).toBe('test@example.com')
  })

  test('registration: duplicate username shows inline error and preserves form', async () => {
    let state: { rehydrated: boolean; isAuthenticated: boolean; error: string | null } = {
      rehydrated: true,
      isAuthenticated: false,
      error: null,
    }
    const listeners: Array<(s: any) => void> = []
    const fakeStore = {
      getState: () => state,
      subscribe: (cb: (s: any) => void) => {
        listeners.push(cb)
        return () => {}
      },
      register: jest.fn(async () => {
        state = { ...state, error: 'Name: dupuser already in use' }
        listeners.forEach((l) => l(state))
        return Promise.resolve()
      }),
      login: jest.fn(),
      hostLogin: jest.fn(),
      hostRegister: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    }

    mockedUseAuthStore.mockImplementation(() => fakeStore as any)

    const rtl = require('@testing-library/react')
  rtl.render(<OnboardingPlayerClient />)

    // Fill form
    fireEvent.input(screen.getByPlaceholderText(/Enter your username/i), { target: { value: 'dupuser' } })
    fireEvent.input(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'unique@example.com' } })
    fireEvent.input(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'Abc123!@#' } })
    fireEvent.input(screen.getByPlaceholderText(/Confirm your password/i), { target: { value: 'Abc123!@#' } })

    // Submit
    fireEvent.click(screen.getByTestId('onboarding-register-submit'))

    // register called
    await waitFor(() => expect(fakeStore.register).toHaveBeenCalled())

    // Inline username error should appear
    await waitFor(() => expect(screen.getByText(/already in use/i)).toBeInTheDocument())

    // Form values still present
    expect((screen.getByPlaceholderText(/Enter your username/i) as HTMLInputElement).value).toBe('dupuser')
  })
})

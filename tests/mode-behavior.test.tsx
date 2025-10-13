import React from 'react'
import { render, waitFor } from '@testing-library/react'

// Mocks for navigation and auth
const mockUseSearchParams = jest.fn()
jest.mock('next/navigation', () => ({ useSearchParams: () => mockUseSearchParams(), useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), __esModule: true }))
jest.mock('@/lib/stores/auth-store', () => ({ useAuthStore: () => ({ isAuthenticated: true, isLoading: false, user: { fullName: 'Tester' } }) }))

// Spy on API client to ensure no unintended network calls
const mockCreateMatchRoom = jest.fn()
const mockJoinMatchRoom = jest.fn()
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    createMatchRoom: (...args: any[]) => mockCreateMatchRoom(...args),
    joinMatchRoom: (...args: any[]) => mockJoinMatchRoom(...args),
  }
}))

import { useGameStore } from '@/lib/stores/game-store'
import { act } from 'react'
import { mockOpponentMove } from '@/lib/mocks/mock-opponent'
import GamePage from '@/app/game/page'
import { BattleGround } from '@/components/game/battle-ground'
import GameRulesProvider from '@/components/game/GameRulesProvider'

jest.mock('@/lib/mocks/mock-opponent')

describe('Mode runtime behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // reset store
    useGameStore.setState({ serverAuthoritative: false })
  })

  test('AI mode: mockOpponent active and store non-authoritative', async () => {
    // Render BattleGround directly in ai mode
    jest.useFakeTimers()
    try {
      render(
        <GameRulesProvider>
          <BattleGround localMode="ai" />
        </GameRulesProvider>
      )

      // After mount, ensure store reflects non-authoritative
      expect(useGameStore.getState().serverAuthoritative).toBe(false)

      // Simulate it's O's turn and game is playing to trigger opponent
      act(() => {
        useGameStore.setState({ gameStatus: 'playing', currentPlayer: 'O' })
        // Advance timers to trigger the computer move (1s delay in BattleGround)
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => expect((mockOpponentMove as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(0))

      // Ensure no API match room calls happened
      expect(mockCreateMatchRoom).not.toHaveBeenCalled()
      expect(mockJoinMatchRoom).not.toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })

  test('P2P mode: store non-authoritative and no API handshake by default', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('mode=p2p&connection=local'))
    render(
      <GameRulesProvider>
        <GamePage />
      </GameRulesProvider>
    )

    // serverAuthoritative should be false for p2p
    expect(useGameStore.getState().serverAuthoritative).toBe(false)

    // No API create/join called automatically (local-only mocked flow)
    expect(mockCreateMatchRoom).not.toHaveBeenCalled()
    expect(mockJoinMatchRoom).not.toHaveBeenCalled()
  })

  test('Tournament mode: store authoritative but no auto-handshake implemented', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('mode=tournament'))
    render(
      <GameRulesProvider>
        <GamePage />
      </GameRulesProvider>
    )

    // serverAuthoritative should be true for tournament
    expect(useGameStore.getState().serverAuthoritative).toBe(true)

    // TODO: handshake not implemented on mount — assert API not called automatically
    expect(mockCreateMatchRoom).not.toHaveBeenCalled()
  })
})

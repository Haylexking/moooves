import React from 'react'
import { render, screen } from '@testing-library/react'

// We'll mock next/navigation useSearchParams before importing the page
const mockUseSearchParams = jest.fn()
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({ useSearchParams: () => mockUseSearchParams(), useRouter: () => ({ push: mockPush, replace: mockReplace }), __esModule: true }))

// Mock auth store so ProtectedRoute treats user as authenticated
jest.mock('@/lib/stores/auth-store', () => ({ useAuthStore: () => ({ isAuthenticated: true, isLoading: false, rehydrated: true, user: { fullName: 'Tester' } }) }))

// Mock BattleGround to capture props it's called with
const mockBattleGround: any = jest.fn((props: any) => <div data-testid="battle-mock">Battle</div>)
jest.mock('@/components/game/battle-ground', () => ({ BattleGround: (props: any) => mockBattleGround(props) }))

import GamePage from '@/app/game/page'

describe('GamePage query param wiring', () => {
  beforeEach(() => {
    mockBattleGround.mockClear()
  })

  test('mode=ai sets localMode=ai and serverAuthoritative=false', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('mode=ai'))
    render(<GamePage />)

    expect(mockBattleGround).toHaveBeenCalled()
    const props = mockBattleGround.mock.calls[0][0]
    expect(props.localMode).toBe('ai')
    // serverAuthoritative is set on the store; check store value
    const { useGameStore } = require('@/lib/stores/game-store')
    expect(useGameStore.getState().serverAuthoritative).toBe(false)
  })

  test('mode=p2p with connection local sets localMode and connectionType', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('mode=p2p&connection=local'))
    render(<GamePage />)

    expect(mockBattleGround).toHaveBeenCalled()
    const props = mockBattleGround.mock.calls[0][0]
    expect(props.localMode).toBe('p2p')
    expect(props.connectionType).toBe('local')
    const { useGameStore } = require('@/lib/stores/game-store')
    expect(useGameStore.getState().serverAuthoritative).toBe(false)
  })

  test('mode=tournament sets localMode tournament and serverAuthoritative true', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('mode=tournament'))
    render(<GamePage />)

    expect(mockBattleGround).toHaveBeenCalled()
    const props = mockBattleGround.mock.calls[0][0]
    expect(props.localMode).toBe('tournament')
    const { useGameStore } = require('@/lib/stores/game-store')
    expect(useGameStore.getState().serverAuthoritative).toBe(true)
  })
})

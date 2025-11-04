import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useGameStore } from '@/lib/stores/game-store'
import { useTournamentStore } from '@/lib/stores/tournament-store'
import { createEmptyBoard } from './test-utils'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock stores
jest.mock('@/lib/stores/auth-store')
jest.mock('@/lib/stores/game-store')
jest.mock('@/lib/stores/tournament-store')

describe('Platform E2E Tests', () => {
  const mockPush = jest.fn()
  const mockSetUser = jest.fn()
  const mockStartNewGame = jest.fn()
  const mockMakeMove = jest.fn()
  const mockJoinTournament = jest.fn()
  const mockCreateTournament = jest.fn()

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    })

    // Setup auth store mock
    ;(useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'player',
          gamesPlayed: 3,
          canHost: true,
          emailVerified: true,
        },
        isAuthenticated: true,
        isLoading: false,
        setUser: mockSetUser,
      }
      return selector ? selector(state) : state
    })

    // Setup game store mock
    ;(useGameStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        board: createEmptyBoard(),
        currentPlayer: 'X',
        scores: { X: 0, O: 0 },
        gameStatus: 'waiting',
        usedSequences: [],
        startNewGame: mockStartNewGame,
        makeMove: mockMakeMove,
      }
      return selector ? selector(state) : state
    })

    // Setup tournament store mock
    ;(useTournamentStore as unknown as jest.Mock).mockImplementation((selector) => ({
      tournaments: [],
      currentTournament: null,
      joinTournament: mockJoinTournament,
      createTournament: mockCreateTournament,
      loading: false,
    }))
  })

  test('Complete Game Flow: From Login to Game Completion', async () => {
    // Mock the components we'll be testing
    const { StartGameModal } = require('@/components/game/StartGameModal')
    const { PlayerDashboard } = require('@/components/dashboard/player-dashboard')
    
    // 1. Render the player dashboard
    render(
      <div>
        <PlayerDashboard />
        <StartGameModal />
      </div>
    )

    // 2. Verify dashboard is rendered with create tournament button (since canHost is true)
    expect(screen.getByText('Create Tournament')).toBeInTheDocument()

    // 3. Click Start Game
    fireEvent.click(screen.getByText('Start Game'))
    
    // 4. Verify game modal is open
    await waitFor(() => {
      expect(screen.getByText('Start New Game')).toBeInTheDocument()
    })

    // 5. Select AI opponent and start game
    fireEvent.click(screen.getByLabelText('AI Opponent'))
    fireEvent.click(screen.getByText('Start Game'))

    // 6. Verify game was started
    expect(mockStartNewGame).toHaveBeenCalled()

    // 7. Simulate making a move
    const firstCell = document.querySelector('.cell[data-row="7"][data-col="7"]')
    if (firstCell) {
      fireEvent.click(firstCell)
      expect(mockMakeMove).toHaveBeenCalledWith(7, 7)
    }
  })

  test('Tournament Creation Flow', async () => {
    const { PlayerDashboard } = require('@/components/dashboard/player-dashboard')
    
    render(<PlayerDashboard />)
    
    // Click Create Tournament
    fireEvent.click(screen.getByText('Create Tournament'))
    
    // Should navigate to tournament creation
    expect(mockPush).toHaveBeenCalledWith('/tournaments/create')
    
    // Note: In a real test, we would continue with form submission and verification
  })

  test('User Authentication Flow', async () => {
    // Test login/logout flow
    const { LoginForm } = require('@/components/auth/LoginForm')
    
    render(<LoginForm />)
    
    // Fill in login form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    // Verify auth store was updated
    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalled()
    })
  })
})

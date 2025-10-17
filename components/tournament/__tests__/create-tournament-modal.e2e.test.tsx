import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Use the real store implementation
jest.unmock('@/lib/stores/tournament-store')

// Mock next/router push
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }), __esModule: true }))

// Mock the apiClient createTournament to return a created tournament
jest.mock('@/lib/api/client', () => {
  return {
    apiClient: {
      createTournament: jest.fn().mockResolvedValue({ success: true, data: { tournament: { id: 't-e2e-1', name: 'E2E Cup' } } }),
    },
  }
})

import { CreateTournamentModal } from '../create-tournament-modal'

describe('CreateTournamentModal (e2eish)', () => {
  beforeEach(() => {
    mockPush.mockReset()
    jest.clearAllMocks()
  })

  test('calls apiClient.createTournament and updates real store, then navigates', async () => {
    // Import the real store and mocked apiClient
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useTournamentStore } = require('@/lib/stores/tournament-store')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { apiClient } = require('@/lib/api/client')

    // Reset store state to a clean slate
    if (typeof useTournamentStore.setState === 'function') {
      useTournamentStore.setState({ tournaments: [], currentTournament: null, isLoading: false, userTournaments: [] })
    }

    // Render modal
    // @ts-ignore - renderWithProviders is provided by jest.setup
    global.renderWithProviders(<CreateTournamentModal open={true} onClose={() => {}} />)

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Enter tournament name/i), { target: { value: 'E2E Cup' } })
    fireEvent.change(screen.getByLabelText(/Entry Fee \(₦\)/i), { target: { value: '2000' } })
    fireEvent.change(screen.getByLabelText(/Maximum Players/i), { target: { value: '12' } })

    fireEvent.click(screen.getByRole('button', { name: /Create Tournament/i }))

    await waitFor(() => expect(apiClient.createTournament).toHaveBeenCalled())

  // Check store was updated via getState to avoid calling hooks in tests
  const storeState = useTournamentStore.getState()
  const found = (storeState.tournaments || []).find((t: any) => t.id === 't-e2e-1' || t.name === 'E2E Cup')
  expect(found || storeState.currentTournament).toBeTruthy()

    // Router push called
    await waitFor(() => expect(mockPush).toHaveBeenCalled())
  })
})

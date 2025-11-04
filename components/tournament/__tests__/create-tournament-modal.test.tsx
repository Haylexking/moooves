import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock next/navigation to capture router.push
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }), __esModule: true }))

// Mock the tournament store used by the modal
jest.mock('@/lib/stores/tournament-store', () => {
  // Share a single store object so tests can inspect changes
  const shared: any = {
    tournaments: [],
    isLoading: false,
  }

  shared.createTournament = jest.fn(async (payload: any) => {
    const t = { id: 't-123', name: payload.name, entryFee: payload.entryFee, maxPlayers: payload.maxPlayers }
    shared.tournaments.push(t)
    return t
  })

  return {
    useTournamentStore: () => shared,
  }
})

// Mock the auth store
jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { id: 'user-123' },
  }),
}))

import { CreateTournamentModal } from '../create-tournament-modal'

// Provide typing for global helper
declare global {
  var renderWithProviders: (ui: any, opts?: any) => any
}

describe('CreateTournamentModal', () => {
  beforeEach(() => {
    mockPush.mockReset()
  })

  test('submits the form with correct data', async () => {
    const onClose = jest.fn()
    // @ts-ignore - renderWithProviders injected in jest.setup.js
    global.renderWithProviders(<CreateTournamentModal open={true} onClose={onClose} />)

    // Fill form fields
    const nameInput = screen.getByPlaceholderText(/Enter tournament name/i)
    const feeInput = screen.getByLabelText(/Entry Fee \(₦\)/i)
    const maxPlayersInput = screen.getByLabelText(/Maximum Players/i)
    const startTimeInput = screen.getByLabelText(/Start Time \(UTC\)/i)

    fireEvent.change(nameInput, { target: { value: 'Test Cup' } })
    fireEvent.change(feeInput, { target: { value: '1000' } })
    fireEvent.change(maxPlayersInput, { target: { value: '16' } })
    
    // Set a future date for the start time
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1) // Tomorrow
    fireEvent.change(startTimeInput, { target: { value: futureDate.toISOString().slice(0, 16) } })

    const createBtn = screen.getByRole('button', { name: /Create Tournament/i })
    fireEvent.click(createBtn)

    // Check if createTournament was called with the right arguments
    await waitFor(() => {
      const store = require('@/lib/stores/tournament-store')
      const s = store.useTournamentStore()
      
      expect(s.createTournament).toHaveBeenCalled()
      const callArgs = s.createTournament.mock.calls[0][0]
      
      expect(callArgs).toMatchObject({
        name: 'Test Cup',
        entryFee: 1000,
        maxPlayers: 16,
        gameMode: 'timed',
        organizerId: 'user-123',
      })
      expect(callArgs.startTime).toBeDefined()
      
      // Check if the tournament was added to the store
      expect(Array.isArray(s.tournaments)).toBe(true)
      expect(s.tournaments.find((t: any) => t.id === 't-123')).toBeTruthy()
    })

    // Ensure onClose was called (modal closed)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

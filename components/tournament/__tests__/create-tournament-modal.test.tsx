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

import { CreateTournamentModal } from '../create-tournament-modal'

// Provide typing for global helper
declare global {
  var renderWithProviders: (ui: any, opts?: any) => any
}

describe('CreateTournamentModal', () => {
  beforeEach(() => {
    mockPush.mockReset()
  })

  test('creates a tournament and navigates to its page', async () => {
    const onClose = jest.fn()
    // @ts-ignore - renderWithProviders injected in jest.setup.js
    global.renderWithProviders(<CreateTournamentModal open={true} onClose={onClose} />)

  // No-op: toast is tested elsewhere; focus on store and navigation here

    // Fill form fields
    const nameInput = screen.getByPlaceholderText(/Enter tournament name/i)
    const feeInput = screen.getByLabelText(/Entry Fee \(₦\)/i)
    const maxPlayers = screen.getByLabelText(/Maximum Players/i)

    fireEvent.change(nameInput, { target: { value: 'Test Cup' } })
    fireEvent.change(feeInput, { target: { value: '1000' } })
    fireEvent.change(maxPlayers, { target: { value: '16' } })

    const createBtn = screen.getByRole('button', { name: /Create Tournament/i })
    fireEvent.click(createBtn)

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/tournament/t-123'))

  // Ensure onClose was called (modal closed)
  await waitFor(() => expect(onClose).toHaveBeenCalled())

  // Inspect the mocked tournament store and ensure createTournament was invoked
  const store = require('@/lib/stores/tournament-store')
  const s = store.useTournamentStore()
  expect(s.createTournament).toHaveBeenCalled()
  expect(Array.isArray(s.tournaments)).toBe(true)
  expect(s.tournaments.find((t: any) => t.id === 't-123')).toBeTruthy()
  })
})

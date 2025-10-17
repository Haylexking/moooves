import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock apiClient with inline jest.fn() to avoid jest.mock hoisting TDZ
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getAllTournaments: jest.fn(),
    verifyTournamentPayouts: jest.fn(),
    getTournamentWinners: jest.fn(),
  },
}))

// Mock auth store as a host user
jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'host-1', fullName: 'Host One', role: 'host' }, isAuthenticated: true, rehydrated: true }),
}))

// Mock tournament store to provide host tournaments
jest.mock('@/lib/stores/tournament-store', () => ({
  useTournamentStore: () => ({
    userTournaments: [
      { id: 't1', hostId: 'host-1', name: 'Cup 1', status: 'completed', currentPlayers: 16, maxPlayers: 16, totalPool: 16000, inviteCode: 'ABC' },
      { id: 't2', hostId: 'host-1', name: 'Cup 2', status: 'active', currentPlayers: 8, maxPlayers: 16, totalPool: 8000, inviteCode: 'DEF' },
    ],
    loadUserTournaments: jest.fn(),
    isLoading: false,
  }),
}))

import { HostDashboard } from '../host-dashboard'

describe('HostDashboard', () => {
  beforeEach(() => {
    // pull the mocked apiClient and reset spies
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { apiClient: api } = require('@/lib/api/client')
    api.getAllTournaments.mockReset()
    api.verifyTournamentPayouts.mockReset()
    api.getTournamentWinners.mockReset()
  })

  test('renders host stats and calls payout verification for completed tournaments', async () => {
    // @ts-ignore
    const { apiClient: api } = require('@/lib/api/client')
    api.getAllTournaments.mockResolvedValue({ success: true, data: [
      { id: 't1', hostId: 'host-1', name: 'Cup 1', status: 'completed', participants: [{ userId: 'u1' }] },
    ] })

    api.getTournamentWinners.mockResolvedValue({ success: true, data: [{ userId: 'u1', rank: 1, username: 'Player1', prize: 1000 }] })
    api.verifyTournamentPayouts.mockResolvedValue({ success: true, data: { payouts: { host: 8000, first: 3200 } } })

    // @ts-ignore
    global.renderWithProviders(<HostDashboard />)

    // Dashboard header
    expect(await screen.findByText(/Welcome, Host One/i)).toBeInTheDocument()

    // Stats should show tournaments hosted = 2
    expect(screen.getByText('2')).toBeInTheDocument()

    // Ensure verifyTournamentPayouts was called for completed tournament when selecting details
    const viewButtons = screen.getAllByRole('button', { name: /View|Selected/i })
    // Click first View to open tournament details
    fireEvent.click(viewButtons[0])

    await waitFor(() => expect(api.getTournamentWinners).toHaveBeenCalledWith('t1'))
    await waitFor(() => expect(api.verifyTournamentPayouts).toHaveBeenCalledWith('t1'))
  })
})

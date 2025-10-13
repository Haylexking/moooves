import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the auth store to return a non-admin user
jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'user1', fullName: 'Player One', role: 'player' } }),
}))

// Mock apiClient to provide predictable tournament data
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getAllTournaments: jest.fn(async () => ({ success: true, data: [
      { id: 't1', name: 'Test Tournament', status: 'completed', participants: [{ userId: 'user1' }], currentPlayers: 1, maxPlayers: 16, entryFee: 0 }
    ] })),
    getTournament: jest.fn(async (id: string) => ({ success: true, data: { id, bracket: { rounds: [] } } })),
    getTournamentWinners: jest.fn(async () => ({ success: true, data: [] })),
    verifyTournamentPayouts: jest.fn(async () => ({ success: true, data: { payouts: {} } })),
  }
}))

import TournamentDashboard from '../tournament-dashboard'

describe('TournamentDashboard access control', () => {
  it('does not show payout management for non-admin/non-host users', async () => {
    render(<TournamentDashboard />)

    // Wait for the tournament list to appear and click View on the tournament
    const viewButton = await screen.findByRole('button', { name: /View/i })
    await userEvent.click(viewButton)

    // Payout Management section should not be present for a normal player
    await waitFor(() => {
      expect(screen.queryByText(/Payout Management/i)).not.toBeInTheDocument()
    })
  })
})

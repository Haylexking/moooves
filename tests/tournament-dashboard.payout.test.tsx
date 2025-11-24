import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import TournamentDashboard from '@/components/tournament/tournament-dashboard'
import { apiClient } from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from '@/hooks/use-toast'

jest.mock('@/lib/api/client')
jest.mock('@/lib/stores/auth-store')
jest.mock('@/hooks/use-toast')

describe('TournamentDashboard payout flow', () => {
  beforeEach(() => {
    ; (useAuthStore as any).mockReturnValue({ user: { id: 'host1', role: 'host', fullName: 'Host' } })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('shows failed payouts and can manually send via confirm modal', async () => {
    const failedEntry = { userId: 'user123', username: 'Alice', amount: 2000, status: 'failed', accountNumber: '0123456789' }
    const sampleTournament = { id: 't1', hostId: 'host1', name: 'Test Tourney', status: 'completed', participants: [{ userId: 'host1' }], entryFee: 1000, currentPlayers: 1, maxPlayers: 16 }

      ; (apiClient.getAllTournaments as jest.Mock).mockResolvedValue({ success: true, data: [sampleTournament] })
      ; (apiClient.getTournament as jest.Mock).mockResolvedValue({ success: true, data: { id: 't1', hostId: 'host1', status: 'completed', bracket: { rounds: [] } } })
      ; (apiClient.getTournamentWinners as jest.Mock).mockResolvedValue({ success: true, data: [{ userId: 'user123', username: 'Alice', rank: 1, prize: 2000 }] })

      ; (apiClient.verifyTournamentPayouts as jest.Mock).mockResolvedValue({ success: true, data: { payouts: [failedEntry] } })
      ; (apiClient.sendManualPayout as jest.Mock).mockResolvedValue({ success: true, data: { message: 'Payout initiated' } })

    const toastMock = jest.fn()
      ; (toast as any).mockImplementation(toastMock)

    render(<TournamentDashboard />)

    // Select the tournament by clicking the View button so the component will load tournament details
    const viewBtn = await screen.findByRole('button', { name: /View/i })
    fireEvent.click(viewBtn)

    await waitFor(() => expect(apiClient.verifyTournamentPayouts).toHaveBeenCalled())

    // Simulate the failed entry being shown - find the failed text
    expect(await screen.findByText(/failed/i)).toBeInTheDocument()

    // Click the Send Manually button
    const sendButton = screen.getByRole('button', { name: /Send Manually/i })
    fireEvent.click(sendButton)

    // The confirm dialog should appear
    const confirmTitle = await screen.findByText(/Confirm Manual Payout\?/i)
    expect(confirmTitle).toBeInTheDocument()

    // Click Send Payout (confirm)
    const sendPayoutBtn = screen.getByRole('button', { name: /Send Payout/i })
    fireEvent.click(sendPayoutBtn)

    // sendManualPayout should be called and toast invoked
    await waitFor(() => expect(apiClient.sendManualPayout).toHaveBeenCalled())
    await waitFor(() => expect(toastMock).toHaveBeenCalled())
  })
})

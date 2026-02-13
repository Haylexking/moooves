import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TournamentDashboard from '@/components/tournament/tournament-dashboard'
import { apiClient } from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import { toast } from '@/hooks/use-toast'

jest.mock('@/lib/api/client')
jest.mock('@/lib/stores/auth-store')
jest.mock('@/hooks/use-toast')

describe('TournamentDashboard forfeit logic', () => {
    const user = { id: 'user1', role: 'player', fullName: 'Player One' }
    const tournament = {
        id: 't1',
        hostId: 'host1',
        name: 'Forfeit Test Cup',
        status: 'active',
        participants: [{ userId: 'user1' }, { userId: 'user2' }],
        entryFee: 1000,
        currentPlayers: 2,
        maxPlayers: 16,
        startTime: new Date().toISOString(),
    }

    beforeEach(() => {
        ; (useAuthStore as any).mockReturnValue({ user, refreshUser: jest.fn() })
            ; (apiClient.getAllTournaments as jest.Mock).mockResolvedValue({ success: true, data: [tournament] })
            ; (apiClient.getTournamentWinners as jest.Mock).mockResolvedValue({ success: true, data: [] })

    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('shows "Opponent hasn\'t shown up" when user wins by default', async () => {
        const match = {
            id: 'm1',
            tournamentId: 't1',
            roundNumber: 1,
            player1Id: 'user1',
            player2Id: 'user2',
            winnerId: 'user1', // User won
            status: 'forfeited', // Match was forfeited
        }

            ; (apiClient.getTournament as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...tournament, bracket: { rounds: [{ roundNumber: 1, matches: [match] }] } },
            })

        render(<TournamentDashboard />)

        // Open details
        const viewBtn = await screen.findByRole('button', { name: /View/i })
        fireEvent.click(viewBtn)

        // Switch to matches tab
        const matchesTab = await screen.findByText(/Matches/i)
        fireEvent.click(matchesTab)

        // Check for specific message
        expect(await screen.findByText(/Opponent hasn't shown up — you win by default/i)).toBeInTheDocument()
        // Check for badge
        expect(screen.getByText('forfeited')).toHaveClass('bg-red-100 text-red-800')
    })

    test('shows "You missed your match" when user loses by forfeit', async () => {
        const match = {
            id: 'm2',
            tournamentId: 't1',
            roundNumber: 1,
            player1Id: 'user1',
            player2Id: 'user2',
            winnerId: 'user2', // Opponent won
            status: 'forfeited', // Match was forfeited
        }

            ; (apiClient.getTournament as jest.Mock).mockResolvedValue({
                success: true,
                data: { ...tournament, bracket: { rounds: [{ roundNumber: 1, matches: [match] }] } },
            })

        render(<TournamentDashboard />)

        // Open details
        const viewBtn = await screen.findByRole('button', { name: /View/i })
        fireEvent.click(viewBtn)

        // Switch to matches tab
        const matchesTab = await screen.findByText(/Matches/i)
        fireEvent.click(matchesTab)

        // Check for specific message
        expect(await screen.findByText(/You missed your match — you forfeit this round/i)).toBeInTheDocument()
    })
})

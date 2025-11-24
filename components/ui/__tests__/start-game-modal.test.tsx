import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'

// Provide typing for the global test helper injected in jest.setup.js
declare global {
  var renderWithProviders: (ui: any, options?: any) => any
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

import StartGameModal from '../start-game-modal'

// Mock hooks
jest.mock('@/lib/hooks/use-match-room', () => ({
  useMatchRoom: () => ({
    createRoom: jest.fn(() => Promise.resolve('RM1234')),
    joinRoom: jest.fn(() => Promise.resolve(true)),
    roomCode: 'RM1234',
  }),
}))

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'u1', gamesPlayed: 5 } }),
}))

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}))

describe('StartGameModal', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
      ; (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        replace: mockReplace,
      })
  })

  test('renders and allows launching AI (Play vs Computer)', async () => {
    const onOpenChange = jest.fn()
    // @ts-ignore - global helper injected by jest.setup.js
    global.renderWithProviders(<StartGameModal open={true} onOpenChange={onOpenChange} />)

    // Wait for dialog to open, then find the Player vs Computer button
    await screen.findByRole('dialog')
    const aiBtn = await screen.findByText(/Player vs Computer/i)
    expect(aiBtn).toBeInTheDocument()

    fireEvent.click(aiBtn)

    // Should navigate to game with replace=true
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/game?mode=ai'))
  })

  test('join tournament navigates to tournaments', async () => {
    const onOpenChange = jest.fn()
    // @ts-ignore - global helper injected by jest.setup.js
    global.renderWithProviders(<StartGameModal open={true} onOpenChange={onOpenChange} />)

    // Join Tournament should be visible
    const joinTournament = await screen.findByText(/Join Tournament/i)
    expect(joinTournament).toBeInTheDocument()

    fireEvent.click(joinTournament)

    // Should navigate to tournaments
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/tournaments'))
  })
})

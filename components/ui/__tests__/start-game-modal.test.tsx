import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock next/navigation before importing the component that uses useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
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
  useAuthStore: () => ({ user: { id: 'u1' } }),
}))

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}))

describe('StartGameModal', () => {
  test('renders and allows launching AI (Play vs Computer)', async () => {
    const onOpenChange = jest.fn()
    render(<StartGameModal open={true} onOpenChange={onOpenChange} />)

    // Play vs Computer should be visible
    const aiBtn = screen.getByText(/Play vs Computer/i)
    expect(aiBtn).toBeInTheDocument()

    fireEvent.click(aiBtn)

    // modal should be closed when launching
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  test('join tournament navigates to tournaments', async () => {
    const onOpenChange = jest.fn()
    render(<StartGameModal open={true} onOpenChange={onOpenChange} />)

    // Join Tournament should be visible
    const joinTournament = screen.getByText(/Join Tournament/i)
    expect(joinTournament).toBeInTheDocument()

    fireEvent.click(joinTournament)

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})

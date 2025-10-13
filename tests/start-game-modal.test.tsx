import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

// Mock next/navigation before importing component
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }), __esModule: true }))

// Mock framer-motion to avoid animation delays in tests
jest.mock('framer-motion', () => ({
  motion: { div: ({ children }: any) => <div>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

import StartGameModal from '@/components/game/StartGameModal'
import { useGameStore } from '@/lib/stores/game-store'

describe('StartGameModal', () => {
  beforeEach(() => {
    mockPush.mockReset()
    // reset connected flag in store
    useGameStore.setState({ serverAuthoritative: true })
  })
  

  test('renders main buttons', async () => {
    const onOpenChange = jest.fn()
    render(<StartGameModal open={true} onOpenChange={onOpenChange} />)

  expect(screen.getByRole('button', { name: /Play 1v1/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Play vs Computer/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Join Tournament/i })).toBeInTheDocument()
  })

  test('play vs computer launches AI and closes modal', () => {
    const onOpenChange = jest.fn()
    render(<StartGameModal open={true} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Play vs Computer/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockPush).toHaveBeenCalledWith('/game?mode=ai')
  })

  test('play 1v1 submenu and back button', () => {
    const onOpenChange = jest.fn()
    render(<StartGameModal open={true} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Play 1v1/i }))
    expect(screen.getByRole('button', { name: /^Nearby$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Back$/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Back$/i }))
    // main view restored
    expect(screen.getByRole('button', { name: /Play 1v1/i })).toBeInTheDocument()
  })

  test('play 1v1 nearby connects and navigates, sets serverAuthoritative false', async () => {
    const onOpenChange = jest.fn()
  // const user = userEvent.setup()
    // Use fake timers for the connect delay only
    jest.useFakeTimers()
    try {
      render(<StartGameModal open={true} onOpenChange={onOpenChange} />)

      // Set initial to true so we can confirm it becomes false
      useGameStore.setState({ serverAuthoritative: true })

  fireEvent.click(screen.getByRole('button', { name: /Play 1v1/i }))
  fireEvent.click(screen.getByRole('button', { name: /^Nearby$/i }))

      // Should show connecting immediately
      expect(screen.getByText(/Connecting/i)).toBeInTheDocument()

      // serverAuthoritative should have been set to false immediately
      expect(useGameStore.getState().serverAuthoritative).toBe(false)

  // Advance timers to simulate 2s connect
  jest.advanceTimersByTime(2000)

  // Wait for navigation to have been called (component closes)
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/game?mode=p2p&connection=local'))

      // Should have navigated to p2p route
      expect(mockPush).toHaveBeenCalledWith('/game?mode=p2p&connection=local')
      expect(onOpenChange).toHaveBeenCalledWith(false)
    } finally {
      jest.useRealTimers()
    }
  })

  test('join tournament routes to tournaments', async () => {
    const onOpenChange = jest.fn()
    render(<StartGameModal open={true} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Join Tournament/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockPush).toHaveBeenCalledWith('/tournaments')
  })
})

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

  test('join tournament routes to tournaments', async () => {
    const onOpenChange = jest.fn()
    render(<StartGameModal open={true} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Join Tournament/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockPush).toHaveBeenCalledWith('/tournaments')
  })
})

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useMatchRoom } from '@/lib/hooks/use-match-room'

// Mock auth store
jest.mock('@/lib/stores/auth-store', () => ({ useAuthStore: () => ({ user: { id: 'user-123' } }) }))

// Mock apiClient
const mockCreateMatchRoom = jest.fn()
jest.mock('@/lib/api/client', () => ({ apiClient: { createMatchRoom: (...args: any[]) => mockCreateMatchRoom(...args) } }))

describe('useMatchRoom.createRoom normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('normalizes different backend shapes into {roomId, roomCode, bluetoothToken}', async () => {
    const { result } = renderHook(() => useMatchRoom())

    // Case 1: response.data contains id, roomCode, bluetoothToken
    mockCreateMatchRoom.mockResolvedValueOnce({ success: true, data: { id: 'r1', roomCode: 'ABC123', bluetoothToken: 'bt-1' } })
    const created1 = await act(async () => await result.current.createRoom())
    expect(created1).toEqual({ roomId: 'r1', roomCode: 'ABC123', bluetoothToken: 'bt-1' })

    // Case 2: response.data contains match.id and match.roomCode
    mockCreateMatchRoom.mockResolvedValueOnce({ success: true, data: { match: { id: 'r2', roomCode: 'XYZ789' }, handshakeToken: 'hs-2' } })
    const created2 = await act(async () => await result.current.createRoom())
    expect(created2).toEqual({ roomId: 'r2', roomCode: 'XYZ789', bluetoothToken: 'hs-2' })

    // Case 3: response.data contains matchId and no tokens
    mockCreateMatchRoom.mockResolvedValueOnce({ success: true, data: { matchId: 'r3' } })
    const created3 = await act(async () => await result.current.createRoom())
    expect(created3).toEqual({ roomId: 'r3', roomCode: null, bluetoothToken: null })
  })
})

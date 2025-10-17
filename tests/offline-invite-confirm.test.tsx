import React from 'react'
import { render, act, screen, fireEvent } from '@testing-library/react'

// Provide mocks for Bluetooth and WiFi hooks used by component
let btOnMessageHandler: ((data: any) => void) | null = null
let wifiOnMessageHandler: ((data: any) => void) | null = null

jest.mock('@/lib/hooks/use-bluetooth-connection', () => ({
  useBluetoothConnection: () => ({
    checkSupport: jest.fn(),
    scanForDevices: jest.fn(),
    connectToDevice: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: (type: string, handler: any) => {
      btOnMessageHandler = handler
      return () => { btOnMessageHandler = null }
    },
    disconnect: jest.fn(),
    isSupported: true,
    isConnected: true,
    connectedDevice: { id: 'dev1', name: 'MOOOVES-DEV', connected: true },
    availableDevices: [],
  })
}))

jest.mock('@/lib/hooks/use-wifi-connection', () => ({
  useWiFiConnection: () => ({
    hostGame: jest.fn(),
    joinGame: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: (type: string, handler: any) => {
      wifiOnMessageHandler = handler
      return () => { wifiOnMessageHandler = null }
    },
    disconnect: jest.fn(),
    isSupported: true,
    isConnected: true,
    roomCode: 'ROOM01',
  })
}))

// Mock matchRoom hook so we can observe joinRoom calls
let joinRoomCalled: any = null
jest.mock('@/lib/hooks/use-match-room', () => ({
  useMatchRoom: () => ({
    createRoom: jest.fn(),
    joinRoom: async (roomId: string, token: string) => { joinRoomCalled = { roomId, token } },
    emitInvite: jest.fn(),
    onInvite: jest.fn(),
    roomId: null,
    roomCode: null,
    isHost: false,
    isConnected: false,
    error: null,
    participants: [],
  })
}))

// Mock apiClient.getAllMatchRooms to return matching room for token
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getAllMatchRooms: async () => ({ success: true, data: [ { id: 'room-123', roomCode: 'ABC123', bluetoothToken: 'bt-token-1', handshakeToken: 'hs-1' } ] })
  }
}))

import { OfflineGameSetup } from '@/components/offline/offline-game-setup'

describe('Offline invite confirmation flow', () => {
  beforeEach(() => {
    joinRoomCalled = null
    btOnMessageHandler = null
    wifiOnMessageHandler = null
    jest.clearAllMocks()
  })

  test('receives bluetooth invite and confirms before joining via modal', async () => {
    await act(async () => {
      render(<OfflineGameSetup />)
    })

    // Simulate incoming bluetooth ping with inviteToken
    expect(typeof btOnMessageHandler).toBe('function')

    await act(async () => {
      btOnMessageHandler?.({ inviteToken: 'bt-token-1' })
    })

    // Modal should open and show Accept button
    const accept = await screen.findByText(/Accept & Join/i)
    expect(accept).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(accept)
    })

    // joinRoom should have been called via our mocked matchRoom
    expect(joinRoomCalled).not.toBeNull()
    expect(joinRoomCalled.roomId).toBe('room-123')
    expect(['hs-1', 'bt-token-1']).toContain(joinRoomCalled.token)
  })

  test('receives wifi invite and declines via modal -> does not join', async () => {
    await act(async () => {
      render(<OfflineGameSetup />)
    })

    await act(async () => {
      wifiOnMessageHandler?.({ inviteToken: 'bt-token-1' })
    })

    // Decline
    const decline = await screen.findByText(/Decline/i)
    expect(decline).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(decline)
    })

    expect(joinRoomCalled).toBeNull()
  })
})

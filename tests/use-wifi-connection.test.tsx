import React from 'react'
import { render, act } from '@testing-library/react'
import { useWiFiConnection } from '@/lib/hooks/use-wifi-connection'

function TestComponent({ onReady }: { onReady?: (api: any) => void }) {
  const api = useWiFiConnection()
  React.useEffect(() => { if (onReady) onReady(api) }, [api, onReady])
  return null
}

describe('useWiFiConnection hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  test('host/join flow and message handling', async () => {
    // Mock RTCPeerConnection and RTCDataChannel
    const sendMock = jest.fn()
    const dataChannelMock: any = {
      send: sendMock,
      close: jest.fn(),
      readyState: 'open',
      onmessage: null,
      onopen: null,
      onclose: null,
    }

    const pcMock: any = {
      createDataChannel: jest.fn(() => dataChannelMock),
      createOffer: jest.fn(async () => ({ sdp: 'offer-sdp' })),
      setLocalDescription: jest.fn(async () => {}),
      setRemoteDescription: jest.fn(async () => {}),
      createAnswer: jest.fn(async () => ({ sdp: 'answer-sdp' })),
      // duplicate setLocalDescription removed
      close: jest.fn(),
      addIceCandidate: jest.fn(async () => {}),
      onicecandidate: null,
      onconnectionstatechange: null,
      ondatachannel: null,
    };

  // @ts-ignore - jest mock for browser API
  (global as any).RTCPeerConnection = jest.fn(() => pcMock)

  // Polyfill RTCSessionDescription and RTCIceCandidate for Jest node env
  // @ts-ignore
  global.RTCSessionDescription = global.RTCSessionDescription || class { constructor(desc:any){ this.type = desc.type; this.sdp = desc.sdp } }
  // @ts-ignore
  global.RTCIceCandidate = global.RTCIceCandidate || class { constructor(cand:any){ this.candidate = cand } }

  let apiRef: any = null
    await act(async () => {
      render(<TestComponent onReady={(api) => { apiRef = api }} />)
    })

    // Host a game (should create offer and store it)
    const roomCode = await act(async () => {
      return await apiRef.hostGame()
    })

    expect(roomCode).toBeTruthy()
    const stored = JSON.parse(localStorage.getItem('moooves_offer') || '{}')
    expect(stored.roomCode).toBe(roomCode)

    // Simulate a guest joining by reading the offer and invoking joinGame
    // For join, we need to simulate that createAnswer will run and store an answer
    await act(async () => {
      await apiRef.joinGame(roomCode)
    })

    // Now set up onMessage handler and simulate incoming data via dataChannel
    const handler = jest.fn()
    const cleanup = apiRef.onMessage('move', handler)

    // Simulate receiving a message on dataChannel
    const message = JSON.stringify({ type: 'move', data: { row: 0, col: 0 }, timestamp: Date.now() })
    // Call the data channel's onmessage handler directly
    act(() => {
      if (dataChannelMock.onmessage) dataChannelMock.onmessage({ data: message })
    })

    // Handler should have been called
    expect(handler).toHaveBeenCalledWith({ row: 0, col: 0 })

    cleanup()
  })
})

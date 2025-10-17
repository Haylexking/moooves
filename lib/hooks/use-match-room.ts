"use client"

import { useState, useCallback, useRef } from "react"
import { logDebug } from '@/lib/logger'
import { apiClient } from "@/lib/api/client"
import type { Move } from "@/lib/types"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useGameStore } from "@/lib/stores/game-store"

interface MatchRoomState {
  roomId: string | null
  roomCode?: string | null
  isHost: boolean
  isConnected: boolean
  error: string | null
  participants: string[]
}

export function useMatchRoom() {
  const [state, setState] = useState<MatchRoomState>({
    roomId: null,
    isHost: false,
    isConnected: false,
    error: null,
    participants: [],
  })

  const { user } = useAuthStore()
  const bluetoothTokenRef = useRef<string | null>(null)
  const handshakeTokenRef = useRef<string | null>(null)
  const inviteHandlersRef = useRef<((payload: { roomId?: string | null; roomCode?: string | null; token?: string | null; source?: 'bluetooth' | 'wifi' }) => void)[]>([])

  // Create a new match room. Returns the backend room id and tokens the server generated.
  const createRoom = useCallback(
    async () => {
      setState((prev) => ({ ...prev, error: null }))

      if (!user?.id) {
        const errorMessage = "User not authenticated"
        setState((prev) => ({ ...prev, error: errorMessage }))
        throw new Error(errorMessage)
      }

      try {
        const response = await apiClient.createMatchRoom(user.id, "TicTacToe")

        if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to create room")
        }

  // API shape varies between backends/mocks. Normalize common fields.
  const roomId = response.data?.id || response.data?.roomId || response.data?.matchId || response.data?.match?.id || null
  const roomCode = response.data?.roomCode || response.data?.code || response.data?.match?.roomCode || null
  // Backend may return a bluetoothToken / handshakeToken used for offline join verification
  const bluetoothTokenFromServer = response.data?.bluetoothToken || response.data?.handshakeToken || null
  // Store server-provided token for later use (we'll send it over local connection to the peer)
  bluetoothTokenRef.current = bluetoothTokenFromServer

        // Enable server-authoritative mode for online match
        useGameStore.setState({ serverAuthoritative: true })

        setState((prev) => ({
          ...prev,
          roomId,
          roomCode,
          isHost: true,
          isConnected: true,
        }))

        // Return full normalized result so callers can share server tokens over local links
        return {
          roomId: roomId || null,
          roomCode: roomCode || null,
          bluetoothToken: bluetoothTokenRef.current || null,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create room"
        setState((prev) => ({ ...prev, error: errorMessage }))
        throw error
      }
    },
    [user?.id],
  )

  // Join an existing match room. handshakeToken should be the token received over the local channel.
  const joinRoom = useCallback(
    async (roomId: string, handshakeToken: string) => {
      setState((prev) => ({ ...prev, error: null }))

      if (!user?.id) {
        const errorMessage = "User not authenticated"
        setState((prev) => ({ ...prev, error: errorMessage }))
        throw new Error(errorMessage)
      }

      try {
        const response = await apiClient.joinMatchRoom(roomId, user.id, handshakeToken)

        if (!response.success) {
          throw new Error(response.error || "Failed to join room")
        }

  handshakeTokenRef.current = handshakeToken

        // Normalize fields returned from join
        const joinedRoomId = response.data?.id || response.data?.roomId || response.data?.matchId || roomId
        const joinedRoomCode = response.data?.roomCode || response.data?.code || response.data?.match?.roomCode || null

        setState((prev) => ({
          ...prev,
          roomId: joinedRoomId,
          roomCode: joinedRoomCode,
          isHost: false,
          isConnected: true,
        }))

        // Enable server-authoritative mode for online match
        useGameStore.setState({ serverAuthoritative: true })

        return joinedRoomId || joinedRoomCode || null
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to join room"
        setState((prev) => ({ ...prev, error: errorMessage }))
        throw error
      }
    },
    [user?.id],
  )

  // Allow UI/local-channel to register invite handlers. When an invite arrives over
  // Bluetooth/WiFi, the channel should call `emitInvite` and the UI can prompt the user
  // for confirmation before invoking `joinRoom`.
  const onInvite = useCallback((handler: (payload: { roomId?: string | null; roomCode?: string | null; token?: string | null; source?: 'bluetooth' | 'wifi' }) => void) => {
    inviteHandlersRef.current.push(handler)
    return () => {
      inviteHandlersRef.current = inviteHandlersRef.current.filter(h => h !== handler)
    }
  }, [])

  const emitInvite = useCallback((payload: { roomId?: string | null; roomCode?: string | null; token?: string | null; source?: 'bluetooth' | 'wifi' }) => {
    inviteHandlersRef.current.forEach((h) => {
      try {
        h(payload)
      } catch (err) {
        logDebug('MatchRoom', { event: 'invite-handler-error', error: String(err) })
      }
    })
  }, [])

  // Get room details
  const getRoomDetails = useCallback(async (roomId: string) => {
    try {
      const response = await apiClient.getMatchRoom(roomId)

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to get room details")
      }

      setState((prev) => ({
        ...prev,
        participants: response.data.participants || [],
      }))

      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get room details"
      setState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // Make a move in the match
  const makeMove = useCallback(
    async (move: Move) => {
      if (!state.roomId || !user?.id) {
        throw new Error("Not connected to any room or user not authenticated")
      }

      try {
        const row = move.row ?? move.position[0]
        const col = move.col ?? move.position[1]

        // Send move to server and wait for authoritative response
        const response = await apiClient.makeGameMove(user.id, row, col, state.roomId)

        if (!response.success) {
          throw new Error(response.error || "Server rejected move")
        }

        // Apply server authoritative match state if provided
        const matchState = response.data && (response.data.match || response.data)
        if (matchState) {
          // Apply server state into local game store
          const gs = useGameStore.getState()
          if (gs.applyServerMatchState) {
            gs.applyServerMatchState(matchState)
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to make move"
        setState((prev) => ({ ...prev, error: errorMessage }))
        throw error
      }
    },
    [state.roomId, user?.id],
  )

  // Leave the room
  const leaveRoom = useCallback(async () => {
    if (!state.roomId) return

    try {
      await apiClient.deleteMatchRoom(state.roomId)

      // Disable server-authoritative when leaving room
      useGameStore.setState({ serverAuthoritative: false })

      setState({
        roomId: null,
        isHost: false,
        isConnected: false,
        error: null,
        participants: [],
      })

      bluetoothTokenRef.current = null
      handshakeTokenRef.current = null
    } catch (error) {
      logDebug('MatchRoom', { event: 'leave-room-failed', error: String(error) })
      // Still reset state even if API call fails
      setState({
        roomId: null,
        isHost: false,
        isConnected: false,
        error: null,
        participants: [],
      })
    }
  }, [state.roomId])

  return {
    ...state,
    createRoom,
    joinRoom,
    onInvite,
    emitInvite,
    getRoomDetails,
    makeMove,
    leaveRoom,
  }
}

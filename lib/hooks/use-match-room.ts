"use client"

import { useState, useCallback, useRef } from "react"
import { apiClient } from "@/lib/api/client"
import type { Move } from "@/lib/types"
import { useAuthStore } from "@/lib/stores/auth-store"

interface MatchRoomState {
  roomId: string | null
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

  // Create a new match room
  const createRoom = useCallback(
    async (bluetoothToken: string) => {
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

        const roomId = response.data.id || response.data.roomId

        bluetoothTokenRef.current = bluetoothToken

        setState((prev) => ({
          ...prev,
          roomId,
          isHost: true,
          isConnected: true,
        }))

        return roomId
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create room"
        setState((prev) => ({ ...prev, error: errorMessage }))
        throw error
      }
    },
    [user?.id],
  )

  // Join an existing match room
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

        setState((prev) => ({
          ...prev,
          roomId,
          isHost: false,
          isConnected: true,
        }))

        return roomId
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to join room"
        setState((prev) => ({ ...prev, error: errorMessage }))
        throw error
      }
    },
    [user?.id],
  )

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

        await apiClient.makeGameMove(user.id, row, col, state.roomId)
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
      console.error("Failed to leave room:", error)
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
    getRoomDetails,
    makeMove,
    leaveRoom,
  }
}

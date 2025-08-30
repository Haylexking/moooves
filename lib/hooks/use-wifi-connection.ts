"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Move } from "@/lib/types"

interface WiFiConnectionState {
  isSupported: boolean
  isHosting: boolean
  isConnected: boolean
  roomCode: string | null
  error: string | null
}

interface WiFiMessage {
  type: "move" | "game_start" | "game_end" | "ping"
  data: any
  timestamp: number
}

export function useWiFiConnection() {
  const [state, setState] = useState<WiFiConnectionState>({
    isSupported: typeof window !== "undefined" && "RTCPeerConnection" in window,
    isHosting: false,
    isConnected: false,
    roomCode: null,
    error: null,
  })

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map())
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([])

  // WebRTC configuration with free STUN servers
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
  }

  // Handle incoming messages
  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WiFiMessage = JSON.parse(event.data)

      // Route message to appropriate handler
      const handler = messageHandlersRef.current.get(message.type)
      if (handler) {
        handler(message.data)
      }
    } catch (error) {
      console.error("Failed to parse WiFi message:", error)
      setState((prev) => ({
        ...prev,
        error: "Failed to parse message from opponent",
      }))
    }
  }, [])

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection(rtcConfig)

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In production, send this to signaling server
        // For local play, we'll use localStorage as simple signaling
        const candidates = JSON.parse(localStorage.getItem("moooves_ice_candidates") || "[]")
        candidates.push({
          candidate: event.candidate,
          timestamp: Date.now(),
          from: state.isHosting ? "host" : "guest",
        })
        localStorage.setItem("moooves_ice_candidates", JSON.stringify(candidates))
      }
    }

    peerConnection.onconnectionstatechange = () => {
      const connectionState = peerConnection.connectionState

      setState((prev) => ({
        ...prev,
        isConnected: connectionState === "connected",
        error: connectionState === "failed" ? "Connection failed" : null,
      }))

      if (connectionState === "connected") {
        console.log("WebRTC connection established")
      }
    }

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel
      setupDataChannel(dataChannel)
    }

    peerConnectionRef.current = peerConnection
    return peerConnection
  }, [state.isHosting])

  // Setup data channel for game communication
  const setupDataChannel = useCallback(
    (dataChannel: RTCDataChannel) => {
      dataChannel.onopen = () => {
        console.log("Data channel opened")
        setState((prev) => ({ ...prev, isConnected: true }))
      }

      dataChannel.onclose = () => {
        console.log("Data channel closed")
        setState((prev) => ({ ...prev, isConnected: false }))
      }

      dataChannel.onmessage = handleDataChannelMessage

      dataChannelRef.current = dataChannel
    },
    [handleDataChannelMessage],
  )

  // Host a game room
  const hostGame = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null, isHosting: true }))

    try {
      // Clear any existing signaling data
      localStorage.removeItem("moooves_offer")
      localStorage.removeItem("moooves_answer")
      localStorage.removeItem("moooves_ice_candidates")

      const peerConnection = initializePeerConnection()

      // Create data channel
      const dataChannel = peerConnection.createDataChannel("moooves_game", {
        ordered: true,
      })
      setupDataChannel(dataChannel)

      // Create offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Generate room code and store offer
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      localStorage.setItem(
        "moooves_offer",
        JSON.stringify({
          offer: offer,
          roomCode: roomCode,
          timestamp: Date.now(),
        }),
      )

      setState((prev) => ({
        ...prev,
        roomCode,
      }))

      // Start polling for answer
      pollForAnswer(roomCode)

      return roomCode
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to host game",
        isHosting: false,
      }))
      throw error
    }
  }, [initializePeerConnection, setupDataChannel])

  // Poll for answer from guest
  const pollForAnswer = useCallback((roomCode: string) => {
    const pollInterval = setInterval(() => {
      const answerData = localStorage.getItem("moooves_answer")
      if (answerData) {
        try {
          const { answer, forRoomCode } = JSON.parse(answerData)
          if (forRoomCode === roomCode && peerConnectionRef.current) {
            peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
            clearInterval(pollInterval)

            // Process any pending ICE candidates
            processPendingCandidates()
          }
        } catch (error) {
          console.error("Failed to process answer:", error)
        }
      }
    }, 1000)

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000)
  }, [])

  // Join a game room
  const joinGame = useCallback(
    async (roomCode: string) => {
      setState((prev) => ({ ...prev, error: null, isHosting: false }))

      try {
        // Look for offer with matching room code
        const offerData = localStorage.getItem("moooves_offer")
        if (!offerData) {
          throw new Error("Room not found")
        }

        const { offer, roomCode: storedRoomCode } = JSON.parse(offerData)
        if (storedRoomCode !== roomCode.toUpperCase()) {
          throw new Error("Invalid room code")
        }

        const peerConnection = initializePeerConnection()

        // Set remote description
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

        // Create answer
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        // Store answer
        localStorage.setItem(
          "moooves_answer",
          JSON.stringify({
            answer: answer,
            forRoomCode: roomCode.toUpperCase(),
            timestamp: Date.now(),
          }),
        )

        setState((prev) => ({
          ...prev,
          roomCode: roomCode.toUpperCase(),
        }))

        // Process any pending ICE candidates
        processPendingCandidates()
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to join game",
        }))
        throw error
      }
    },
    [initializePeerConnection],
  )

  // Process pending ICE candidates
  const processPendingCandidates = useCallback(() => {
    const candidatesData = localStorage.getItem("moooves_ice_candidates")
    if (candidatesData && peerConnectionRef.current) {
      try {
        const candidates = JSON.parse(candidatesData)
        const relevantCandidates = candidates.filter((item: any) => item.from !== (state.isHosting ? "host" : "guest"))

        relevantCandidates.forEach((item: any) => {
          peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(item.candidate))
        })
      } catch (error) {
        console.error("Failed to process ICE candidates:", error)
      }
    }
  }, [state.isHosting])

  // Send message to opponent
  const sendMessage = useCallback(async (type: WiFiMessage["type"], data: any) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      throw new Error("Data channel not ready")
    }

    try {
      const message: WiFiMessage = {
        type,
        data,
        timestamp: Date.now(),
      }

      dataChannelRef.current.send(JSON.stringify(message))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to send message to opponent",
      }))
      throw error
    }
  }, [])

  // Send move to opponent
  const sendMove = useCallback(
    async (move: Move) => {
      await sendMessage("move", move)
    },
    [sendMessage],
  )

  // Register message handler
  const onMessage = useCallback((type: WiFiMessage["type"], handler: (data: any) => void) => {
    messageHandlersRef.current.set(type, handler)

    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(type)
    }
  }, [])

  // Disconnect from game
  const disconnect = useCallback(() => {
    try {
      if (dataChannelRef.current) {
        dataChannelRef.current.close()
        dataChannelRef.current = null
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      // Clear signaling data
      localStorage.removeItem("moooves_offer")
      localStorage.removeItem("moooves_answer")
      localStorage.removeItem("moooves_ice_candidates")

      setState({
        isSupported: typeof window !== "undefined" && "RTCPeerConnection" in window,
        isHosting: false,
        isConnected: false,
        roomCode: null,
        error: null,
      })
    } catch (error) {
      console.error("Error disconnecting WiFi:", error)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    ...state,
    hostGame,
    joinGame,
    sendMove,
    sendMessage,
    onMessage,
    disconnect,
  }
}

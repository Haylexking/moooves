"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { logDebug } from '@/lib/hooks/use-debug-logger'
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
  const lastIceTimestampRef = useRef<number>(0)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // WebRTC configuration with STUN and optional TURN from env
  const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL
  const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME || (process as any).env?.TURN_USERNAME
  const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || (process as any).env?.TURN_CREDENTIAL
  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ]
  if (TURN_URL) {
    iceServers.push({ urls: TURN_URL, username: TURN_USERNAME, credential: TURN_CREDENTIAL } as any)
  }
  const rtcConfig: RTCConfiguration = {
    iceServers,
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
      logDebug('WiFi', { event: 'parse-error', error: String(error) })
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
        // Buffer until we know roomCode, then flush to server
        pendingCandidatesRef.current.push(event.candidate)
        // Also update localStorage for same-device demo fallback
        try {
          const candidates = JSON.parse(localStorage.getItem("moooves_ice_candidates") || "[]")
          candidates.push({
            candidate: event.candidate,
            timestamp: Date.now(),
            from: state.isHosting ? "host" : "guest",
          })
          localStorage.setItem("moooves_ice_candidates", JSON.stringify(candidates))
        } catch {}
      }
    }

    peerConnection.onconnectionstatechange = () => {
      const connectionState = peerConnection.connectionState

      setState((prev) => ({
        ...prev,
        isConnected: connectionState === "connected",
        error: connectionState === "failed" ? "Connection failed - please try again" : null,
      }))

      if (connectionState === "connected") {
        logDebug('WiFi', { event: 'connected' })
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
      } else if (connectionState === "failed" || connectionState === "disconnected") {
        setTimeout(() => {
          disconnect()
        }, 2000)
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
        logDebug('WiFi', { event: 'datachannel-open' })
        setState((prev) => ({ ...prev, isConnected: true, error: null }))
      }

      dataChannel.onclose = () => {
        logDebug('WiFi', { event: 'datachannel-closed' })
        setState((prev) => ({ ...prev, isConnected: false }))
      }

      dataChannel.onerror = (error) => {
        logDebug('WiFi', { event: 'datachannel-error', error: String(error) })
        setState((prev) => ({ ...prev, error: "Connection error occurred" }))
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
      // Send offer to backend signaling
      try {
        await fetch("/api/webrtc/offer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: roomCode, sdp: offer }),
        })
      } catch {}
      // Fallback for same-device demo
      try {
        localStorage.setItem(
          "moooves_offer",
          JSON.stringify({ offer, roomCode, timestamp: Date.now() }),
        )
      } catch {}

      setState((prev) => ({
        ...prev,
        roomCode,
      }))

      // Flush buffered ICE to server
      try {
        for (const cand of pendingCandidatesRef.current.splice(0)) {
          await fetch("/api/webrtc/ice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: roomCode, candidate: cand, from: "host" }),
          })
        }
      } catch {}

      // Start polling for answer (server first, localStorage fallback)
      pollForAnswer(roomCode)
      pollServerCandidates(roomCode)

      connectionTimeoutRef.current = setTimeout(
        () => {
          setState((prev) => ({
            ...prev,
            error: "Connection timeout - no one joined the room",
          }))
        },
        5 * 60 * 1000,
      ) // 5 minutes

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
    const pollInterval = setInterval(async () => {
      try {
        // Try server
        const res = await fetch(`/api/webrtc/answer?roomId=${encodeURIComponent(roomCode)}`)
        if (res.ok) {
          const json = await res.json()
          if (json?.found && json?.sdp && peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(json.sdp))
            clearInterval(pollInterval)
            processPendingCandidates()
            return
          }
        }
      } catch {}

      // Fallback: localStorage
      const answerData = localStorage.getItem("moooves_answer")
      if (answerData) {
        try {
          const { answer, forRoomCode } = JSON.parse(answerData)
          if (forRoomCode === roomCode && peerConnectionRef.current) {
            peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
            clearInterval(pollInterval)
            processPendingCandidates()
          }
        } catch (error) {
          logDebug('WiFi', { event: 'process-answer-error', error: String(error) })
        }
      }
    }, 1000)

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000)
  }, [processPendingCandidates])

  // Join a game room
  const joinGame = useCallback(
    async (roomCode: string) => {
      setState((prev) => ({ ...prev, error: null, isHosting: false }))

      try {
        // Try to fetch offer from backend
        let offer: any | null = null
        try {
          const res = await fetch(`/api/webrtc/offer?roomId=${encodeURIComponent(roomCode.toUpperCase())}`)
          if (res.ok) {
            const json = await res.json()
            if (json?.found && json?.sdp) offer = json.sdp
          }
        } catch {}
        // Fallback to same-device localStorage
        if (!offer) {
          const offerData = localStorage.getItem("moooves_offer")
          if (!offerData) throw new Error("Room not found - make sure the host created a room first")
          const parsed = JSON.parse(offerData)
          if (parsed.roomCode !== roomCode.toUpperCase()) throw new Error("Invalid room code - please check and try again")
          if (Date.now() - parsed.timestamp > 10 * 60 * 1000) throw new Error("Room code expired - ask the host to create a new room")
          offer = parsed.offer
        }

        const peerConnection = initializePeerConnection()

        // Set remote description
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

        // Create answer
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        // Send answer to backend and fallback to localStorage
        try {
          await fetch("/api/webrtc/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: roomCode.toUpperCase(), sdp: answer }),
          })
        } catch {}
        try {
          localStorage.setItem(
            "moooves_answer",
            JSON.stringify({ answer, forRoomCode: roomCode.toUpperCase(), timestamp: Date.now() }),
          )
        } catch {}

        setState((prev) => ({
          ...prev,
          roomCode: roomCode.toUpperCase(),
        }))

        // Flush buffered ICE to server
        try {
          for (const cand of pendingCandidatesRef.current.splice(0)) {
            await fetch("/api/webrtc/ice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId: roomCode.toUpperCase(), candidate: cand, from: "guest" }),
            })
          }
        } catch {}

        // Process any pending ICE candidates from server/local
        processPendingCandidates()
        pollServerCandidates(roomCode.toUpperCase())

        connectionTimeoutRef.current = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            error: "Connection timeout - failed to connect to host",
          }))
        }, 30 * 1000) // 30 seconds
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
        logDebug('WiFi', { event: 'process-ice-error', error: String(error) })
      }
    }
  }, [state.isHosting])

  const pollServerCandidates = useCallback((roomId: string) => {
    const loop = async () => {
      try {
        const res = await fetch(`/api/webrtc/ice?roomId=${encodeURIComponent(roomId)}&after=${lastIceTimestampRef.current}`)
        if (res.ok) {
          const json = await res.json()
          const candidates = json?.candidates || []
          for (const item of candidates) {
            lastIceTimestampRef.current = Math.max(lastIceTimestampRef.current, item.timestamp || 0)
            if (item?.candidate && peerConnectionRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(item.candidate))
            }
          }
        }
      } catch {}
      // continue polling until connected or component unmounted
      if (peerConnectionRef.current && peerConnectionRef.current.connectionState !== 'connected') {
        setTimeout(loop, 1000)
      }
    }
    loop()
  }, [])

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
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

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
      logDebug('WiFi', { event: 'disconnect-error', error: String(error) })
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

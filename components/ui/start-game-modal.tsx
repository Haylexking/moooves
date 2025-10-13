"use client"

import React, { useState } from "react"
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog"
import { GameButton } from "./game-button"
import { Button } from "@/components/ui/button"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "@/hooks/use-toast"

export function StartGameModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [mode, setMode] = useState<"nearby" | "computer" | "tournament">("nearby")
  const [nearbyFlow, setNearbyFlow] = useState<"choices" | "host" | "join">("choices")
  const [loading, setLoading] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const matchRoom = useMatchRoom()
  const { user } = useAuthStore()

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in to create online matches.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const bluetoothToken = "" // future: generate or capture device token
      const created = await matchRoom.createRoom(bluetoothToken)
      const code = matchRoom.roomCode || (typeof created === 'string' ? created : null)
      toast({ title: "Room created", description: code ? `Room code: ${code}` : `Room created`, variant: "default" })
      onOpenChange(false)
    } catch (err) {
      toast({ title: "Failed to create", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in to join online matches.", variant: "destructive" })
      return
    }
    if (!roomCode) {
      toast({ title: "Missing code", description: "Enter a room code to join.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      await matchRoom.joinRoom(roomCode, "")
      toast({ title: "Joined room", description: `Joined ${roomCode}`, variant: "default" })
      onOpenChange(false)
    } catch (err) {
      toast({ title: "Failed to join", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Game</DialogTitle>
          <DialogDescription>Select how you want to play</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {matchRoom.roomCode && (
            <div className="p-2 bg-white/90 rounded text-center text-sm">Room Code: <strong>{matchRoom.roomCode}</strong></div>
          )}

          <div className="space-y-3">
            <GameButton onClick={() => { setMode('nearby'); setNearbyFlow('choices') }} className="text-lg font-semibold">Play 1v1 (Nearby Multiplayer)</GameButton>
            <GameButton onClick={() => { setMode('computer'); onOpenChange(false); router.push('/game?mode=pc') }} className="text-lg font-semibold">Play vs Computer</GameButton>
            <GameButton onClick={() => { setMode('tournament'); onOpenChange(false); router.push('/tournaments') }} className="text-lg font-semibold">Join Tournament</GameButton>
          </div>

          {/* Nearby multiplayer secondary flows */}
          {mode === 'nearby' && (
            <div className="mt-4">
              {nearbyFlow === 'choices' && (
                <div className="flex flex-col gap-2">
                  <GameButton onClick={async () => {
                    // Host: generate mocked token/code and set into matchRoom state if possible
                    const token = `LOCAL-${Date.now().toString().slice(-6)}`
                    try {
                      // If backend hook supports createRoom with bluetoothToken, call it (mocked)
                      await matchRoom.createRoom(token)
                      toast({ title: 'Hosting', description: `Room token: ${token}`, variant: 'default' })
                      setNearbyFlow('host')
                    } catch (err) {
                      toast({ title: 'Host failed', description: String(err), variant: 'destructive' })
                    }
                  }}>
                    Host Game
                  </GameButton>

                  <GameButton onClick={() => setNearbyFlow('join')}>Join Game</GameButton>
                </div>
              )}

              {nearbyFlow === 'host' && (
                <div className="space-y-2 mt-3">
                  <div className="text-sm">Hosting locally. Share this code with nearby player:</div>
                  <div className="p-2 bg-white/90 rounded text-center font-mono">{matchRoom.roomCode || 'LOCAL-CODE'}</div>
                  <div className="flex gap-2 mt-2">
                    <GameButton onClick={() => { onOpenChange(false); router.push('/game') }}>Start Game (Local)</GameButton>
                    <GameButton variant="pressed" onClick={() => { setNearbyFlow('choices') }}>Cancel</GameButton>
                  </div>
                </div>
              )}

              {nearbyFlow === 'join' && (
                <div className="space-y-2 mt-3">
                  <input value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="Enter local room code" className="w-full px-3 py-2 rounded border" />
                  <div className="flex gap-2">
                    <GameButton onClick={async () => {
                      try {
                        await matchRoom.joinRoom(roomCode, '')
                        toast({ title: 'Joined', description: `Joined ${roomCode}`, variant: 'default' })
                        onOpenChange(false)
                        router.push('/game')
                      } catch (err) {
                        toast({ title: 'Join failed', description: String(err), variant: 'destructive' })
                      }
                    }}>Join</GameButton>
                    <GameButton variant="pressed" onClick={() => setNearbyFlow('choices')}>Back</GameButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StartGameModal

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog"
import { GameButton } from "./game-button"
import { Button } from "@/components/ui/button"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "@/hooks/use-toast"

export function StartGameModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [nearbyFlow, setNearbyFlow] = useState<"main" | "nearby-submenu" | "host" | "join">("main")
  const [loading, setLoading] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const matchRoom = useMatchRoom()
  const { user } = useAuthStore()

  const handleClose = (v: boolean) => {
    if (!v) {
      setNearbyFlow("main")
      setRoomCode("")
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start Game</DialogTitle>
          <DialogDescription>Select how you want to play</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {nearbyFlow === "main" && (
            <div className="space-y-3">
              <GameButton onClick={() => setNearbyFlow("nearby-submenu")} className="w-full text-lg font-semibold">
                Play 1v1
              </GameButton>
              <GameButton
                onClick={() => {
                  handleClose(false)
                  router.push("/game?mode=ai")
                }}
                className="w-full text-lg font-semibold"
              >
                Player vs Computer
              </GameButton>
              <GameButton
                onClick={() => {
                  handleClose(false)
                  router.push("/tournaments")
                }}
                className="w-full text-lg font-semibold"
              >
                Join Tournament
              </GameButton>
            </div>
          )}

          {nearbyFlow === "nearby-submenu" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-2">Choose connection method:</p>
              <GameButton
                onClick={async () => {
                  setLoading(true)
                  try {
                    // Mock 2-second connection delay
                    await new Promise((resolve) => setTimeout(resolve, 2000))
                    const token = `WIFI-${Date.now().toString().slice(-6)}`
                    await matchRoom.createRoom(token)
                    toast({ title: "Connected via Wi-Fi", description: `Room: ${token}`, variant: "default" })
                    setNearbyFlow("host")
                  } catch (err) {
                    toast({ title: "Connection failed", description: String(err), variant: "destructive" })
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Connecting..." : "Nearby (Wi-Fi)"}
              </GameButton>
              <GameButton
                onClick={async () => {
                  setLoading(true)
                  try {
                    // Mock 2-second connection delay
                    await new Promise((resolve) => setTimeout(resolve, 2000))
                    const token = `BT-${Date.now().toString().slice(-6)}`
                    await matchRoom.createRoom(token)
                    toast({ title: "Connected via Bluetooth", description: `Room: ${token}`, variant: "default" })
                    setNearbyFlow("host")
                  } catch (err) {
                    toast({ title: "Connection failed", description: String(err), variant: "destructive" })
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Connecting..." : "Nearby (Bluetooth)"}
              </GameButton>
              <GameButton variant="pressed" onClick={() => setNearbyFlow("main")} className="w-full">
                Back
              </GameButton>
            </div>
          )}

          {nearbyFlow === "host" && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700">Share this code with nearby player:</div>
              <div className="p-3 bg-green-100 rounded-lg text-center font-mono text-lg font-bold">
                {matchRoom.roomCode || "ROOM-CODE"}
              </div>
              <div className="flex gap-2">
                <GameButton
                  onClick={() => {
                    handleClose(false)
                    router.push("/game?mode=p2p")
                  }}
                  className="flex-1"
                >
                  Start Game
                </GameButton>
                <GameButton variant="pressed" onClick={() => setNearbyFlow("main")} className="flex-1">
                  Cancel
                </GameButton>
              </div>
            </div>
          )}

          {nearbyFlow === "join" && (
            <div className="space-y-3">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter room code"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-2">
                <GameButton
                  onClick={async () => {
                    if (!roomCode) {
                      toast({ title: "Missing code", description: "Enter a room code", variant: "destructive" })
                      return
                    }
                    setLoading(true)
                    try {
                      await matchRoom.joinRoom(roomCode, "")
                      toast({ title: "Joined", description: `Joined ${roomCode}`, variant: "default" })
                      handleClose(false)
                      router.push("/game?mode=p2p")
                    } catch (err) {
                      toast({ title: "Join failed", description: String(err), variant: "destructive" })
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Joining..." : "Join"}
                </GameButton>
                <GameButton variant="pressed" onClick={() => setNearbyFlow("nearby-submenu")} className="flex-1">
                  Back
                </GameButton>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StartGameModal

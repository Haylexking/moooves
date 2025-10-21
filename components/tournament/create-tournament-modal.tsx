"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/stores/auth-store"

interface CreateTournamentModalProps {
  open: boolean
  onClose: () => void
}

export function CreateTournamentModal({ open, onClose }: CreateTournamentModalProps) {
  const [name, setName] = useState("")
  const [entryFee, setEntryFee] = useState(500)
  const [maxPlayers, setMaxPlayers] = useState(50)
  const [startTimeLocal, setStartTimeLocal] = useState<string>("")
  const { createTournament, isLoading } = useTournamentStore()
  const { user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (entryFee < 500) {
      alert("Minimum entry fee is ₦500")
      return
    }

    try {
      // Require a start time; default to 24h in the future if not set
      const selected = startTimeLocal
        ? new Date(startTimeLocal)
        : new Date(Date.now() + 24 * 60 * 60 * 1000)
      const startTimeISO = selected.toISOString()
      const tournament = await createTournament({
        name,
        entryFee,
        maxPlayers,
        gameMode: "timed",
        // organizerId + startTime per Swagger
        ...(user?.id ? ({ organizerId: user.id } as any) : {}),
        startTime: startTimeISO,
      })

      // UX: inform the user and navigate to the tournament page
      toast({ title: "Tournament created", description: `Tournament \"${tournament.name}\" created.` })
      onClose()
      // Reset form
      setName("")
      setEntryFee(500)
      setMaxPlayers(50)

      // Redirect to tournament view
      router.push(`/tournament/${tournament.id}`)
    } catch (error) {
      console.error("Failed to create tournament:", error)
      toast({ title: "Failed to create tournament", description: String(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setup Tournament</DialogTitle>
          {/* Provide an accessible description for the dialog content per Radix recommendations */}
          <DialogDescription className="sr-only">
            Create a new tournament by providing a name, entry fee, and max players. This dialog will create a tournament and navigate to its page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tournament name"
              required
            />
          </div>

          <div>
            <Label htmlFor="entryFee">Entry Fee (₦)</Label>
            <Input
              id="entryFee"
              type="number"
              min={500}
              value={entryFee}
              onChange={(e) => setEntryFee(Number(e.target.value))}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum ₦500</p>
          </div>

          <div>
            <Label htmlFor="maxPlayers">Maximum Players</Label>
            <Input
              id="maxPlayers"
              type="number"
              min={6}
              max={50}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Between 6-50 players</p>
          </div>

          <div>
            <Label htmlFor="startTime">Start Time (UTC)</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTimeLocal}
              onChange={(e) => setStartTimeLocal(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Set a future date/time. Will be sent as UTC ISO.</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>Game Duration:</strong> 10 minutes (Timed Mode)
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Create Tournament"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

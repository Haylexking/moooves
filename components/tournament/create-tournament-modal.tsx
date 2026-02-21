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

const toLocalInputValue = (date: Date) => date.toISOString().slice(0, 16)

export function CreateTournamentModal({ open, onClose }: CreateTournamentModalProps) {
  const [name, setName] = useState("")
  const [entryFee, setEntryFee] = useState(500)
  const [maxPlayers, setMaxPlayers] = useState(50)
  const [startTimeLocal, setStartTimeLocal] = useState<string>(toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)))
  const { createTournament, isLoading } = useTournamentStore()
  const { user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // if (entryFee < 500) {
    //   toast({ title: "Entry fee too low", description: "Minimum entry fee is NGN 500.", variant: "destructive" })
    //   return
    // }

    if (!user?.id) {
      toast({ title: "Error", description: "You must be logged in to create a tournament.", variant: "destructive" })
      return
    }

    try {
      const selected = startTimeLocal ? new Date(startTimeLocal) : new Date(Date.now() + 24 * 60 * 60 * 1000)

      if (selected < new Date()) {
        toast({ title: "Invalid Date", description: "Tournament start time cannot be in the past.", variant: "destructive" })
        return
      }

      const startTimeISO = selected.toISOString()
      const payload = {
        name,
        entryFee,
        maxPlayers,
        organizerId: user.id,
        startTime: startTimeISO,
      }
      const tournament = await createTournament(payload)

      toast({ title: "Tournament created", description: `${tournament.name} scheduled successfully.` })
      onClose()
      setName("")
      setEntryFee(500)
      setMaxPlayers(50)
      setStartTimeLocal(toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)))
      router.push(`/tournaments/${tournament.id}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
      toast({ title: "Failed to create tournament", description: errorMessage, variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Tournament</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Set the name, entry fee, capacity, and start time. Players can join up until the scheduled start.
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
            <Label htmlFor="entryFee">Entry Fee (NGN)</Label>
            <Input
              id="entryFee"
              type="number"
              min={500}
              value={entryFee}
              onChange={(e) => setEntryFee(Number(e.target.value))}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum NGN 500</p>
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
            <Label htmlFor="startTime">Scheduled Start (local time)</Label>
            <Input
              id="startTime"
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              value={startTimeLocal}
              onChange={(e) => setStartTimeLocal(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Sent to the backend as UTC. Hosts can reschedule later.</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            <p><strong>Note:</strong> Hosts can start early or extend the start time if player count is low.</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Scheduling..." : "Create Tournament"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

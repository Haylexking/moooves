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
import { apiClient } from "@/lib/api/client"

interface CreateTournamentModalProps {
  open: boolean
  onClose: () => void
}

const toLocalInputValue = (date: Date) => date.toISOString().slice(0, 16)

export function CreateTournamentModal({ open, onClose }: CreateTournamentModalProps) {
  const [name, setName] = useState("")
  const [tournamentType, setTournamentType] = useState<"paid" | "free">("paid")
  const [entryFee, setEntryFee] = useState(500)
  const [maxPlayers, setMaxPlayers] = useState(50)
  const [startTimeLocal, setStartTimeLocal] = useState<string>(toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)))
  const { createTournament, isLoading } = useTournamentStore()
  const { user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()

  const dynamicMinFee = Math.ceil(20000 / maxPlayers / 500) * 500;

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
        entryFee: tournamentType === "free" ? 0 : entryFee,
        maxPlayers,
        organizerId: user.id,
        startTime: startTimeISO,
        type: tournamentType,
      }
      const tournament = await createTournament(payload)

      if (tournamentType === "free") {
        toast({ title: "Redirecting to Payment", description: "You will be redirected to pay the ₦10,000 Host fee." })

        const paymentRes = await apiClient.initWalletTransaction({
          amount: 10000,
          method: "flutterwave",
          email: user.email,
          name: user.fullName || "Moooves Host",
          userId: user.id,
          tournamentId: tournament.id,
          redirectUrl: `${window.location.origin}/tournaments/${tournament.id}?payment=success`,
        })

        if (paymentRes.success && paymentRes.data?.payment_link) {
          window.location.href = paymentRes.data.payment_link
          return // Stop further execution, let redirect happen
        } else {
          toast({ title: "Payment Initialization Failed", description: "Could not redirect to gateway. Tournament is pending.", variant: "destructive" })
        }
      }

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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white text-gray-900 shadow-xl border-gray-100">
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
            <Label>Tournament Type</Label>
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 mt-2">
              <button
                type="button"
                onClick={() => setTournamentType("paid")}
                className={`flex-1 py-2.5 text-sm font-bold uppercase rounded-md transition-all duration-300 ${tournamentType === "paid"
                    ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white"
                  }`}
              >
                Paid Entry
              </button>
              <button
                type="button"
                onClick={() => setTournamentType("free")}
                className={`flex-1 py-2.5 text-sm font-bold uppercase rounded-md transition-all duration-300 ${tournamentType === "free"
                    ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white"
                  }`}
              >
                Free to Play
              </button>
            </div>
            {tournamentType === "free" && (
              <div className="mt-3 text-sm text-yellow-700 bg-yellow-50 p-3 border border-yellow-200 rounded-md">
                <p><strong>Host Fee: ₦10,000.</strong> You will be redirected to pay. Players will join for <strong>free</strong>.</p>
              </div>
            )}
            {tournamentType === "paid" && (
              <p className="mt-2 text-xs text-gray-500">Players will pay the entry fee below to join.</p>
            )}
          </div>

          {tournamentType === "paid" && (
            <div>
              <Label htmlFor="entryFee">Entry Fee (NGN) per Player</Label>
              <Input
                id="entryFee"
                type="number"
                min={dynamicMinFee}
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                required={tournamentType === "paid"}
              />
              <p className="text-xs text-amber-600 mt-1 font-medium">
                Minimum NGN {dynamicMinFee.toLocaleString()} to guarantee ₦20,000 prize pool.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="maxPlayers">Maximum Players</Label>
            <Input
              id="maxPlayers"
              type="number"
              min={6}
              max={50}
              value={maxPlayers}
              onChange={(e) => {
                const newMax = Number(e.target.value)
                setMaxPlayers(newMax)
                const newMinFee = Math.ceil(20000 / newMax / 500) * 500
                if (tournamentType === "paid" && entryFee < newMinFee) {
                  setEntryFee(newMinFee)
                }
              }}
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

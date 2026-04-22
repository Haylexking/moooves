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
import type { TournamentCreationResponse } from "@/lib/types"

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
  const [isCreating, setIsCreating] = useState(false)
  const { user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()

  const dynamicMinFee = Math.ceil(20000 / maxPlayers / 500) * 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
        organizerId: user.id,
        name,
        maxPlayers,
        ...(tournamentType === "paid" ? { entryFee } : {}),
        tournamentType,
        startTime: startTimeISO,
      }
      
      setIsCreating(true)
      
      // Show progress toast
      toast({ title: "Creating Tournament", description: "Setting up your tournament..." })
      
      const response = await apiClient.createTournament({
        name,
        organizerId: user.id,
        startTime: startTimeISO,
        maxPlayers,
        entryFee: tournamentType === "paid" ? entryFee : undefined,
        type: tournamentType
      }) as TournamentCreationResponse

      if (tournamentType === "free") {
        // Free tournament: Response 200 - Host payment required
        if (response.data?.paymentRequired && response.data?.paymentType === "host") {
          toast({ title: "Payment Required", description: "Redirecting to payment for host fee..." })

          // Store host payment context so the unified payment-return page knows this is a host flow
          localStorage.setItem("pending_host_payment", JSON.stringify({
            tournamentId: response.data.tournamentId,
          }))

          const paymentRes = await apiClient.initWalletTransaction({
            amount: response.data.amount || 15000,
            method: "flutterwave",
            email: user.email,
            name: user.fullName || "Moooves Host",
            userId: user.id,
            tournamentId: response.data.tournamentId,
            redirectUrl: `${window.location.origin}/payment-return`,
          })

          if (paymentRes.success && paymentRes.data?.payment_link) {
            window.location.href = paymentRes.data.payment_link
            return // Stop further execution, let redirect happen
          } else {
            localStorage.removeItem("pending_host_payment")
            toast({ title: "Payment Failed", description: "Could not initialize payment. Please try again.", variant: "destructive" })
          }
        } else {
          toast({ title: "Unexpected Response", description: "Tournament created but payment flow not initiated.", variant: "destructive" })
        }
      } else {
        // Paid tournament: Response 201 - Created successfully
        if (response.data?.tournament) {
          toast({ title: "Tournament Created!", description: `${response.data.tournament.name} scheduled successfully. Players will pay NGN${entryFee} to join.` })
          onClose()
          setName("")
          setEntryFee(500)
          setMaxPlayers(50)
          setStartTimeLocal(toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)))
          router.push(`/tournaments/${response.data.tournament.id}`)
        } else {
          toast({ title: "Tournament Created", description: "Tournament scheduled successfully!" })
          onClose()
          router.push("/host-dashboard")
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred."
      toast({ title: "Failed to Create Tournament", description: errorMessage, variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] bg-white text-gray-900 shadow-xl border-gray-100 flex flex-col">
        {/* Sticky Header */}
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle>Schedule Tournament</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Set the name, entry fee, capacity, and start time. Players can join up until the scheduled start.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 px-2">
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
                  <p><strong>Host Fee: ₦15,000.</strong> You will be redirected to pay. Players will join for <strong>free</strong>.</p>
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

            {/* Form Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="flex-1">
              {isCreating ? "Creating..." : "Create Tournament"}
            </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

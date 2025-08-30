"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import type { GameMode } from "@/lib/types"

interface CreateTournamentModalProps {
  open: boolean
  onClose: () => void
}

export function CreateTournamentModal({ open, onClose }: CreateTournamentModalProps) {
  const [name, setName] = useState("")
  const [entryFee, setEntryFee] = useState(1000)
  const [maxPlayers, setMaxPlayers] = useState(10)
  const [gameMode, setGameMode] = useState<GameMode>("timed")
  const { createTournament, isLoading } = useTournamentStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTournament({
        name,
        entryFee,
        maxPlayers,
        gameMode,
      })
      onClose()
      // Reset form
      setName("")
      setEntryFee(1000)
      setMaxPlayers(10)
      setGameMode("timed")
    } catch (error) {
      console.error("Failed to create tournament:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
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
              min={1000}
              value={entryFee}
              onChange={(e) => setEntryFee(Number(e.target.value))}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum ₦1,000</p>
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
            <Label htmlFor="gameMode">Game Mode</Label>
            <Select value={gameMode} onValueChange={(value: GameMode) => setGameMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timed">Timed (10 minutes)</SelectItem>
                <SelectItem value="full-grid">Full Grid</SelectItem>
              </SelectContent>
            </Select>
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

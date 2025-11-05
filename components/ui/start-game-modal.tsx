"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog"
import { GameButton } from "./game-button"
import { useAuthStore } from "@/lib/stores/auth-store"

export function StartGameModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const { user } = useAuthStore()

  const handleClose = (v: boolean) => {
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(92vw,44rem)] max-w-none sm:max-w-[44rem] bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-600 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-green-900">Start Game</DialogTitle>
          <DialogDescription className="text-green-700">Select how you want to play</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <GameButton
              onClick={() => {
                router.push("/game?mode=ai")
                onOpenChange(false)
              }}
              className="w-full text-lg font-bold py-6"
            >
              Player vs Computer
            </GameButton>
            <GameButton
              onClick={() => {
                router.push("/tournaments")
                onOpenChange(false)
              }}
              className="w-full text-lg font-bold py-6"
            >
              Join Tournament
            </GameButton>
            <GameButton
              onClick={() => {
                router.push("/tournaments/create")
                onOpenChange(false)
              }}
              className={`w-full text-lg font-bold py-6 ${(!user || user.gamesPlayed < 3) ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={!user || user.gamesPlayed < 3}
            >
              Create Tournament
            </GameButton>
            {(!user || user.gamesPlayed < 3) && (
              <p className="text-sm text-gray-700 text-center mt-2">
                You need to participate in at least 3 games to create a tournament.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StartGameModal

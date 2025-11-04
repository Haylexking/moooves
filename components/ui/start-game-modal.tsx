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
              Play vs Computer
            </GameButton>
            <GameButton
              onClick={() => {
                router.push("/tournaments")
                onOpenChange(false)
              }}
              className="w-full text-lg font-bold py-6"
              disabled={user.tournamentsParticipated < 3}
            >
              Join Tournament
            </GameButton>
            {user.tournamentsParticipated < 3 && (
              <div className="text-sm text-red-300 text-center bg-red-900/30 rounded-lg p-3 border border-red-500/30">
                <p>You need to participate in at least 3 tournaments to join one.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StartGameModal

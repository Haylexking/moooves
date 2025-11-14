"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog"
import { GameButton } from "./game-button"
import { useAuthStore } from "@/lib/stores/auth-store"

export function StartGameModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isRouting, setIsRouting] = useState(false)

  const handleClose = (v: boolean) => {
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(92vw,44rem)] max-w-none sm:max-w-[44rem] bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-600 overflow-hidden">
        {isRouting ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-700" />
            <p className="mt-4 text-green-800 font-semibold">Launching game…</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-green-900">Start Game</DialogTitle>
              <DialogDescription className="text-green-700">Select how you want to play</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <GameButton
                  onClick={() => {
                    setIsRouting(true)
                    // Keep dialog open to show loading overlay during navigation, then replace route
                    setTimeout(() => {
                      try { router.replace("/game?mode=ai") } catch { router.push("/game?mode=ai") }
                    }, 50)
                  }}
                  className="w-full text-lg font-bold py-6"
                >
                  Player vs Computer
                </GameButton>
                <GameButton
                  onClick={() => {
                    setIsRouting(true)
                    setTimeout(() => { router.push("/tournaments") }, 50)
                  }}
                  className="w-full text-lg font-bold py-6"
                >
                  Join Tournament
                </GameButton>
                <GameButton
                  onClick={() => {
                    setIsRouting(true)
                    setTimeout(() => { router.push("/tournaments/create") }, 50)
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default StartGameModal

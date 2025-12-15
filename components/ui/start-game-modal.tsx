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

  const navigateWithLoader = (href: string, replace = false) => {
    setIsRouting(true)
    setTimeout(() => {
      if (replace) {
        try {
          router.replace(href)
          return
        } catch { }
      }
      router.push(href)
    }, 60)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-[44rem] mx-auto bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-600 rounded-2xl sm:rounded-3xl overflow-hidden p-0">
        {isRouting ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-700" />
            <p className="mt-4 text-green-800 font-semibold">Launching game…</p>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="text-2xl font-black text-green-900">Start Game</DialogTitle>
              <DialogDescription className="text-green-700">Select how you want to play</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4 py-4 px-4 sm:px-6 pb-6">
              <GameButton
                onClick={() => navigateWithLoader("/live-1on1")}
                className="w-full text-base sm:text-lg font-bold py-4 sm:py-6 rounded-xl sm:rounded-2xl"
              >
                Play 1-on-1 Live
              </GameButton>
              <GameButton
                onClick={() => navigateWithLoader("/game?mode=ai", true)}
                className="w-full text-base sm:text-lg font-bold py-4 sm:py-6 rounded-xl sm:rounded-2xl"
              >
                Player vs Computer
              </GameButton>
              <GameButton
                onClick={() => navigateWithLoader("/tournaments")}
                className="w-full text-base sm:text-lg font-bold py-4 sm:py-6 rounded-xl sm:rounded-2xl"
              >
                Join Tournament
              </GameButton>
              <GameButton
                onClick={() => navigateWithLoader("/tournaments/create")}
                className={`w-full text-base sm:text-lg font-bold py-4 sm:py-6 rounded-xl sm:rounded-2xl ${(!user || (user.gamesPlayed ?? 0) < 3) ? "opacity-70 cursor-not-allowed" : ""}`}
                disabled={!user || (user.gamesPlayed ?? 0) < 3}
              >
                Create Tournament
              </GameButton>
              {(!user || (user.gamesPlayed ?? 0) < 3) && (
                <p className="text-sm text-gray-700 text-center">
                  You need to participate in at least 3 games to create a tournament.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default StartGameModal

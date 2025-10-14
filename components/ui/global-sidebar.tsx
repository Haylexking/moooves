"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, Gamepad2, Trophy, BarChart3, Wallet, HelpCircle, LogOut } from "lucide-react"
import { GameButton } from "./game-button"
import { useGameStore } from "@/lib/stores/game-store"

const menuItems = [
  { icon: Gamepad2, label: "Play game", href: "/dashboard" },
  { icon: Trophy, label: "Tournament", href: "/tournaments" },
  { icon: BarChart3, label: "Statistics", href: "/stats" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: HelpCircle, label: "Need help", href: "/help" },
]

export function GlobalSidebar() {
  const [open, setOpen] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const router = useRouter()
  const gameStatus = useGameStore((state) => state.gameStatus)

  const handleExitGame = () => {
    setShowExitModal(true)
  }

  const confirmExit = () => {
    // Clean up game state
    const gameStore = useGameStore.getState()
    if (gameStore.endGame) {
      gameStore.endGame()
    }
    // Reset to initial state
    if (gameStore.initializeGame) {
      gameStore.initializeGame("timed")
    }
    setShowExitModal(false)
    setOpen(false)
    // Navigate to onboarding/dashboard
    router.push("/dashboard")
  }

  const cancelExit = () => {
    setShowExitModal(false)
  }

  return (
    <>
      {!open && (
        <button
          className="fixed top-4 sm:top-6 left-4 sm:left-6 z-50 bg-white/90 rounded-lg shadow-lg flex items-center gap-2 px-3 sm:px-4 py-2 font-semibold text-sm sm:text-base text-gray-800 hover:bg-white transition-colors"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          Menu
        </button>
      )}

      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {open && (
        <aside className="fixed left-0 top-0 h-full w-56 sm:w-64 bg-black/40 backdrop-blur-sm z-50 transform transition-transform duration-300 translate-x-0">
          <div className="p-3 sm:p-4 space-y-2">
            {/* Collapse Button */}
            <button
              className="flex items-center gap-2 sm:gap-3 w-full p-2 sm:p-3 rounded-lg bg-white/90 text-gray-800 text-sm sm:text-base font-semibold hover:bg-green-100 hover:text-green-800 transition-colors"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              Collapse
            </button>

            {/* Menu Items */}
            {menuItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-2 sm:gap-3 w-full p-2 sm:p-3 rounded-lg font-semibold text-sm sm:text-base transition-colors bg-white/90 text-gray-800 hover:bg-green-100 hover:text-green-800"
                onClick={() => {
                  setOpen(false)
                  router.push(item.href)
                }}
              >
                {item.icon && React.createElement(item.icon, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
                {item.label}
              </button>
            ))}

            <button
              className="flex items-center gap-2 sm:gap-3 w-full p-2 sm:p-3 rounded-lg font-semibold text-sm sm:text-base transition-colors bg-white/90 text-gray-800 hover:bg-green-100 hover:text-green-800"
              onClick={handleExitGame}
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              Exit game
            </button>
          </div>
        </aside>
      )}

      {showExitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-green-100/95 border-4 border-green-600 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            {/* Close button */}
            <button
              onClick={cancelExit}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal content */}
            <div className="text-center space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-green-900">Do you want to exit game?</h2>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <GameButton onClick={confirmExit} className="flex-1">
                  Yes, continue
                </GameButton>
                <GameButton onClick={cancelExit} variant="pressed" className="flex-1 bg-gray-500 hover:bg-gray-600">
                  No, cancel
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

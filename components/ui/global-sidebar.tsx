"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, Gamepad2, Trophy, BarChart3, Wallet, HelpCircle, LogOut, Settings } from "lucide-react"
import { GameButton } from "./game-button"
import { useGameStore } from "@/lib/stores/game-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useGlobalSidebarStore } from "@/lib/stores/global-sidebar-store"
import { SettingsModal } from "@/components/settings/settings-modal"

const menuItems = [
  { icon: Gamepad2, label: "Play game", href: "/dashboard" },
  { icon: Trophy, label: "Tournament", href: "/tournaments" },
  { icon: BarChart3, label: "Statistics", href: "/stats" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: Settings, label: "Settings", href: "#settings" },
  { icon: HelpCircle, label: "Need help", href: "/help" },
]

interface GlobalSidebarProps {
  showTrigger?: boolean
}

export function GlobalSidebar({ showTrigger = true }: GlobalSidebarProps) {
  const open = useGlobalSidebarStore((state) => state.open)
  const setOpen = useGlobalSidebarStore((state) => state.setOpen)
  const [showExitModal, setShowExitModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
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
    // Also log user out to clear auth state and tokens
    try {
      const storeApi: any = (useAuthStore as any)
      if (storeApi && typeof storeApi.getState === 'function') {
        const state = storeApi.getState()
        if (state && typeof state.logout === 'function') state.logout()
      }
    } catch { }
    // Navigate to onboarding
    router.push("/onboarding")
  }

  const cancelExit = () => {
    setShowExitModal(false)
  }

  return (
    <>
      {showTrigger && !open && (
        <button
          className="fixed top-4 left-4 z-50 bg-white/90 rounded-lg shadow-lg flex items-center gap-2 px-4 py-3 font-semibold text-base text-gray-800 hover:bg-white transition-colors active:scale-95 touch-manipulation"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          Menu
        </button>
      )}

      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {open && (
        <aside className="fixed left-0 top-0 h-full w-[85vw] sm:w-64 bg-black/40 backdrop-blur-sm z-50 transform transition-transform duration-300 translate-x-0 border-r border-white/10">
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
                  if (item.href === "#settings") {
                    setShowSettings(true)
                  } else {
                    router.push(item.href)
                  }
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

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}

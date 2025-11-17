"use client"


import { Wallet, User, Bell, Menu } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getUserDisplayName } from "@/lib/utils/display-name"
import { useGlobalSidebarStore } from "@/lib/stores/global-sidebar-store"

interface TopNavigationProps {
  balance?: number
  username?: string
}

export function TopNavigation({ balance, username }: TopNavigationProps) {
  const { user } = useAuthStore()
  const setSidebarOpen = useGlobalSidebarStore((state) => state.setOpen)

  // Use props or fallback to user data
  const displayUsername = username ?? getUserDisplayName(user ?? undefined)
  const displayBalance = balance

  return (
    <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-40 flex items-center justify-between gap-3">
      <button
        className="flex items-center gap-2 bg-white rounded-lg px-4 h-12 font-semibold text-gray-800 shadow hover:bg-gray-50 transition-colors"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="w-5 h-5" />
        <span className="text-sm sm:text-base">Menu</span>
      </button>

    <div className="flex items-center gap-3 sm:gap-4">
      {typeof displayBalance === 'number' && (
        <div className="flex h-12 items-center gap-2 bg-white rounded-lg px-4 font-bold text-green-800 shadow">
          <Wallet className="w-5 h-5" />
          {displayBalance.toLocaleString()}
          <span className="ml-1 text-green-800 font-bold">₦</span>
          <span className="ml-2 text-green-600 font-bold">+</span>
        </div>
      )}

      <div className="flex h-12 items-center gap-2 bg-white rounded-lg px-4 font-semibold text-green-800 shadow">
        <User className="w-5 h-5" />
        <span className="text-sm sm:text-base leading-none">{displayUsername}</span>
      </div>

      <button
        className="bg-white rounded-lg h-12 px-4 flex items-center gap-2 shadow hover:bg-gray-50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-green-800" />
      </button>
    </div>
    </div>
  )
}

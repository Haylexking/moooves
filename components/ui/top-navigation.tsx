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
    <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-40 flex items-center justify-between gap-2 sm:gap-3 pointer-events-none">
      <div className="pointer-events-auto">
        <button
          className="flex items-center gap-2 bg-white rounded-lg px-3 sm:px-4 h-10 sm:h-12 font-semibold text-gray-800 shadow hover:bg-gray-50 transition-colors active:scale-95 touch-manipulation"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
          <span className="hidden xs:inline text-sm sm:text-base">Menu</span>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto">
        {typeof displayBalance === 'number' && (
          <div className="flex h-10 sm:h-12 items-center gap-1 sm:gap-2 bg-white rounded-lg px-2 sm:px-4 font-bold text-green-800 shadow text-sm sm:text-base">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            {displayBalance.toLocaleString()}
            <span className="ml-0.5 sm:ml-1 text-green-800 font-bold">₦</span>
            <span className="hidden sm:inline ml-2 text-green-600 font-bold">+</span>
          </div>
        )}

        <div className="flex h-10 sm:h-12 items-center gap-2 bg-white rounded-lg px-3 sm:px-4 font-semibold text-green-800 shadow max-w-[120px] sm:max-w-none">
          <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="text-sm sm:text-base leading-none truncate max-w-[100px] sm:max-w-[200px]">{displayUsername}</span>
        </div>

        <button
          className="bg-white rounded-lg h-10 sm:h-12 px-3 sm:px-4 flex items-center gap-2 shadow hover:bg-gray-50 transition-colors active:scale-95 touch-manipulation"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-green-800" />
        </button>
      </div>
    </div>
  )
}

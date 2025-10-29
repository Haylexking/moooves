"use client"


import { Wallet, User, Bell, Settings } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getUserDisplayName } from "@/lib/utils/display-name"

interface TopNavigationProps {
  balance?: number
  username?: string
}

export function TopNavigation({ balance, username }: TopNavigationProps) {
  const { user } = useAuthStore()

  // Use props or fallback to user data
  const displayUsername = username || (user ? getUserDisplayName(user) : "Unknown User")
  const displayBalance = balance

  return (
    <div className="fixed top-6 right-6 z-40 flex gap-4">
      {typeof displayBalance === 'number' && (
        <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 font-bold text-green-800 shadow">
          <Wallet className="w-5 h-5 mr-1" />
          {displayBalance.toLocaleString()}
          <span className="ml-1 text-green-800 font-bold">₦</span>
          <span className="ml-2 text-green-600 font-bold">+</span>
        </div>
      )}

      <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 font-bold text-green-800 shadow">
        <User className="w-5 h-5 mr-1" />
        {displayUsername}
      </div>

      <button className="bg-white rounded-lg p-2 shadow hover:bg-gray-50 transition-colors">
        <Bell className="w-5 h-5 text-green-800" />
      </button>

      <button className="bg-white rounded-lg p-2 shadow hover:bg-gray-50 transition-colors">
        <Settings className="w-5 h-5 text-green-800" />
      </button>
    </div>
  )
}

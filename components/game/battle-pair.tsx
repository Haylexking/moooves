"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Menu, Settings, User, Plus, Bell } from "lucide-react"

interface BattlePairProps {
  player1?: string
  player2?: string
  onMatchStart?: () => void
}

export function BattlePair({ player1 = "USER 002", player2 = "USER 004", onMatchStart }: BattlePairProps) {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      // Auto-start match after countdown
      setTimeout(() => {
        onMatchStart?.()
      }, 1000)
    }
  }, [countdown, onMatchStart])

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Dashboard Background */}
      <Image
        src="/images/dashboard-background.png"
        alt="Dashboard Background"
        fill
        className="object-cover object-center z-0"
        priority
      />

      {/* Top Header */}
      <div className="relative z-20 flex items-center justify-between p-4">
        {/* Menu Button */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-white transition-colors shadow-lg">
          <Menu className="w-5 h-5" />
          Menu
        </button>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          {/* Balance */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-lg">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs">₦</span>
            </div>
            100,000
            <Plus className="w-4 h-4" />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-lg">
            <User className="w-5 h-5" />
            USER 002
          </div>

          {/* Notification Bell */}
          <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/90 text-gray-800 hover:bg-white transition-colors shadow-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Versus Display */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-8">
            {/* Player 1 */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-800">{player1}</h3>
            </div>

            {/* VS */}
            <div className="text-center">
              <h2 className="text-4xl font-bold text-green-800 mb-2">Versus</h2>
              {countdown > 0 && <div className="text-2xl font-bold text-green-600">Starting in {countdown}...</div>}
            </div>

            {/* Player 2 */}
            <div className="text-center">
              <div className="w-24 h-24 bg-green-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-800">{player2}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

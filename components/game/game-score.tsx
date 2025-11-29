"use client"

import { cn } from "@/lib/utils"

interface GameScoreProps {
  player1: string
  player2: string
  scoreX: number
  scoreO: number
  currentPlayer: "X" | "O"
  gameStatus: string
  gameMode: string
}

export function GameScore({ player1, player2, scoreX, scoreO, currentPlayer, gameStatus, gameMode }: GameScoreProps) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase()

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative flex items-center justify-between bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 px-4 py-3 sm:px-8 sm:py-4">
        {/* Player 1 (X) */}
        <div className={cn(
          "flex items-center gap-3 sm:gap-4 transition-all duration-300",
          currentPlayer === "X" && gameStatus === "playing" ? "opacity-100 scale-105" : "opacity-70"
        )}>
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg ring-2 ring-white/50">
              {getInitials(player1)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-[10px] font-black text-blue-600">X</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-gray-800 max-w-[80px] sm:max-w-[120px] truncate">
              {player1}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-blue-600 leading-none">
              {scoreX}
            </span>
          </div>
        </div>

        {/* VS / Status */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="text-xs font-black text-gray-300 tracking-widest">VS</div>
        </div>

        {/* Player 2 (O) */}
        <div className={cn(
          "flex items-center gap-3 sm:gap-4 flex-row-reverse text-right transition-all duration-300",
          currentPlayer === "O" && gameStatus === "playing" ? "opacity-100 scale-105" : "opacity-70"
        )}>
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg ring-2 ring-white/50">
              {gameMode === "player-vs-computer" ? "AI" : getInitials(player2)}
            </div>
            <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-[10px] font-black text-red-600">O</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm sm:text-base font-bold text-gray-800 max-w-[80px] sm:max-w-[120px] truncate">
              {player2}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-red-600 leading-none">
              {scoreO}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

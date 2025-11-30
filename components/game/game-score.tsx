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
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-0">
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        {/* Player 1 (X) Card */}
        <div className={cn(
          "flex-1 relative flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all duration-300",
          "bg-white/95 backdrop-blur-sm shadow-xl",
          currentPlayer === "X" && gameStatus === "playing"
            ? "border-blue-500 ring-2 ring-blue-500/20 scale-[1.02]"
            : "border-white/20 opacity-90"
        )}>
          <div className="relative flex-none">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg ring-2 ring-white/50">
              {getInitials(player1)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-[10px] font-black text-blue-600">X</span>
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider truncate">
              {player1}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-600 leading-none">
                {scoreX}
              </span>
              {currentPlayer === "X" && gameStatus === "playing" && (
                <span className="text-[10px] sm:text-xs font-bold text-blue-500 animate-pulse">
                  Your Turn
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Player 2 (O) Card */}
        <div className={cn(
          "flex-1 relative flex items-center flex-row-reverse gap-3 p-3 sm:p-4 rounded-2xl border transition-all duration-300",
          "bg-white/95 backdrop-blur-sm shadow-xl",
          currentPlayer === "O" && gameStatus === "playing"
            ? "border-red-500 ring-2 ring-red-500/20 scale-[1.02]"
            : "border-white/20 opacity-90"
        )}>
          <div className="relative flex-none">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg ring-2 ring-white/50">
              {gameMode === "player-vs-computer" ? "AI" : getInitials(player2)}
            </div>
            <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-[10px] font-black text-red-600">O</span>
            </div>
          </div>
          <div className="flex flex-col items-end min-w-0">
            <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider truncate">
              {player2}
            </span>
            <div className="flex items-baseline gap-2 flex-row-reverse">
              <span className="text-2xl sm:text-3xl font-black text-red-600 leading-none">
                {scoreO}
              </span>
              {currentPlayer === "O" && gameStatus === "playing" && (
                <span className="text-[10px] sm:text-xs font-bold text-red-500 animate-pulse">
                  Thinking
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

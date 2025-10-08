"use client"

import { User } from "lucide-react"

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
  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-white/90 shadow-lg px-4 py-3 border-2 border-green-700/40">
      {/* Responsive: stack on small screens, inline on md+ */}
      <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
        {/* Player 1 block */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-blue-900 truncate">
              {player1} <span className="text-xs text-blue-500">(X)</span>
            </div>
            {currentPlayer === "X" && gameStatus === "playing" && (
              <div className="text-xs mt-1 text-blue-700 bg-blue-100 inline-block px-2 py-0.5 rounded">Your Turn</div>
            )}
          </div>
          <div className="ml-auto text-2xl font-extrabold text-blue-700">{scoreX}</div>
        </div>

        {/* Center score separator for larger screens */}
        <div className="hidden sm:flex items-center justify-center text-lg font-bold text-green-800">VS</div>

        {/* Player 2 block */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="mr-auto text-2xl font-extrabold text-red-700">{scoreO}</div>
          <div>
            <div className="text-sm font-semibold text-red-900 truncate">
              {player2} <span className="text-xs text-red-500">(O)</span>
            </div>
            {currentPlayer === "O" && gameStatus === "playing" && (
              <div className="text-xs mt-1 text-red-700 bg-red-100 inline-block px-2 py-0.5 rounded">
                {gameMode === "player-vs-computer" ? "Computer Turn" : "Their Turn"}
              </div>
            )}
          </div>
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-md">
            {gameMode === "player-vs-computer" ? (
              <span className="text-white text-xl">🤖</span>
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

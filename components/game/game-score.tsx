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
    <div className="flex flex-col items-center justify-center gap-2 py-2">
      {/* DEBUG: Show the actual score props being received */}
      <div className="text-xs text-gray-400">DEBUG: scoreX={scoreX}, scoreO={scoreO}</div>
      <div className="flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span>{player1} (X)</span>
        <span className="text-blue-600 font-bold">{scoreX}</span>
        {currentPlayer === "X" && gameStatus === "playing" && (
          <span className="text-xs bg-blue-200 px-2 py-1 rounded">Your Turn</span>
        )}
      </div>
  <span className="mx-2">VS</span>
        <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
          {gameMode === "player-vs-computer" ? (
            <span className="text-white text-xs">🤖</span>
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <span>{player2} (O)</span>
        <span className="text-red-600 font-bold">{scoreO}</span>
        {currentPlayer === "O" && gameStatus === "playing" && (
          <span className="text-xs bg-red-200 px-2 py-1 rounded">
            {gameMode === "player-vs-computer" ? "Computer Turn" : "Turn"}
          </span>
        )}
      </div>
      </div>
    </div>
  )
}

"use client"

import React, { FC } from "react"
import { useGameStore } from "@/lib/stores/game-store"
import { formatTime } from "@/lib/utils/time"
import { Trophy, Clock, Users, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GameHeaderProps } from "@/lib/types"

type GameResultsProps = {
  onPlayAgain?: () => void;
  onBackToMenu?: () => void;
};

export const GameResults: FC<GameResultsProps> = ({ onPlayAgain, onBackToMenu }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold mb-4">Game Over</h2>
      <div className="flex gap-4">
        {onPlayAgain && (
          <Button onClick={onPlayAgain} className="bg-blue-500 text-white px-4 py-2 rounded">Play Again</Button>
        )}
        {onBackToMenu && (
          <Button onClick={onBackToMenu} className="bg-gray-500 text-white px-4 py-2 rounded">Back to Menu</Button>
        )}
      </div>
    </div>
  );
};

export function GameHeader({ timeLeft, showDebugInfo = false }: GameHeaderProps) {
  const { scores, gameStatus, currentPlayer, moveHistory, pauseGame, resumeGame } = useGameStore()

  const handlePauseResume = () => {
    if (gameStatus === "playing") {
      pauseGame()
    } else if (gameStatus === "paused") {
      resumeGame()
    }
  }

  return (
    <header className="bg-white shadow-sm border-b p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">MOOOVES</h1>

          <div className="flex items-center gap-4">
            {gameStatus === "playing" || gameStatus === "paused" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseResume}
                className="flex items-center gap-2 bg-transparent"
              >
                {gameStatus === "playing" ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                )}
              </Button>
            ) : null}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span className={timeLeft < 60 ? "text-red-600 font-bold" : ""}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">Player X</span>
              {currentPlayer === "X" && gameStatus === "playing" && (
                <span className="text-xs bg-blue-200 px-2 py-1 rounded">Turn</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-blue-600" />
              <span className="text-xl font-bold text-blue-900">{scores.X}</span>
            </div>
          </div>

          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-900">Player O</span>
              {currentPlayer === "O" && gameStatus === "playing" && (
                <span className="text-xs bg-red-200 px-2 py-1 rounded">Turn</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-red-600" />
              <span className="text-xl font-bold text-red-900">{scores.O}</span>
            </div>
          </div>
        </div>

        {showDebugInfo && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
            <p>
              Status: {gameStatus} | Moves: {moveHistory.length}
            </p>
          </div>
        )}
      </div>
    </header>
  )
}

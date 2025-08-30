"use client"

import { useGameStore } from "@/lib/stores/game-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, RotateCcw, Users, Clock, Target } from "lucide-react"
import { formatTime } from "@/lib/utils/time"
import type { GameResultsProps } from "@/lib/types"

export function GameResults({ onPlayAgain, onBackToMenu }: GameResultsProps) {
  const { initializeGame, getGameResult } = useGameStore()
  const result = getGameResult()

  const handlePlayAgain = () => {
    if (onPlayAgain) {
      onPlayAgain()
    } else {
      initializeGame()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">{result.isDraw ? "It's a Draw!" : `Player ${result.winner} Wins!`}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Player X</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{result.finalScores.X}</div>
              <div className="text-sm text-blue-700">points</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-900">Player O</span>
              </div>
              <div className="text-3xl font-bold text-red-900">{result.finalScores.O}</div>
              <div className="text-sm text-red-700">points</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="flex flex-col items-center gap-1">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="font-semibold">{result.usedSequences.length}</span>
              <span className="text-gray-600">Sequences</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="font-semibold">{result.totalMoves}</span>
              <span className="text-gray-600">Moves</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="font-semibold">{formatTime(Math.floor(result.gameDuration / 1000))}</span>
              <span className="text-gray-600">Duration</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePlayAgain} className="flex-1" size="lg">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            {onBackToMenu && (
              <Button onClick={onBackToMenu} variant="outline" size="lg">
                Menu
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useGameStore } from "@/lib/stores/game-store"
import { cn } from "@/lib/utils"
import { Cell } from "./cell"
import type { GameBoardProps } from "@/lib/types"
import { useEffect, useState } from "react"

export function GameBoard({ disabled = false, showCoordinates = false }: GameBoardProps) {
  const { board, makeMove, currentPlayer, gameStatus } = useGameStore()

  const handleCellClick = (row: number, col: number) => {
    if (disabled || gameStatus !== "playing") return
    makeMove(row, col)
  }

  const [isMobile, setIsMobile] = useState(false)
  const boardSize = 30; // Always use 30x30 grid
  const cellSize = isMobile ? 'minmax(24px, 1fr)' : 'minmax(10px, 1fr)';
  const displayBoard = board; // Use full board

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Set initial value
    checkIfMobile()

    // Add event listener
    window.addEventListener('resize', checkIfMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      <div className="w-full max-h-[80vh] overflow-auto border-2 border-gray-300 rounded-lg bg-white shadow-lg relative">
        {showCoordinates && (
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Grid: {boardSize}×{boardSize}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Current:</span>
              <span className={`px-2 py-1 rounded font-bold ${currentPlayer === 'X' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                {currentPlayer}
              </span>
            </div>
          </div>
        )}

        <div
          className="relative"
          style={{
            width: 'fit-content',
            minWidth: '100%',
          }}
        >
          {/* Scroll hint for mobile */}
          {isMobile && (
            <div className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 text-sm bg-white/90 px-2 py-1 rounded-full shadow-sm border border-gray-200 z-10">
              ← Scroll →
            </div>
          )}

          <div
            className="grid gap-px bg-gray-200 p-1"
            style={{
              gridTemplateColumns: `repeat(${boardSize}, ${cellSize})`,
              minHeight: showCoordinates ? 'calc(100% - 40px)' : '100%',
              width: 'fit-content',
            }}
          >
            {displayBoard.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  disabled={disabled || gameStatus !== "playing" || cell !== null}
                  row={rowIndex}
                  col={colIndex}
                  isMobile={isMobile}
                />
              )),
            )}
          </div>
        </div>
      </div>

      {gameStatus === "playing" && !disabled && (
        <div className="mt-4 text-center">
          <p className="text-lg font-semibold">
            Current Player:{" "}
            <span className={cn("font-bold truncate max-w-[150px] inline-block align-bottom", currentPlayer === "X" ? "text-blue-600" : "text-red-600")}>
              {currentPlayer}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

"use client"

import { useGameStore } from "@/lib/stores/game-store"
import { cn } from "@/lib/utils"
import { Cell } from "./cell"
import type { GameBoardProps } from "@/lib/types"

export function GameBoard({ disabled = false, showCoordinates = false }: GameBoardProps) {
  const { board, makeMove, currentPlayer, gameStatus } = useGameStore()

  const handleCellClick = (row: number, col: number) => {
    if (disabled || gameStatus !== "playing") return
    makeMove(row, col)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="aspect-square w-full max-h-[80vh] overflow-auto border-2 border-gray-300 rounded-lg bg-white shadow-lg">
        {showCoordinates && (
          <div className="text-xs text-gray-500 p-2 border-b">Grid: 30x30 | Current: {currentPlayer}</div>
        )}

        <div
          className="grid gap-px bg-gray-200 p-1"
          style={{
            gridTemplateColumns: "repeat(30, minmax(0, 1fr))",
            minHeight: showCoordinates ? "calc(100% - 40px)" : "100%",
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                value={cell}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                disabled={disabled || gameStatus !== "playing" || cell !== null}
                row={rowIndex}
                col={colIndex}
              />
            )),
          )}
        </div>
      </div>

      {gameStatus === "playing" && !disabled && (
        <div className="mt-4 text-center">
          <p className="text-lg font-semibold">
            Current Player:{" "}
            <span className={cn("font-bold", currentPlayer === "X" ? "text-blue-600" : "text-red-600")}>
              {currentPlayer}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

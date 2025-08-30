"use client"

import { useGameStore } from "@/lib/stores/game-store"
import { cn } from "@/lib/utils"
import type { CellProps } from "@/lib/types"

export function Cell({ value, onClick, disabled, row, col, isHighlighted = false }: CellProps) {
  const { usedSequences } = useGameStore()

  // Check if this cell is part of any used sequence
  const isPartOfUsedSequence = usedSequences.some((sequence) => sequence.some(([r, c]) => r === row && c === col))

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "game-cell",
        isPartOfUsedSequence && "game-cell--used",
        value === "X" && "game-cell--x",
        value === "O" && "game-cell--o",
        isHighlighted && "ring-2 ring-yellow-400",
        value && "animate-bounce-in",
      )}
    >
      {value && <span className={cn(isPartOfUsedSequence && "line-through decoration-2")}>{value}</span>}
    </button>
  )
}

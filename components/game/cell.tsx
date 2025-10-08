"use client"

import { cn } from "@/lib/utils"
import type { CellProps } from "@/lib/types"
import * as React from "react"

function CellInner({ value, onClick, disabled, isHighlighted = false, isUsed }: CellProps & { isUsed?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "game-cell",
        isUsed && "game-cell--used",
        value === "X" && "game-cell--x",
        value === "O" && "game-cell--o",
        isHighlighted && "ring-2 ring-yellow-400",
        value && "animate-bounce-in",
      )}
      style={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        color: value === "X" ? "#1e40af" : value === "O" ? "#dc2626" : "#1f2937",
        fontWeight: 700,
      }}
    >
      {value && <span className={cn(isUsed && "line-through decoration-2")}>{value}</span>}
    </button>
  )
}

export const Cell = React.memo(CellInner)

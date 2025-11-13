"use client"

import { cn } from "@/lib/utils"
import type { CellProps } from "@/lib/types"
import * as React from "react"

function CellInner({ value, onClick, disabled, isHighlighted = false, isUsed, isMobile = false }: CellProps & { isUsed?: boolean; isMobile?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "game-cell transition-all duration-200 active:scale-95",
        isUsed && "game-cell--used opacity-70",
        // Remove color-changing hovers to keep board green background consistent
        isHighlighted && "ring-2 ring-yellow-400 z-10",
        value && "animate-bounce-in",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        isMobile ? "min-w-[24px] min-h-[24px]" : "min-w-[10px] min-h-[10px]"
      )}
      style={{
        aspectRatio: "1/1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "1px solid rgba(0,0,0,0.06)",
        color: value === "X" ? "#1e40af" : value === "O" ? "#dc2626" : "transparent",
        fontWeight: 700,
        fontSize: isMobile ? '1.2rem' : '0.9rem',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span 
        className={cn(
          isUsed && "line-through decoration-2",
          "select-none pointer-events-none" // Prevent text selection and touch events
        )}
      >
        {value}
      </span>
    </button>
  )
}

export const Cell = React.memo(CellInner)

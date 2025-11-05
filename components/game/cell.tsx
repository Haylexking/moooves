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
        value === "X" && "game-cell--x hover:bg-blue-50 active:bg-blue-100",
        value === "O" && "game-cell--o hover:bg-red-50 active:bg-red-100",
        isHighlighted && "ring-2 ring-yellow-400 z-10",
        value && "animate-bounce-in",
        !value && !disabled && "hover:bg-gray-50 active:bg-gray-100",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        isMobile ? "min-w-[24px] min-h-[24px]" : "min-w-[10px] min-h-[10px]"
      )}
      style={{
        aspectRatio: "1/1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
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

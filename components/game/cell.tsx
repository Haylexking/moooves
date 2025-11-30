"use client"

import { cn } from "@/lib/utils"
import type { CellProps } from "@/lib/types"
import * as React from "react"

function CellInner({ value, onClick, disabled, isHighlighted = false, isUsed, isMobile = false, isCursor = false }: CellProps & { isUsed?: boolean; isMobile?: boolean; isCursor?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "game-cell transition-all duration-200 active:scale-95 relative",
        isUsed && "game-cell--used opacity-70",
        // Remove color-changing hovers to keep board green background consistent
        isHighlighted && "ring-2 ring-yellow-400 z-10",
        // Cursor styling
        isCursor && "ring-4 ring-blue-500 z-20 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110",
        value && "animate-bounce-in",
        disabled ? "opacity-50" : "cursor-pointer",
        isMobile ? "min-w-[16px] min-h-[16px]" : "min-w-[10px] min-h-[10px]"
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
        fontSize: isMobile ? '0.8rem' : '0.9rem',
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
      {/* Cursor crosshair indicator */}
      {isCursor && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-blue-500 rounded-full" />
        </div>
      )}
    </button>
  )
}

export const Cell = React.memo(CellInner)

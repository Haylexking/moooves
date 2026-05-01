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
        "game-cell transition-colors duration-150 relative",
        isUsed && "game-cell--used opacity-70",
        isHighlighted && "ring-2 ring-yellow-400 z-10",
        // Cursor: ring only, no scale — avoids transform conflict with animate-bounce-in
        isCursor && "ring-4 ring-blue-500 z-20 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
        value && "animate-bounce-in",
        disabled ? "opacity-50" : "cursor-pointer",
        isMobile ? "min-w-[10px] min-h-[10px]" : "min-w-[10px] min-h-[10px]"
      )}
      style={{
        aspectRatio: "1/1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        color: isUsed ? "#9ca3af" : value === "X" ? "#1e40af" : value === "O" ? "#dc2626" : "transparent",
        fontWeight: 700,
        fontSize: isMobile ? '0.5rem' : '0.9rem',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        className={cn(
          "select-none pointer-events-none",
          isUsed && "relative inline-block"
        )}
      >
        {value}
        {isUsed && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: "2px",
              backgroundColor: "#9ca3af",
              transform: "translateY(-50%)",
            }}
          />
        )}
      </span>
    </button>
  )
}

export const Cell = React.memo(CellInner)

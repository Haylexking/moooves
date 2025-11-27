"use client"

import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { useGameStore } from "@/lib/stores/game-store"
import { cn } from "@/lib/utils"

interface MobileControlsProps {
    onPlace: () => void
    disabled?: boolean
    playerSymbol: "X" | "O"
}

export function MobileControls({ onPlace, disabled, playerSymbol }: MobileControlsProps) {
    const moveCursor = useGameStore((state) => state.moveCursor)

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-2 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/5">
            {/* D-Pad */}
            <div className="relative w-28 h-28 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full p-1 shadow-inner border border-gray-700/50">
                {/* Inner circle for depth */}
                <div className="absolute inset-2 rounded-full bg-gray-900/50 shadow-inner" />

                {/* Up */}
                <button
                    onClick={() => moveCursor(-1, 0)}
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 active:from-green-600 active:to-green-700 rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-95 border border-white/5"
                    aria-label="Move Up"
                >
                    <ArrowUp className="w-5 h-5 text-gray-300" />
                </button>
                {/* Down */}
                <button
                    onClick={() => moveCursor(1, 0)}
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 active:from-green-600 active:to-green-700 rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-95 border border-white/5"
                    aria-label="Move Down"
                >
                    <ArrowDown className="w-5 h-5 text-gray-300" />
                </button>
                {/* Left */}
                <button
                    onClick={() => moveCursor(0, -1)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 active:from-green-600 active:to-green-700 rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-95 border border-white/5"
                    aria-label="Move Left"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-300" />
                </button>
                {/* Right */}
                <button
                    onClick={() => moveCursor(0, 1)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 active:from-green-600 active:to-green-700 rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-95 border border-white/5"
                    aria-label="Move Right"
                >
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                </button>

                {/* Center decorative dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-gray-800 to-black rounded-full border border-gray-700 shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500/50 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-white/10" />

            {/* Place Button */}
            <button
                onClick={onPlace}
                disabled={disabled}
                className={cn(
                    "w-20 h-20 rounded-full font-black text-xl tracking-wider uppercase shadow-[0_4px_14px_rgba(0,0,0,0.5)] transition-all active:scale-95 flex flex-col items-center justify-center gap-1 border-2",
                    disabled
                        ? "bg-gray-800/50 text-gray-600 border-gray-700 cursor-not-allowed"
                        : "bg-gradient-to-br from-green-500 to-green-700 text-white border-green-400 hover:from-green-400 hover:to-green-600 active:shadow-none"
                )}
            >
                <span className="text-[10px] font-bold opacity-80">PLACE</span>
                <span className={cn(
                    "text-3xl drop-shadow-md",
                    playerSymbol === "X" ? "text-white" : "text-white"
                )}>
                    {playerSymbol}
                </span>
            </button>
        </div>
    )
}

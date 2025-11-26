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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-green-800 p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                {/* D-Pad */}
                <div className="relative w-32 h-32 bg-gray-800/50 rounded-full p-2 shadow-inner border border-gray-700">
                    {/* Up */}
                    <button
                        onClick={() => moveCursor(-1, 0)}
                        className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-gray-700 hover:bg-gray-600 active:bg-green-600 rounded-lg flex items-center justify-center transition-colors shadow-md active:scale-95"
                        aria-label="Move Up"
                    >
                        <ArrowUp className="w-6 h-6 text-white" />
                    </button>
                    {/* Down */}
                    <button
                        onClick={() => moveCursor(1, 0)}
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-gray-700 hover:bg-gray-600 active:bg-green-600 rounded-lg flex items-center justify-center transition-colors shadow-md active:scale-95"
                        aria-label="Move Down"
                    >
                        <ArrowDown className="w-6 h-6 text-white" />
                    </button>
                    {/* Left */}
                    <button
                        onClick={() => moveCursor(0, -1)}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-700 hover:bg-gray-600 active:bg-green-600 rounded-lg flex items-center justify-center transition-colors shadow-md active:scale-95"
                        aria-label="Move Left"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    {/* Right */}
                    <button
                        onClick={() => moveCursor(0, 1)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-700 hover:bg-gray-600 active:bg-green-600 rounded-lg flex items-center justify-center transition-colors shadow-md active:scale-95"
                        aria-label="Move Right"
                    >
                        <ArrowRight className="w-6 h-6 text-white" />
                    </button>

                    {/* Center decorative dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-900 rounded-full border border-gray-600" />
                </div>

                {/* Place Button */}
                <button
                    onClick={onPlace}
                    disabled={disabled}
                    className={cn(
                        "flex-1 h-20 rounded-2xl font-black text-2xl tracking-wider uppercase shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                        disabled
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600"
                            : "bg-green-600 text-white hover:bg-green-500 border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                    )}
                >
                    <span>Place</span>
                    <span className={cn(
                        "text-3xl",
                        playerSymbol === "X" ? "text-blue-200" : "text-red-200"
                    )}>
                        {playerSymbol}
                    </span>
                </button>
            </div>
        </div>
    )
}

"use client"

import { useState } from "react"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Maximize2, Minimize2 } from "lucide-react"
import { useGameStore } from "@/lib/stores/game-store"
import { cn } from "@/lib/utils"

interface MobileControlsProps {
    onPlace: () => void
    disabled?: boolean
    playerSymbol: "X" | "O"
}

export function MobileControls({ onPlace, disabled, playerSymbol }: MobileControlsProps) {
    const moveCursor = useGameStore((state) => state.moveCursor)
    const [isExpanded, setIsExpanded] = useState(true)

    if (!isExpanded) {
        return (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-2 rounded-full bg-[#0f172a]/90 backdrop-blur-xl border border-green-500/20 shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-all active:scale-95 shadow-md border border-white/5"
                >
                    <Maximize2 className="w-6 h-6" />
                </button>

                <div className="w-px h-6 bg-white/10" />

                <button
                    onClick={onPlace}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all active:scale-95 shadow-md border border-white/5",
                        disabled
                            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-500"
                    )}
                >
                    <X className="w-6 h-6 stroke-[3]" />
                </button>
            </div>
        )
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between px-6 py-4 rounded-3xl bg-[#0f172a]/95 backdrop-blur-xl border border-green-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/5 animate-in slide-in-from-bottom-10 fade-in duration-300 max-w-md mx-auto">

            {/* D-Pad Section */}
            <div className="relative w-32 h-32 shrink-0">
                <div className="absolute inset-0 bg-gray-900/50 rounded-full border border-white/5 shadow-inner" />

                {/* Up */}
                <button
                    onClick={() => moveCursor(-1, 0)}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-gray-800 hover:bg-gray-700 active:bg-green-600 rounded-t-xl flex items-center justify-center transition-all active:scale-95 border-b border-black/20"
                    aria-label="Move Up"
                >
                    <ArrowUp className="w-5 h-5 text-gray-300" />
                </button>
                {/* Down */}
                <button
                    onClick={() => moveCursor(1, 0)}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-gray-800 hover:bg-gray-700 active:bg-green-600 rounded-b-xl flex items-center justify-center transition-all active:scale-95 border-t border-black/20"
                    aria-label="Move Down"
                >
                    <ArrowDown className="w-5 h-5 text-gray-300" />
                </button>
                {/* Left */}
                <button
                    onClick={() => moveCursor(0, -1)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-800 hover:bg-gray-700 active:bg-green-600 rounded-l-xl flex items-center justify-center transition-all active:scale-95 border-r border-black/20"
                    aria-label="Move Left"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-300" />
                </button>
                {/* Right */}
                <button
                    onClick={() => moveCursor(0, 1)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-800 hover:bg-gray-700 active:bg-green-600 rounded-r-xl flex items-center justify-center transition-all active:scale-95 border-l border-black/20"
                    aria-label="Move Right"
                >
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                </button>

                {/* Center Dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-900 rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                </div>
            </div>

            {/* Action Section (Centered) */}
            <div className="flex flex-col items-center gap-1 px-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Place</span>
                <button
                    onClick={onPlace}
                    disabled={disabled}
                    className={cn(
                        "w-20 h-20 rounded-2xl font-black text-4xl tracking-wider uppercase shadow-lg transition-all active:scale-95 flex items-center justify-center border-b-4 active:border-b-0 active:translate-y-1",
                        disabled
                            ? "bg-gray-800 text-gray-600 border-gray-900 cursor-not-allowed"
                            : "bg-green-600 text-white border-green-800 hover:bg-green-500 shadow-green-500/20"
                    )}
                >
                    {playerSymbol === 'X' ? <X className="w-12 h-12 stroke-[4]" /> : <div className="w-10 h-10 rounded-full border-[6px] border-white" />}
                </button>
            </div>

            {/* Minimize Button (Right) */}
            <button
                onClick={() => setIsExpanded(false)}
                className="w-12 h-12 flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 rounded-full border border-white/5 transition-all active:scale-95 shrink-0"
            >
                <Minimize2 className="w-6 h-6 text-gray-400" />
            </button>
        </div>
    )
}
